import {PublicKey,Transaction} from '@solana/web3.js';
import {z} from 'zod';
import {route,json,origin} from '@/lib/http';
import {HttpError} from '@/lib/config';
import {readLaunch} from '@/lib/launch-store';
import {verifiedVaultDeployment} from '@/lib/vault-deployment';
import {OWNER_AUTHORITY,vaultAddress,decodeVault,roundAddress,decodeRound,governanceInstruction} from '@/lib/vault-addresses';
import {readSnapshot} from '@/lib/snapshot-store';
import {holderEntitlement,snapshotManifestHash,verifyRewardProof} from '@/lib/reward-snapshot';
import {rpc} from '@/lib/solana';
import {walletSchema} from '@/lib/auth';
import {rateLimit} from '@/lib/redis';
import type {PublicVault,PublicRound} from '@/lib/vault-types';
export const runtime='nodejs';
export const dynamic='force-dynamic';
async function context(mint:string){
 const token=process.env.REDIS_URL?await readLaunch(mint):null;
 if(!token||token.status!=='ACTIVE'||!token.vaultProgram)throw new HttpError(404,'This token does not have a verified HAUS launch vault.');
 const {program,config}=await verifiedVaultDeployment();
 if(token.vaultProgram!==program.toBase58())throw new HttpError(409,'Vault belongs to a different program release.');
 const address=vaultAddress(program,new PublicKey(mint));
 if(token.creatorRecipient!==address.toBase58())throw new HttpError(409,'Vault recipient mismatch.');
 const account=await rpc().getAccountInfo(address,'finalized');if(!account||!account.owner.equals(program))throw new HttpError(409,'Vault is unavailable.');
 const state=decodeVault(account.data);if(state.mint.toBase58()!==mint||state.developer.toBase58()!==token.creatorWallet)throw new HttpError(409,'Vault identity mismatch.');
 return {program,config,address,account,state};
}
async function member(roundAddressValue:string,round:ReturnType<typeof decodeRound>,wallet:string){
 const snapshot=await readSnapshot(roundAddressValue);
 if(snapshot.round!==roundAddressValue||snapshot.root!==round.root||snapshot.eligibleSupply!==round.eligibleSupply.toString()||snapshot.slot!==Number(round.snapshotSlot)||snapshotManifestHash(snapshot)!==round.manifestHash)throw new HttpError(503,'Snapshot does not match the on-chain commitment.');
 const found=snapshot.members.find(item=>item.wallet===wallet);
 if(found&&!verifyRewardProof(roundAddressValue,wallet,found.amount,found.proof,round.root))throw new HttpError(503,'Invalid holder proof.');
 return found;
}
export const GET=route(async request=>{
 const query=new URL(request.url).searchParams;
 const mint=z.string().min(32).max(44).parse(query.get('mint'));
 const wallet=query.get('wallet')?walletSchema.parse(query.get('wallet')):null;
 const before=query.get('before');if(before&&!/^\d{1,20}$/.test(before))throw new HttpError(400,'Invalid round cursor.');
 let ctx;try{ctx=await context(mint);}catch(error){if(error instanceof HttpError)return json({enabled:false,reason:error.message,ownerAuthority:OWNER_AUTHORITY,rounds:[]} satisfies PublicVault);throw error;}
 const {program,address,account,state}=ctx;
 const upper=before?BigInt(before):state.nextRound;
 if(upper>state.nextRound)throw new HttpError(400,'Invalid round cursor.');
 const lower=upper>10n?upper-10n:0n,ids:bigint[]=[];for(let id=upper;id>lower;)ids.push(--id);
 const addresses=ids.map(id=>roundAddress(program,address,id));
 const accounts=addresses.length?await rpc().getMultipleAccountsInfo(addresses,'finalized'):[];
 const rounds:PublicRound[]=[];
 for(let i=0;i<accounts.length;i++){
  const data=accounts[i];if(!data||!data.owner.equals(program))throw new HttpError(503,'Round history is unavailable.');
  const round=decodeRound(data.data);if(!round.vault.equals(address)||round.id!==ids[i])throw new HttpError(503,'Invalid round identity.');
  let weight=0n,proofAvailable=false,claimed=false;
  if(wallet){try{const found=await member(addresses[i].toBase58(),round,wallet);weight=BigInt(found?.amount??'0');proofAvailable=!!found;}catch{/* Leave claims unavailable when immutable evidence is missing. */}
   const receipt=PublicKey.findProgramAddressSync([Buffer.from('claim'),addresses[i].toBuffer(),new PublicKey(wallet).toBuffer()],program)[0];
   const receiptAccount=await rpc().getAccountInfo(receipt,'finalized');claimed=!!receiptAccount&&receiptAccount.owner.equals(program);
  }
  const ready=round.finalized&&BigInt(Math.floor(Date.now()/1000))>=round.executeAfter;
  const entitlement=ready&&round.outcome===1&&proofAvailable&&!claimed?holderEntitlement(round.budget,weight,round.eligibleSupply):ready&&round.outcome===2&&wallet===state.developer.toBase58()?round.remaining:0n;
  rounds.push({id:round.id.toString(),address:addresses[i].toBase58(),budget:round.budget.toString(),remaining:round.remaining.toString(),closesAt:Number(round.closesAt),executeAfter:Number(round.executeAfter),quorumBps:round.quorumBps,votes:round.votes.map(String),finalized:round.finalized,outcome:(['hold','holders','developer'] as const)[round.outcome],eligibleSupply:round.eligibleSupply.toString(),weight:weight.toString(),claimable:entitlement.toString(),claimed,proofAvailable});
 }
 const rent=await rpc().getMinimumBalanceForRentExemption(account.data.length);
 return json({enabled:true,ownerAuthority:OWNER_AUTHORITY,address:address.toBase58(),developer:state.developer.toBase58(),balance:Math.max(0,account.lamports-rent).toString(),rounds,...(lower>0n?{nextBefore:lower.toString()}:{})} satisfies PublicVault);
});
export const POST=route(async request=>{
 origin(request);
 const body=z.object({mint:z.string().min(32).max(44),wallet:walletSchema,round:z.string().regex(/^\d{1,20}$/),action:z.enum(['vote','claim_holder','claim_developer']),choice:z.number().int().min(0).max(2).optional()}).parse(await request.json());
 await rateLimit(`vault-prepare:${body.wallet}`,20,60);
 const {program,address,state}=await context(body.mint);
 const id=BigInt(body.round);if(id>=state.nextRound)throw new HttpError(404,'Unknown round.');
 const roundKey=roundAddress(program,address,id),account=await rpc().getAccountInfo(roundKey,'finalized');
 if(!account||!account.owner.equals(program))throw new HttpError(404,'Unknown round.');
 const round=decodeRound(account.data);if(!round.vault.equals(address)||round.id!==id)throw new HttpError(409,'Round identity mismatch.');
 let weight=0n,proof:string[]=[];
 if(body.action!=='claim_developer'){
  const found=await member(roundKey.toBase58(),round,body.wallet);if(!found)throw new HttpError(403,'This wallet was not eligible at the round snapshot.');weight=BigInt(found.amount);proof=found.proof;
 }else if(state.developer.toBase58()!==body.wallet)throw new HttpError(403,'Only this token’s developer can claim its developer allocation.');
 const now=BigInt(Math.floor(Date.now()/1000));
 if(body.action==='vote'&&(body.choice===undefined||round.finalized||now>=round.closesAt))throw new HttpError(409,'Voting is closed or the choice is missing.');
 if(body.action!=='vote'&&(!round.finalized||now<round.executeAfter||round.outcome!==(body.action==='claim_holder'?1:2)))throw new HttpError(409,'This allocation is not claimable.');
 const block=await rpc().getLatestBlockhash('confirmed');
 const tx=new Transaction({feePayer:new PublicKey(body.wallet),...block}).add(governanceInstruction(program,address,roundKey,new PublicKey(body.wallet),body.action,weight,proof,body.choice??0));
 return json({transaction:tx.serialize({requireAllSignatures:false}).toString('base64'),program:program.toBase58(),round:roundKey.toBase58(),...block});
});
