'use client';
import {useEffect,useState} from 'react';
import {ArrowUpRight} from 'lucide-react';
import type {Coin} from '@/lib/haus-data';
import {TokenArt} from './token-art';
import {Skeleton} from './ui/skeleton';
import {HomeMarketStats} from './home-market-stats';
import './hero-stats.css';

export function HeroStats({appUrl,initialCoins=null}:{appUrl:string;initialCoins?:Coin[]|null}){
 const [coins,setCoins]=useState<Coin[]|null>(initialCoins),[error,setError]=useState(false);
 useEffect(()=>{
  let stopped=false,busy=false;const controller=new AbortController();
  async function load(){
   if(busy)return;busy=true;
   try{
    const response=await fetch('/api/launches/recent',{signal:AbortSignal.any([controller.signal,AbortSignal.timeout(10000)]),cache:'no-store'});
    if(!response.ok)throw new Error();const data=await response.json();if(!Array.isArray(data.coins))throw new Error();
    if(!stopped){setCoins(data.coins);setError(false);}
   }catch{if(!stopped)setError(true);}finally{busy=false;}
  }
  const resume=()=>{if(document.visibilityState==='visible')void load();};
  void load();const timer=setInterval(resume,15000);document.addEventListener('visibilitychange',resume);
  return()=>{stopped=true;controller.abort();clearInterval(timer);document.removeEventListener('visibilitychange',resume);};
 },[]);
 return <section className="hero-launches" aria-labelledby="recent-launches-title">
  <HomeMarketStats/><div className="hero-launches-heading"><h2 id="recent-launches-title">JUST MOVED IN.</h2><span className={error?'launch-feed-status paused':'launch-feed-status'}><i/>{error?'Reconnecting':'Recent launches'}</span></div>
  <div className="hero-launches-list" aria-live="polite" aria-relevant="additions removals">
   {!coins&&!error?Array.from({length:3},(_,i)=><div className="hero-launch-row" key={i} aria-hidden="true"><Skeleton className="token-art" width={40} height={40}/><span className="hero-launch-name"><Skeleton width="60%" height="14px"/><Skeleton width="35%" height="10px"/></span><Skeleton width="70px" height="12px"/></div>):coins?.length?coins.map(coin=><a className="hero-launch-row" key={coin.mint} href={`${appUrl}${appUrl.includes('?')?'&':'?'}coin=${encodeURIComponent(coin.mint)}&view=community`}>
    <TokenArt coin={coin}/><span className="hero-launch-name"><strong>{coin.name}</strong><span>${coin.ticker}</span></span><span className="hero-launch-label">Enter haus</span><ArrowUpRight size={18}/>
   </a>):<div className="hero-launch-empty"><strong>{error?'The door is still open.':coins?'Be the first to move in.':'Opening the doors…'}</strong><p>{error?'We’re reconnecting to recent launches.':coins?'New launches will appear here. Yours could be next.':'Finding the latest launches on HAUS.'}</p>{coins&&!error&&<a href={appUrl}>Launch your token <ArrowUpRight size={15}/></a>}</div>}
  </div>
  <a className="hero-launches-all" href={appUrl}>Explore all tokens <ArrowUpRight size={14}/></a>
 </section>;
}
