import {NextResponse} from 'next/server';
import {PublicKey} from '@solana/web3.js';
import {bondingCurvePda,PUMP_PROGRAM_ID,PUMP_SDK} from '@pump-fun/pump-sdk';
import {redis} from '@/lib/redis';
import {cachedFeed} from '@/lib/public-feed';
import type {Coin} from '@/lib/haus-data';
import {registeredCoins,registeredCoin} from '@/lib/token-registry';
import {normalizeMarket,selectMarketPair,staleMarket,type DexPair,type MarketCoin} from '@/lib/market-data';
export const runtime='nodejs';
export const dynamic='force-dynamic';
type MarketResponse={coins:MarketCoin[];fetchedAt:string};
let cached:MarketResponse|null=null;
let expires=0;
let inFlight:Promise<MarketResponse>|null=null;
async function readCurves(coins:Coin[]){
 if(!coins.length)return [];
 try{
  const response=await fetch(process.env.SOLANA_RPC_URL||'https://api.mainnet-beta.solana.com',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'getMultipleAccounts',params:[coins.map(c=>bondingCurvePda(c.mint).toBase58()),{encoding:'base64',commitment:'confirmed'}]}),signal:AbortSignal.timeout(7000),cache:'no-store'});
  if(!response.ok)return null;const payload=await response.json();
  return (payload.result?.value as ({data:[string,string];owner:string;lamports:number;executable:boolean;rentEpoch:number}|null)[]|undefined)?.map(account=>{
   if(!account||account.owner!==PUMP_PROGRAM_ID.toBase58())return null;
   try{const curve=PUMP_SDK.decodeBondingCurve({...account,data:Buffer.from(account.data[0],'base64'),owner:new PublicKey(account.owner)});return {graduated:curve.complete,progress:curve.complete?100:Math.max(0,Math.min(100,100*(1-Number(curve.realTokenReserves.toString())/793100000000000)))};}catch{return null;}
  })??null;
 }catch{return null;}
}
async function fetchMarkets(requestedMint?:string){
 const coins=await registeredCoins();
 if(requestedMint&&!coins.some(coin=>coin.mint===requestedMint)){const requested=await registeredCoin(requestedMint);if(requested){if(coins.length>=100)coins.pop();coins.push(requested);}}
 const batches=Array.from({length:Math.ceil(coins.length/30)},(_,i)=>coins.slice(i*30,i*30+30));
 const [results,curves,stored]=await Promise.all([
  Promise.allSettled(batches.map(async batch=>{
   const response=await fetch('https://api.dexscreener.com/tokens/v1/solana/'+batch.map(c=>c.mint).join(','),{signal:AbortSignal.timeout(9000),cache:'no-store'});
   if(!response.ok)throw new Error('Market provider unavailable');const pairs:unknown=await response.json();
   if(!Array.isArray(pairs))throw new Error('Invalid market response');return pairs as DexPair[];
  })),readCurves(coins),coins.length?redis().mget(...coins.map(c=>'market:last:'+c.mint)).catch(()=>coins.map(()=>null)):Promise.resolve([])
 ]);
 const fetchedAt=new Date().toISOString();
 const current=coins.map((coin,i)=>{
  const result=results[Math.floor(i/30)];let previous:MarketCoin|null=null;try{previous=stored[i]?JSON.parse(stored[i]!):null;}catch{}
  const market=result.status==='fulfilled'?normalizeMarket(coin,selectMarketPair(result.value,coin.mint),fetchedAt):staleMarket(coin,previous);
  return {...market,...(curves?.[i]??{})};
 });
 const writes=redis().pipeline();let count=0;for(const market of current)if(market.marketStatus==='current'){writes.set('market:last:'+market.mint,JSON.stringify(market),'EX',900);count++;}if(count)await writes.exec().catch(()=>undefined);
 return {coins:current,fetchedAt};
}
export async function GET(request:Request){
 try{
 const mint=new URL(request.url).searchParams.get('mint');
 // Direct launch links and launch completion bypass the list cache without replacing it.
 if(mint){if(!await registeredCoin(mint))return NextResponse.json({error:'Unknown token'},{status:404});return NextResponse.json(await cachedFeed('markets:'+mint,30000,()=>fetchMarkets(mint)),{headers:{'Cache-Control':'no-store'}});}
 if(!cached||Date.now()>=expires){
  if(!inFlight)inFlight=fetchMarkets().then(value=>{cached=value;expires=Date.now()+30000;return value;}).finally(()=>{inFlight=null;});
  await inFlight;
 }
 return NextResponse.json(cached,{headers:{'Cache-Control':'no-store'}});
 }catch{return NextResponse.json({error:'Token registry is temporarily unavailable.'},{status:503});}
}
