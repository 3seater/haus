import {createHash} from 'node:crypto';
import {PublicKey} from '@solana/web3.js';
import {u64} from './vault-addresses';
export type HolderBalance={wallet:string;amount:string};
export type SnapshotMember=HolderBalance&{proof:string[]};
export type RewardSnapshot={version:1;round:string;slot:number;root:string;eligibleSupply:string;members:SnapshotMember[]};
const digest=(...parts:Uint8Array[])=>createHash('sha256').update(Buffer.concat(parts)).digest();
function leaf(round:string,wallet:string,amount:bigint){return digest(Buffer.from('haus-holder-v1'),new PublicKey(round).toBuffer(),new PublicKey(wallet).toBuffer(),u64(amount));}
function node(a:Buffer,b:Buffer){return digest(Buffer.from('haus-node-v1'),...([a,b].sort(Buffer.compare)));}
/** Input must come from one finalized, complete snapshot, never top-20/current mixed reads. */
export function buildRewardSnapshot(round:string,slot:number,accounts:HolderBalance[],excludedOwners:ReadonlySet<string>):RewardSnapshot {
 new PublicKey(round);
 if(!Number.isSafeInteger(slot)||slot<0)throw new Error('Invalid finalized slot');
 const owners=new Map<string,bigint>();
 for(const account of accounts){
  const owner=new PublicKey(account.wallet);
  if(!/^(0|[1-9]\d*)$/.test(account.amount))throw new Error('Invalid balance');
  const amount=BigInt(account.amount);u64(amount);
  // Program addresses cannot sign ballots/claims. Explicit pool/custody exclusions are still required.
  if(excludedOwners.has(account.wallet)||!PublicKey.isOnCurve(owner.toBytes())||amount===0n)continue;
  const total=(owners.get(account.wallet)??0n)+amount;u64(total);owners.set(account.wallet,total);
 }
 const entries=[...owners.entries()].sort(([a],[b])=>a<b?-1:a>b?1:0);
 if(!entries.length)throw new Error('No eligible holders');
 const eligible=entries.reduce((sum,[,amount])=>sum+amount,0n);u64(eligible);
 const levels:Buffer[][]=[entries.map(([wallet,amount])=>leaf(round,wallet,amount))];
 while(levels.at(-1)!.length>1){const previous=levels.at(-1)!,next:Buffer[]=[];for(let i=0;i<previous.length;i+=2)next.push(node(previous[i],previous[i+1]??previous[i]));levels.push(next);}
 const members=entries.map(([wallet,amount],i)=>{const proof:string[]=[];let index=i;for(const level of levels.slice(0,-1)){proof.push((level[index^1]??level[index]).toString('hex'));index=Math.floor(index/2);}return {wallet,amount:amount.toString(),proof};});
 return {version:1,round,slot,root:levels.at(-1)![0].toString('hex'),eligibleSupply:eligible.toString(),members};
}
export function verifyRewardProof(round:string,wallet:string,amount:string,proof:string[],root:string){
 try{
  if(!/^[1-9]\d*$/.test(amount)||!/^[a-f0-9]{64}$/.test(root)||proof.length>32||proof.some(hash=>!/^[a-f0-9]{64}$/.test(hash)))return false;
  let hash=leaf(round,wallet,BigInt(amount));for(const sibling of proof)hash=node(hash,Buffer.from(sibling,'hex'));return hash.toString('hex')===root;
 }catch{return false;}
}
export function holderEntitlement(budget:bigint,weight:bigint,eligibleSupply:bigint){
 for(const n of [budget,weight,eligibleSupply])u64(n);
 if(eligibleSupply===0n||weight>eligibleSupply)throw new Error('Invalid eligible supply');
 return budget*weight/eligibleSupply;
}
export function snapshotManifestHash(snapshot:RewardSnapshot){return createHash('sha256').update(JSON.stringify(snapshot)).digest('hex');}
