import assert from 'node:assert/strict';
import {Connection,Keypair,PublicKey,SystemProgram,Transaction,TransactionInstruction,ComputeBudgetProgram,sendAndConfirmTransaction,type Signer} from '@solana/web3.js';
import {createInitializeMintInstruction,MINT_SIZE,TOKEN_2022_PROGRAM_ID,createAssociatedTokenAccountIdempotentInstruction,getAssociatedTokenAddressSync,NATIVE_MINT,TOKEN_PROGRAM_ID,createSyncNativeInstruction} from '@solana/spl-token';
import {configAddress,decodeVaultConfig,decodeVault,decodeRound,discriminator,u64,vaultAddress,roundAddress,initializeVaultInstruction,openRoundInstruction,finalizeRoundInstruction,governanceInstruction} from '../lib/vault-addresses';
import {buildRewardSnapshot,snapshotManifestHash} from '../lib/reward-snapshot';

// Public, reproducible, TEST ONLY authority. Never fund this key on a real cluster.
const owner=Keypair.fromSeed(Buffer.alloc(32,77));
const rpc=new Connection('http://127.0.0.1:8897','confirmed');
const program=new PublicKey('FBVrAjsfxzA6ENq2vaf7Szwzj213uLsHMidYh6SRTu75');
const loader=new PublicKey('BPFLoaderUpgradeab1e11111111111111111111111');
const config=configAddress(program),programData=PublicKey.findProgramAddressSync([program.toBytes()],loader)[0];
const meta=(pubkey:PublicKey,isWritable=false,isSigner=false)=>({pubkey,isWritable,isSigner});
let sequence=0,checks=0;
async function send(ixs:TransactionInstruction[],signers:Signer[]=[]){
 const tx=new Transaction().add(ComputeBudgetProgram.setComputeUnitPrice({microLamports:++sequence}),...ixs);
 return sendAndConfirmTransaction(rpc,tx,[owner,...signers.filter(s=>!s.publicKey.equals(owner.publicKey))],{commitment:'confirmed',preflightCommitment:'confirmed'});
}
async function rejected(ix:TransactionInstruction,signers:Signer[],reason:RegExp){
 await assert.rejects(send([ix],signers),error=>reason.test(String(error)+' '+JSON.stringify((error as {logs?:string[]}).logs)));checks++;
}
const admin=(name:string,data:Buffer,authority=owner.publicKey)=>new TransactionInstruction({programId:program,keys:[meta(authority,false,true),meta(config,true)],data:Buffer.concat([discriminator('global',name),data])});
async function main(){
 assert.notEqual(await rpc.getGenesisHash(),'5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d');
 const airdrop=await rpc.requestAirdrop(owner.publicKey,20_000_000_000);await rpc.confirmTransaction(airdrop,'confirmed');
 const publisher=Keypair.generate(),dev=Keypair.generate(),holder=Keypair.generate(),nonvoter=Keypair.generate(),attacker=Keypair.generate();
 await send([publisher,dev,holder,nonvoter,attacker].map(k=>SystemProgram.transfer({fromPubkey:owner.publicKey,toPubkey:k.publicKey,lamports:1_000_000_000})));
 const policy=Buffer.concat([u64(0n),u64(60n),u64(60n),u64(0n),Buffer.from([0xe8,0x03]),u64(1n)]);
 const initialize=(authority:PublicKey)=>new TransactionInstruction({programId:program,keys:[meta(authority,true,true),meta(program),meta(programData),meta(config,true),meta(SystemProgram.programId)],data:Buffer.concat([discriminator('global','initialize_config'),publisher.publicKey.toBuffer(),policy])});
 await rejected(initialize(attacker.publicKey),[attacker],/Authority/);
 await send([initialize(owner.publicKey)]);assert.equal(decodeVaultConfig((await rpc.getAccountInfo(config))!.data).authority.toBase58(),owner.publicKey.toBase58());checks++;
 await rejected(admin('set_paused',Buffer.from([1]),attacker.publicKey),[attacker],/ConstraintHasOne/);
 const cases=[];
 for(const outcome of [0,1,2]){
  const mint=Keypair.generate(),vault=vaultAddress(program,mint.publicKey),round=roundAddress(program,vault,0n);
  await send([SystemProgram.createAccount({fromPubkey:owner.publicKey,newAccountPubkey:mint.publicKey,lamports:await rpc.getMinimumBalanceForRentExemption(MINT_SIZE),space:MINT_SIZE,programId:TOKEN_2022_PROGRAM_ID}),createInitializeMintInstruction(mint.publicKey,6,dev.publicKey,null,TOKEN_2022_PROGRAM_ID),initializeVaultInstruction(program,mint.publicKey,dev.publicKey)],[mint,dev]);
  assert.equal(decodeVault((await rpc.getAccountInfo(vault))!.data).developer.toBase58(),dev.publicKey.toBase58());checks++;
  await send([SystemProgram.transfer({fromPubkey:owner.publicKey,toPubkey:vault,lamports:100_000_000})]);
  const snapshot=buildRewardSnapshot(round.toBase58(),await rpc.getSlot(),[{wallet:holder.publicKey.toBase58(),amount:'60'},{wallet:nonvoter.publicKey.toBase58(),amount:'40'}],new Set());
  const open=(authority:PublicKey)=>openRoundInstruction(program,vault,0n,authority,snapshot.root,100n,BigInt(snapshot.slot),snapshotManifestHash(snapshot));
  await rejected(open(attacker.publicKey),[attacker],/ConstraintHasOne/);
  await send([open(publisher.publicKey)],[publisher]);
  const data=decodeRound((await rpc.getAccountInfo(round))!.data);assert.equal(data.budget,100_000_000n);checks++;
  const member=snapshot.members.find(m=>m.wallet===holder.publicKey.toBase58())!;
  await rejected(governanceInstruction(program,vault,round,holder.publicKey,'vote',61n,member.proof,outcome),[holder],/Snapshot/);
  if(outcome!==0){
   await send([governanceInstruction(program,vault,round,holder.publicKey,'vote',60n,member.proof,0)],[holder]);
   await send([governanceInstruction(program,vault,round,holder.publicKey,'vote',60n,member.proof,outcome)],[holder]);
   assert.equal(decodeRound((await rpc.getAccountInfo(round))!.data).votes[outcome],60n);checks++;
  }
  await rejected(finalizeRoundInstruction(program,vault,round),[],/Closed/);
  await rejected(governanceInstruction(program,vault,round,holder.publicKey,'claim_holder',60n,member.proof),[holder],/NotClaimable/);
  // New revenue must not enlarge the already reserved round budget.
  await send([SystemProgram.transfer({fromPubkey:owner.publicKey,toPubkey:vault,lamports:10_000_000})]);
  cases.push({outcome,mint,vault,round,snapshot,closesAt:data.closesAt});
 }
 await send([admin('set_paused',Buffer.from([1]))]);
 const target=cases[1],member=target.snapshot.members.find(m=>m.wallet===holder.publicKey.toBase58())!;
 await rejected(governanceInstruction(program,target.vault,target.round,holder.publicKey,'vote',60n,member.proof,1),[holder],/Paused/);
 await send([admin('set_paused',Buffer.from([0]))]);
 // Exercise actual SPL Token CPI: only the owning vault receives unwrapped SOL.
 const wrapped=getAssociatedTokenAddressSync(NATIVE_MINT,target.vault,true);
 await send([createAssociatedTokenAccountIdempotentInstruction(owner.publicKey,wrapped,target.vault,NATIVE_MINT),SystemProgram.transfer({fromPubkey:owner.publicKey,toPubkey:wrapped,lamports:5_000_000}),createSyncNativeInstruction(wrapped)]);
 const beforeUnwrap=await rpc.getBalance(target.vault),wrappedBalance=await rpc.getBalance(wrapped);
 await send([new TransactionInstruction({programId:program,keys:[meta(target.vault,true),meta(wrapped,true),meta(TOKEN_PROGRAM_ID)],data:discriminator('global','unwrap_fees')})]);
 assert.equal(await rpc.getBalance(target.vault),beforeUnwrap+wrappedBalance);assert.equal(await rpc.getAccountInfo(wrapped),null);checks++;
 console.log('Local contract checks: custody, authorization, proof rejection, ballot replacement, pause and WSOL collection passed. Waiting for the 60-second test ballot window.');
 const end=Number(cases.reduce((max,c)=>c.closesAt>max?c.closesAt:max,0n));
 while(true){const slot=await rpc.getSlot();const now=await rpc.getBlockTime(slot);if(now!==null&&now>=end)break;await new Promise(resolve=>setTimeout(resolve,3000));}
 for(const item of cases){
  const beforeVault=await rpc.getBalance(item.vault);
  await send([finalizeRoundInstruction(program,item.vault,item.round)]);
  const round=decodeRound((await rpc.getAccountInfo(item.round))!.data);assert.equal(round.outcome,item.outcome);checks++;
  if(item.outcome===0){assert.equal(await rpc.getBalance(item.vault),beforeVault+100_000_000);assert.equal(round.remaining,0n);checks++;}
  if(item.outcome===1){
   await rejected(governanceInstruction(program,item.vault,item.round,dev.publicKey,'claim_developer'),[dev],/NotClaimable/);
   for(const wallet of [holder,nonvoter]){
    const m=item.snapshot.members.find(m=>m.wallet===wallet.publicKey.toBase58())!,claim=governanceInstruction(program,item.vault,item.round,wallet.publicKey,'claim_holder',BigInt(m.amount),m.proof);
    const before=await rpc.getBalance(wallet.publicKey),rent=await rpc.getMinimumBalanceForRentExemption(16);
    await send([claim],[wallet]);assert.equal(await rpc.getBalance(wallet.publicKey),before+Number(BigInt(m.amount)*1_000_000n)-rent);checks++;
    await rejected(claim,[wallet],/already in use/);
   }
  }
  if(item.outcome===2){
   await rejected(governanceInstruction(program,item.vault,item.round,attacker.publicKey,'claim_developer'),[attacker],/ConstraintHasOne/);
   const before=await rpc.getBalance(dev.publicKey),claim=governanceInstruction(program,item.vault,item.round,dev.publicKey,'claim_developer');
   await send([claim],[dev]);assert.equal(await rpc.getBalance(dev.publicKey),before+100_000_000);checks++;
   await rejected(claim,[dev],/Budget/);
  }
 }
 console.log(JSON.stringify({result:'PASS',checks,cluster:'isolated local validator',realSolSpent:0}));
}
main().catch(error=>{console.error(error);process.exitCode=1;});
