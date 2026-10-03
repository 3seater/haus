'use client';
import {useEffect,useState} from 'react';
import type {MarketCoin} from '@/lib/market-data';
import {SkeletonValue} from './ui/skeleton';
import {money} from '@/lib/token-display';
import {homeMarketSummary} from '@/lib/home-market-summary';


export function HomeMarketStats(){
 const [markets,setMarkets]=useState<MarketCoin[]|null>(null),[pending,setPending]=useState(true);
 useEffect(()=>{
  const controller=new AbortController();let stopped=false,busy=false;
  async function load(){
   if(busy)return;busy=true;
   try{const response=await fetch('/api/markets',{signal:AbortSignal.any([controller.signal,AbortSignal.timeout(12000)]),cache:'no-store'});if(!response.ok)throw new Error();const data=await response.json();if(!Array.isArray(data.coins))throw new Error();if(!stopped)setMarkets(data.coins);}
   catch{if(!stopped)setMarkets(current=>current?.map(coin=>({...coin,marketStatus:'stale' as const}))??null);}finally{busy=false;if(!stopped)setPending(false);}
  }
  const resume=()=>{if(document.visibilityState==='visible')void load();};
  void load();const timer=setInterval(resume,10000);document.addEventListener('visibilitychange',resume);
  return()=>{stopped=true;controller.abort();clearInterval(timer);document.removeEventListener('visibilitychange',resume);};
 },[]);
 const summary=markets?homeMarketSummary(markets):null;
 const volume=summary?.volume??null;
 return <dl className="hero-stats" aria-label="Tokens listed on HAUS">
  <div><dt>Tokens listed</dt><dd><SkeletonValue loading={pending} width="100%">{markets?.length??'—'}</SkeletonValue></dd></div>
  <div><dt>24h volume{volume!==null&&summary?.partial?' · partial':summary?.delayed?' · delayed':''}</dt><dd title={volume===null?'Waiting for indexed trading volume':`${volume.toLocaleString('en-US',{style:'currency',currency:'USD'})} from ${summary!.reporting} of ${summary!.total} listed tokens${summary?.delayed?' · delayed':''}`}><SkeletonValue loading={pending} width="100%">{money(volume)}</SkeletonValue></dd></div>
  <div><dt>Graduated</dt><dd><SkeletonValue loading={pending} width="100%">{markets?markets.filter(coin=>coin.graduated).length:'—'}</SkeletonValue></dd></div>
 </dl>;
}
