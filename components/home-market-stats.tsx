'use client';
import {useEffect,useState} from 'react';
import type {MarketCoin} from '@/lib/market-data';
import {SkeletonValue} from './ui/skeleton';
import {money} from '@/lib/token-display';


export function HomeMarketStats(){
 const [markets,setMarkets]=useState<MarketCoin[]|null>(null),[pending,setPending]=useState(true);
 useEffect(()=>{
  const controller=new AbortController();let stopped=false,busy=false;
  async function load(){
   if(busy)return;busy=true;
   try{const response=await fetch('/api/markets',{signal:controller.signal,cache:'no-store'});if(!response.ok)throw new Error();const data=await response.json();if(!Array.isArray(data.coins))throw new Error();if(!stopped)setMarkets(data.coins);}
   catch{}finally{busy=false;if(!stopped)setPending(false);}
  }
  void load();const timer=setInterval(()=>{if(document.visibilityState==='visible')void load();},60000);
  return()=>{stopped=true;controller.abort();clearInterval(timer);};
 },[]);
 const complete=markets?.every(coin=>coin.marketStatus==='current'&&typeof coin.volume==='number'&&Number.isFinite(coin.volume));
 const volume=markets&&complete?markets.reduce((sum,coin)=>sum+(coin.volume??0),0):null;
 return <dl className="hero-stats" aria-label="Tokens listed on HAUS">
  <div><dt>Tokens listed</dt><dd><SkeletonValue loading={pending} width="100%">{markets?.length??'—'}</SkeletonValue></dd></div>
  <div><dt>24h volume</dt><dd title={volume===null?'Volume unavailable for one or more listed tokens':`${volume.toLocaleString('en-US',{style:'currency',currency:'USD'})} across listed tokens`}><SkeletonValue loading={pending} width="100%">{money(volume)}</SkeletonValue></dd></div>
  <div><dt>Graduated</dt><dd><SkeletonValue loading={pending} width="100%">{markets?markets.filter(coin=>coin.graduated).length:'—'}</SkeletonValue></dd></div>
 </dl>;
}
