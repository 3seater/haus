'use client';
import {useEffect,useState} from 'react';
import type {MarketCoin} from '@/lib/market-data';
export function usePreviewCoin(){
 const [coin,setCoin]=useState<MarketCoin|null>(null);
 useEffect(()=>{const controller=new AbortController();let stopped=false;
 async function load(){try{const response=await fetch('/api/markets',{signal:controller.signal,cache:'no-store'});if(!response.ok)return;const data=await response.json();if(!stopped)setCoin(data.coins?.[0]||null);}catch{}}
 void load();const timer=setInterval(()=>{if(document.visibilityState==='visible')void load();},30000);return()=>{stopped=true;controller.abort();clearInterval(timer);};},[]);
 return coin;
}
