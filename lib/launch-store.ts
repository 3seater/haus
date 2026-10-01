import { redis } from './redis';
export type LaunchRecord = { mintAddress:string; name:string; symbol:string; description:string; imageUrl:string; metadataUri:string; creatorWallet:string; status:'PENDING'|'ACTIVE'; launchSignature?:string; launchSlot?:number; totalSupply?:string };
export async function saveLaunch(record:LaunchRecord) { await redis().set(`haus:token:${record.mintAddress}`,JSON.stringify(record)); }
export async function readLaunch(mint:string):Promise<LaunchRecord|null> { const raw=await redis().get(`haus:token:${mint}`); return raw ? JSON.parse(raw) : null; }
