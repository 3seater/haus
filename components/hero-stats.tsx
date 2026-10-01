'use client';
import {useEffect,useState} from 'react';
import type {MarketCoin} from '@/lib/market-data';
import {money} from '@/lib/token-display';
import './hero-stats.css';

export function HeroStats(){
 const [markets,setMarkets]=useState<MarketCoin[]|null>(null);
 useEffect(()=>{
  const controller=new AbortController();let stopped=false,busy=false;
  async function load(){
   if(busy)return;busy=true;
   try{const response=await fetch('/api/markets',{signal:controller.signal,cache:'no-store'});if(!response.ok)throw new Error();const data=await response.json();if(!Array.isArray(data.coins))throw new Error();if(!stopped)setMarkets(data.coins);}
   catch{if(!stopped)setMarkets(null);}finally{busy=false;}
  }
  void load();const timer=setInterval(()=>{if(document.visibilityState==='visible')void load();},60000);
  return()=>{stopped=true;controller.abort();clearInterval(timer);};
 },[]);
 const complete=markets?.every(coin=>coin.marketStatus==='current'&&typeof coin.volume==='number'&&Number.isFinite(coin.volume));
 const volume=markets&&complete?markets.reduce((sum,coin)=>sum+(coin.volume??0),0):null;
 return <dl className="hero-stats" aria-label="Tokens listed on HAUS">
  <div><dt>Tokens listed</dt><dd>{markets?.length??'—'}</dd></div>
  <div><dt>24h volume</dt><dd title={volume===null?'Volume unavailable for one or more listed tokens':`${volume.toLocaleString('en-US',{style:'currency',currency:'USD'})} across listed tokens`}>{money(volume)}</dd></div>
  <div><dt>Graduated</dt><dd>{markets?markets.filter(coin=>coin.graduated).length:'—'}</dd></div>
 </dl>;
}
