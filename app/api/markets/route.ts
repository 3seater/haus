import {NextResponse} from 'next/server';
import {PublicKey} from '@solana/web3.js';
import {bondingCurvePda,PUMP_PROGRAM_ID,PUMP_SDK} from '@pump-fun/pump-sdk';
import {redis} from '@/lib/redis';
import {cachedFeed} from '@/lib/public-feed';
import {rpc as publicRpc} from '@/lib/public-feed';
import {curveMarket,SOL_MINT} from '@/lib/curve-market';
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
  const payload=await publicRpc('getMultipleAccounts',[coins.map(c=>bondingCurvePda(c.mint).toBase58()),{encoding:'base64',commitment:'confirmed'}]);
  return (payload.value as ({data:[string,string];owner:string;lamports:number;executable:boolean;rentEpoch:number}|null)[]|undefined)?.map(account=>{
   if(!account||account.owner!==PUMP_PROGRAM_ID.toBase58())return null;
   try{return PUMP_SDK.decodeBondingCurve({...account,data:Buffer.from(account.data[0],'base64'),owner:new PublicKey(account.owner)});}catch{return null;}
  })??null;
 }catch{return null;}
}
async function fetchMarkets(requestedMint?:string){
 const coins=await registeredCoins();
 if(requestedMint&&!coins.some(coin=>coin.mint===requestedMint)){const requested=await registeredCoin(requestedMint);if(requested){if(coins.length>=100)coins.pop();coins.push(requested);}}
 const batches=Array.from({length:Math.ceil(coins.length/30)},(_,i)=>coins.slice(i*30,i*30+30));
 const [results,curves,stored,solUsd]=await Promise.all([
  Promise.allSettled(batches.map(async batch=>{
   const response=await fetch('https://api.dexscreener.com/tokens/v1/solana/'+batch.map(c=>c.mint).join(','),{signal:AbortSignal.timeout(9000),cache:'no-store'});
   if(!response.ok)throw new Error('Market provider unavailable');const pairs:unknown=await response.json();
   if(!Array.isArray(pairs))throw new Error('Invalid market response');return pairs as DexPair[];
  })),readCurves(coins),coins.length?redis().mget(...coins.map(c=>'market:last:'+c.mint)).catch(()=>coins.map(()=>null)):Promise.resolve([]),
  coins.length?cachedFeed('sol-usd',10000,async()=>{
   const response=await fetch('https://api.dexscreener.com/tokens/v1/solana/'+SOL_MINT,{signal:AbortSignal.timeout(5000),cache:'no-store'});
   if(!response.ok)throw new Error('SOL quote unavailable');
   const pairs=await response.json();if(!Array.isArray(pairs))throw new Error('Invalid SOL quote');
   const value=Number(selectMarketPair(pairs,SOL_MINT)?.priceUsd);
   if(!Number.isFinite(value)||value<=0)throw new Error('Invalid SOL quote');return value;
  }).catch(()=>null):Promise.resolve(null)
 ]);
 const fetchedAt=new Date().toISOString();
 const current=coins.map((coin,i)=>{
  const result=results[Math.floor(i/30)];let previous:MarketCoin|null=null;try{previous=stored[i]?JSON.parse(stored[i]!):null;}catch{}
  const pair=result.status==='fulfilled'?selectMarketPair(result.value,coin.mint):null;
  const market=pair?normalizeMarket(coin,pair,fetchedAt):staleMarket(coin,previous);
  const curve=curves?.[i];
  if(!curve)return {...market,progress:null};
  const live=curveMarket(curve,solUsd);
  return {...market,graduated:live.graduated,progress:live.progress,...(live.price!==null?{
   price:live.price,cap:live.cap,updatedAt:fetchedAt,marketStatus:'current' as const,
   // Old DEX activity must not become fresh merely because the curve refreshed.
   ...(!pair?{change:null,volume:null,liquidity:null}:{})
  }:{})};
 });
 const writes=redis().pipeline();let count=0;for(const market of current)if(market.marketStatus==='current'){writes.set('market:last:'+market.mint,JSON.stringify(market),'EX',900);count++;}if(count)await writes.exec().catch(()=>undefined);
 return {coins:current,fetchedAt};
}
export async function GET(request:Request){
 try{
 const mint=new URL(request.url).searchParams.get('mint');
 // Direct launch links and launch completion bypass the list cache without replacing it.
 if(mint){if(!await registeredCoin(mint))return NextResponse.json({error:'Unknown token'},{status:404});return NextResponse.json(await cachedFeed('markets:'+mint,5000,()=>fetchMarkets(mint)),{headers:{'Cache-Control':'no-store'}});}
 if(!cached||Date.now()>=expires){
  if(!inFlight)inFlight=fetchMarkets().then(value=>{cached=value;expires=Date.now()+5000;return value;}).finally(()=>{inFlight=null;});
  await inFlight;
 }
 return NextResponse.json(cached,{headers:{'Cache-Control':'no-store'}});
 }catch{return NextResponse.json({error:'Token registry is temporarily unavailable.'},{status:503});}
}
