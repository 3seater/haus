import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {PublicKey} from '@solana/web3.js';
import {buildRewardSnapshot,snapshotManifestHash,type RewardSnapshot} from './reward-snapshot';
import {redis} from './redis';
const directory=()=>path.join(process.cwd(),'.haus-data','snapshots');
function file(round:string){return path.join(directory(),`${new PublicKey(round).toBase58()}.json`);}
const key=(round:string)=>`reward-snapshot:${new PublicKey(round).toBase58()}`;
/** Two copies are required before opening a round: local volume and hosted Redis. No TTL. */
export async function persistSnapshot(snapshot:RewardSnapshot){
 const rebuilt=buildRewardSnapshot(snapshot.round,snapshot.slot,snapshot.members,new Set());
 if(snapshotManifestHash(rebuilt)!==snapshotManifestHash(snapshot))throw new Error('Snapshot manifest is inconsistent');
 await mkdir(directory(),{recursive:true});
 try{await writeFile(file(snapshot.round),JSON.stringify(snapshot),{flag:'wx'});}
 catch(error){if((error as NodeJS.ErrnoException).code!=='EEXIST')throw error;const previous=JSON.parse(await readFile(file(snapshot.round),'utf8'));if(snapshotManifestHash(previous)!==snapshotManifestHash(snapshot))throw new Error('A different immutable snapshot already exists for this round');}
 const stored=await redis().set(key(snapshot.round),JSON.stringify(snapshot),'NX');
 if(!stored){const previous=await redis().get(key(snapshot.round));if(!previous||snapshotManifestHash(JSON.parse(previous))!==snapshotManifestHash(snapshot))throw new Error('Remote snapshot conflict');}
}
export async function readSnapshot(round:string):Promise<RewardSnapshot>{
 const remote=await redis().get(key(round));
 if(remote)return JSON.parse(remote);
 return JSON.parse(await readFile(file(round),'utf8'));
}
