'use client';
import {useEffect,useRef,useState} from 'react';
import {TradingChart} from './trading-chart';
import type {MarketCoin} from '@/lib/market-data';
import {formatPrice,intervals,type Interval,type Candle} from '@/lib/chart-data';
export function MarketChart({coin}:{coin:MarketCoin}){
 const [interval,setIntervalValue]=useState<Interval>('5m'),[candles,setCandles]=useState<Candle[]>([]),[error,setError]=useState(''),[loading,setLoading]=useState(true),[revision,setRevision]=useState(0),[hover,setHover]=useState<number|null>(null);
 const historyCache=useRef(new Map<string,{candles:Candle[];loaded:number}>());
 useEffect(()=>{
  const key=coin.mint+':'+coin.pairAddress+':'+interval;const previous=historyCache.current.get(key);setCandles(previous?.candles||[]);setHover(null);setLoading(true);setError('');if(!coin.pairAddress){setLoading(false);return;}
  const controller=new AbortController();let cancelled=false;
  async function load(){try{const r=await fetch('/api/market-history?mint='+coin.mint+'&pool='+coin.pairAddress+'&interval='+interval,{signal:controller.signal});const d=await r.json();if(!r.ok)throw new Error(d.error||'Chart data unavailable.');if(!cancelled){setCandles(d.candles);setError(d.stale?'Refresh unavailable · showing previously loaded candles':'');historyCache.current.set(key,{candles:d.candles,loaded:d.stale?0:Date.now()});}}catch(e){if(!cancelled)setError(e instanceof Error?e.message:'Chart data unavailable.');}finally{if(!cancelled)setLoading(false);}}
  if(previous&&Date.now()-previous.loaded<60000&&revision===0)setLoading(false);else void load();const timer=window.setInterval(()=>{if(document.visibilityState==='visible')void load();},60000);return()=>{cancelled=true;controller.abort();clearInterval(timer);};
 },[coin.mint,coin.pairAddress,interval,revision]);
 const active=candles[hover??candles.length-1];
 return <section className="market-chart native-chart"><header><div className="chart-name"><span className="chart-live-dot"/>CHART <span className="chart-currency">USD</span></div><div className="chart-intervals" aria-label="Chart interval">{Object.keys(intervals).map(t=><button key={t} className={interval===t?'active':''} aria-pressed={interval===t} onClick={()=>setIntervalValue(t as Interval)}>{t}</button>)}</div></header>
 <div className="candle-readout">{active?<><span>O <b>{formatPrice(active.open)}</b></span><span>H <b>{formatPrice(active.high)}</b></span><span>L <b>{formatPrice(active.low)}</b></span><span>C <b className={active.close>=active.open?'positive':'negative'}>{formatPrice(active.close)}</b></span></>:<span>{coin.ticker} / USD</span>}{error&&candles.length>0&&<span role="status">Refresh unavailable · showing last loaded candles</span>}</div>
 <div className="native-chart-stage">
 {candles.length>0?<TradingChart key={coin.mint+coin.pairAddress+interval} candles={candles} interval={interval} name={coin.name} onHover={time=>setHover(time===null?null:candles.findIndex(c=>c.time===time))}/>:<div className="chart-empty"><span>{loading?'Loading candles…':error||(!coin.pairAddress?(coin.graduated?'No indexed pool available.':'Bonding-curve history is not available from this feed.'):'No indexed trades in this timeframe. Try 1m or 5m.')}</span><button onClick={()=>setRevision(v=>v+1)}>Retry</button></div>}
 </div></section>;
}
