import { redis } from './redis';
export type LaunchRecord = { mintAddress:string; name:string; symbol:string; description:string; imageUrl:string; metadataUri:string; creatorWallet:string; creatorRecipient?:string; vaultProgram?:string; createdAt?:string; status:'PENDING'|'ACTIVE'; launchSignature?:string; launchSlot?:number; totalSupply?:string };
export async function saveLaunch(record:LaunchRecord) {
 const tx=redis().multi().set(`haus:token:${record.mintAddress}`,JSON.stringify(record));
 if(record.status==='ACTIVE')tx.zadd('haus:active-tokens',record.launchSlot??0,record.mintAddress);
 const result=await tx.exec();if(!result||result.some(([error])=>error))throw new Error('Could not persist launch');
}
export async function readLaunch(mint:string):Promise<LaunchRecord|null> { const raw=await redis().get(`haus:token:${mint}`); return raw ? JSON.parse(raw) : null; }
export async function activeLaunches(limit=90):Promise<LaunchRecord[]> {
 if(!process.env.REDIS_URL)return [];
 const mints=await redis().zrevrange('haus:active-tokens',0,limit===0?-1:limit-1);
 if(!mints.length)return [];
 const records=await redis().mget(...mints.map(mint=>`haus:token:${mint}`));
 return records.flatMap(raw=>{if(!raw)return [];const record:LaunchRecord=JSON.parse(raw);return record.status==='ACTIVE'?[record]:[];});
}
