import {NextResponse} from 'next/server';
import {PublicKey} from '@solana/web3.js';
import {bondingCurvePda,PUMP_PROGRAM_ID,PUMP_SDK} from '@pump-fun/pump-sdk';
import {coins} from '@/lib/haus-data';
import {normalizeMarket,selectMarketPair,type DexPair,type MarketCoin} from '@/lib/market-data';
export const runtime='nodejs';
export const dynamic='force-dynamic';
type MarketResponse={coins:MarketCoin[];fetchedAt:string};
let cached:MarketResponse|null=null;
let expires=0;
let inFlight:Promise<MarketResponse>|null=null;
async function readCurves(){
 try{
  const response=await fetch(process.env.SOLANA_RPC_URL||'https://api.mainnet-beta.solana.com',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'getMultipleAccounts',params:[coins.map(c=>bondingCurvePda(c.mint).toBase58()),{encoding:'base64',commitment:'confirmed'}]}),signal:AbortSignal.timeout(7000),cache:'no-store'});
  if(!response.ok)return null;const payload=await response.json();
  return (payload.result?.value as ({data:[string,string];owner:string;lamports:number;executable:boolean;rentEpoch:number}|null)[]|undefined)?.map(account=>{
   if(!account||account.owner!==PUMP_PROGRAM_ID.toBase58())return null;
   try{const curve=PUMP_SDK.decodeBondingCurve({...account,data:Buffer.from(account.data[0],'base64'),owner:new PublicKey(account.owner)});return {graduated:curve.complete,progress:curve.complete?100:Math.max(0,Math.min(100,100*(1-Number(curve.realTokenReserves.toString())/793100000000000)))};}catch{return null;}
  })??null;
 }catch{return null;}
}
async function fetchMarkets(){
 const [results,curves]=await Promise.all([
  Promise.allSettled(coins.map(async coin=>{
   const response=await fetch(`https://api.dexscreener.com/token-pairs/v1/solana/${coin.mint}`,{signal:AbortSignal.timeout(9000),cache:'no-store'});
   if(!response.ok)throw new Error('Market provider unavailable');const pairs:unknown=await response.json();
   return selectMarketPair(Array.isArray(pairs)?pairs as DexPair[]:[],coin.mint);
  })),readCurves()
 ]);
 const fetchedAt=new Date().toISOString();
 const current=coins.map((coin,i)=>{
  const result=results[i];const market=normalizeMarket(coin,result.status==='fulfilled'?result.value:null,fetchedAt);
  return {...market,...(curves?.[i]??{})};
 });
 return {coins:current,fetchedAt};
}
export async function GET(){
 if(!cached||Date.now()>=expires){
  if(!inFlight)inFlight=fetchMarkets().then(value=>{cached=value;expires=Date.now()+30000;return value;}).finally(()=>{inFlight=null;});
  await inFlight;
 }
 return NextResponse.json(cached,{headers:{'Cache-Control':'no-store'}});
}
