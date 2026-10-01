import {PublicKey} from '@solana/web3.js';
import type {Coin} from './haus-data';
import {activeLaunches,readLaunch} from './launch-store';
import {launchCoin} from './launch-coin';
export async function registeredCoin(mint:string|null):Promise<Coin|null> {
 if(!mint)return null;
 try{if(new PublicKey(mint).toBase58()!==mint)return null;}catch{return null;}
 if(!process.env.REDIS_URL)return null;
 const record=await readLaunch(mint);return record?.status==='ACTIVE'?launchCoin(record):null;
}
export async function registeredCoins():Promise<Coin[]> {
 const launched=(await activeLaunches()).map(launchCoin);
 return launched;
}
