import {readFile} from 'node:fs/promises';
import {Keypair,PublicKey,Transaction,sendAndConfirmTransaction} from '@solana/web3.js';
import {activeLaunches} from '../lib/launch-store';
import {verifiedVaultDeployment} from '../lib/vault-deployment';
import {decodeVault,decodeRound,vaultAddress,roundAddress,openRoundInstruction,finalizeRoundInstruction} from '../lib/vault-addresses';
import {feeCollectionInstructions} from '../lib/fee-collection';
import {captureHolderSnapshot} from '../lib/holder-snapshot';
import {persistSnapshot,readSnapshot} from '../lib/snapshot-store';
import {snapshotManifestHash} from '../lib/reward-snapshot';
import {rpc} from '../lib/solana';
import {loadEnvConfig} from '@next/env';
import {withWorkerLease} from '../lib/worker-lease';
loadEnvConfig(process.cwd());

// Explicit opt-in; default execution only reports readiness and NEVER signs.
async function main(assertLease:()=>Promise<void>){
 const execute=process.argv.includes('--execute');
 const {program,config}=await verifiedVaultDeployment();
 if(await rpc().getGenesisHash()!=='5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d')throw new Error('Worker requires mainnet RPC');
 if(execute&&(process.env.HAUS_WORKER_ENABLED!=='true'||!process.env.HAUS_WORKER_KEYPAIR_PATH))throw new Error('Worker execution is not configured');
 const signer=execute?Keypair.fromSecretKey(Uint8Array.from(JSON.parse(await readFile(process.env.HAUS_WORKER_KEYPAIR_PATH!,'utf8')))):null;
 if(signer&&!signer.publicKey.equals(config.snapshotAuthority))throw new Error('Worker does not match snapshot authority');
 const send=async(instructions:Parameters<Transaction['add']>)=>{
  if(!signer)return;
  await assertLease();
  const tx=new Transaction().add(...instructions);
  const signature=await sendAndConfirmTransaction(rpc(),tx,[signer],{commitment:'finalized',preflightCommitment:'confirmed',skipPreflight:false});
  console.log(JSON.stringify({event:'worker_transaction',signature}));
 };
 for(const token of await activeLaunches(0)){
  if(token.vaultProgram!==program.toBase58())continue;
  try{
   const mint=new PublicKey(token.mintAddress),vault=vaultAddress(program,mint);
   if(token.creatorRecipient!==vault.toBase58())throw new Error('Registry recipient mismatch');
   let account=await rpc().getAccountInfo(vault,'finalized');
   if(!account||!account.owner.equals(program))throw new Error('Missing vault');
   const state=decodeVault(account.data);
   if(!state.mint.equals(mint)||state.developer.toBase58()!==token.creatorWallet)throw new Error('Vault identity mismatch');
   // Check source existence to avoid empty-source ATA costs and failed collections.
   const prospective=feeCollectionInstructions(program,mint,signer?.publicKey??config.snapshotAuthority,true,true);
   const [curveSource,ammSource]=await rpc().getMultipleAccountsInfo([prospective[0].keys[2].pubkey,prospective[2].keys[4].pubkey],'finalized');
   if(signer){
    const curveRent=curveSource?await rpc().getMinimumBalanceForRentExemption(curveSource.data.length):0;
    const curve=!!curveSource&&curveSource.lamports>curveRent;
    const amm=!!ammSource&&ammSource.data.length>=72&&ammSource.data.readBigUInt64LE(64)>0n;
    if(curve||amm)await send(feeCollectionInstructions(program,mint,signer.publicKey,curve,amm));
    account=await rpc().getAccountInfo(vault,'finalized');if(!account)throw new Error('Missing vault');
   }
   const now=BigInt(Math.floor(Date.now()/1000));
   if(state.nextRound>0n){
    const address=roundAddress(program,vault,state.nextRound-1n),previous=await rpc().getAccountInfo(address,'finalized');
    if(!previous||!previous.owner.equals(program))throw new Error('Missing prior round');
    const round=decodeRound(previous.data);
    if(!round.finalized){if(now>=round.closesAt&&signer)await send([finalizeRoundInstruction(program,vault,address)]);else continue;}
   }
   const due=state.nextRound===0n?state.createdAt+config.firstDelay:state.lastOpenedAt+config.period;
   const rent=await rpc().getMinimumBalanceForRentExemption(account.data.length);
   if(now<due||BigInt(account.lamports-rent)<config.minimumBudget)continue;
   console.log(JSON.stringify({event:'round_due',mint:token.mintAddress,round:state.nextRound.toString(),dryRun:!execute}));
   if(!signer)continue;
   // Explicit exclusions must be reviewed before snapshots may be published.
   if(process.env.HAUS_SNAPSHOT_POLICY_APPROVED!=='true')throw new Error('Holder exclusion policy is not approved');
   const exclusions=new Set<string>([vault.toBase58(),...(process.env.HAUS_EXCLUDED_OWNERS||'').split(',').filter(Boolean)]);
   const address=roundAddress(program,vault,state.nextRound);
   let snapshot;
   try{snapshot=await readSnapshot(address.toBase58());}
   catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;snapshot=await captureHolderSnapshot(mint,address,exclusions);}
   await persistSnapshot(snapshot);
   // Retrying reuses the exact immutable manifest; the round PDA prevents duplicate opens.
   await send([openRoundInstruction(program,vault,state.nextRound,signer.publicKey,snapshot.root,BigInt(snapshot.eligibleSupply),BigInt(snapshot.slot),snapshotManifestHash(snapshot))]);
  }catch(error){console.error(JSON.stringify({event:'worker_token_failed',mint:token.mintAddress,error:error instanceof Error?error.message:'Unknown failure'}));process.exitCode=1;}
 }
}
withWorkerLease(main).catch(()=>{console.error('Worker stopped: check deployment, RPC, Redis, lease and worker configuration.');process.exitCode=1;}).finally(()=>process.exit(process.exitCode??0));
