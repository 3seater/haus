'use client';


import type {MarketCoin} from '@/lib/market-data';
import {money} from '@/lib/token-display';
import {TokenArt} from './token-art';

export function TokenTicker({coins,onSelect}:{coins:MarketCoin[];onSelect:(coin:MarketCoin)=>void}){

 if(!coins.length)return null;
 const items=Array.from({length:Math.max(1,Math.ceil(24/coins.length))},()=>coins).flat();
 return <section className="token-ticker" aria-label="Token market ticker">
  <div className="token-ticker-window"><div className="token-ticker-track" style={{animationDuration:`${items.length*4}s`}}>
   {[0,1].map(copy=><div className="token-ticker-group" key={copy} aria-hidden={copy===1?true:undefined}>{items.map((coin,index)=>{
    const current=coin.marketStatus==='current';
    const change=current&&coin.change!==null&&Number.isFinite(coin.change)?coin.change:null;
    return <button key={`${coin.mint}-${index}`} aria-hidden={index>=coins.length?true:undefined} tabIndex={copy===1||index>=coins.length?-1:0} onClick={()=>onSelect(coin)} title={`${coin.name} · market cap · 24h change`}><TokenArt coin={coin}/><strong>{coin.ticker}</strong><span className="ticker-price" aria-label="Market cap">MC {current?money(coin.cap):'—'}</span><span className={change===null?'ticker-change':change>=0?'ticker-change up':'ticker-change down'}>{change===null?'—':`${change>=0?'▲':'▼'} ${Math.abs(change).toFixed(2)}%`}</span></button>;
   })}</div>)}
  </div></div>
 </section>;
}
