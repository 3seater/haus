'use client';
import {useEffect,useRef,useState} from 'react';
import {Minus,Plus,RotateCcw} from 'lucide-react';
import type {MarketCoin} from '@/lib/market-data';
import {formatPrice,compactAmount,intervals,type Interval,type Candle} from '@/lib/chart-data';
export function MarketChart({coin}:{coin:MarketCoin}){
 const [interval,setIntervalValue]=useState<Interval>('5m'),[candles,setCandles]=useState<Candle[]>([]),[error,setError]=useState(false),[loading,setLoading]=useState(true),[revision,setRevision]=useState(0),[count,setCount]=useState(100),[hover,setHover]=useState<number|null>(null),[width,setWidth]=useState(900);
 const frame=useRef<HTMLDivElement>(null);
 useEffect(()=>{if(!frame.current)return;const observer=new ResizeObserver(entries=>setWidth(Math.max(280,entries[0].contentRect.width)));observer.observe(frame.current);return()=>observer.disconnect();},[]);
 useEffect(()=>{
  setCandles([]);setHover(null);setLoading(true);setError(false);if(!coin.pairAddress){setLoading(false);return;}
  const controller=new AbortController();let cancelled=false;
  async function load(){try{const r=await fetch('/api/market-history?mint='+coin.mint+'&pool='+coin.pairAddress+'&interval='+interval,{signal:controller.signal});if(!r.ok)throw new Error();const d=await r.json();if(!cancelled){setCandles(d.candles);setError(false);}}catch{if(!cancelled)setError(true);}finally{if(!cancelled)setLoading(false);}}
  void load();const timer=window.setInterval(()=>{if(document.visibilityState==='visible')void load();},60000);return()=>{cancelled=true;controller.abort();clearInterval(timer);};
 },[coin.mint,coin.pairAddress,interval,revision]);
 const visible=candles.slice(-count),last=visible[visible.length-1],active=visible[hover??visible.length-1];
 const left=16,right=width-80,top=32,bottom=351,volumeTop=386,volumeBottom=459;
 const low=visible.length?Math.min(...visible.map(c=>c.low)):0,high=visible.length?Math.max(...visible.map(c=>c.high)):1,pad=(high-low||high*.1||1)*.12,min=Math.max(0,low-pad),max=high+pad;
 const y=(v:number)=>bottom-(v-min)/(max-min)*(bottom-top),step=(right-left)/Math.max(visible.length,1),x=(i:number)=>left+(i+.5)*step,body=Math.min(13,Math.max(1,step*.65)),maxVolume=Math.max(...visible.map(c=>c.volume),1);
 const label=(time:number)=>new Date(time*1000).toLocaleString('en-US',interval==='1d'?{month:'short',day:'numeric'}:{hour:'2-digit',minute:'2-digit',hour12:false});
 const points=width<500?3:5;
 return <section className="market-chart native-chart"><header><div className="chart-name"><span className="chart-live-dot"/>CHART <span className="chart-currency">USD</span></div><div className="chart-intervals" aria-label="Chart interval">{Object.keys(intervals).map(t=><button key={t} className={interval===t?'active':''} aria-pressed={interval===t} onClick={()=>setIntervalValue(t as Interval)}>{t}</button>)}</div></header>
 <div className="candle-readout">{active?<><span>O <b>{formatPrice(active.open)}</b></span><span>H <b>{formatPrice(active.high)}</b></span><span>L <b>{formatPrice(active.low)}</b></span><span>C <b className={active.close>=active.open?'positive':'negative'}>{formatPrice(active.close)}</b></span></>:<span>{coin.ticker} / USD</span>}</div>
 <div className="native-chart-stage" ref={frame}>
 {visible.length>0?<svg viewBox={'0 0 '+width+' 495'} role="img" aria-label={coin.name+' '+interval+' candlestick price chart with volume'} onPointerMove={e=>{const bounds=e.currentTarget.getBoundingClientRect();setHover(Math.max(0,Math.min(visible.length-1,Math.floor(((e.clientX-bounds.left)*width/bounds.width-left)/step))));}} onPointerLeave={()=>setHover(null)}>
 <text className="chart-watermark" x={(left+right)/2} y="224" textAnchor="middle">haus</text>
 {Array.from({length:6},(_,i)=>{const value=min+(max-min)*i/5;return <g key={i}><line className="chart-gridline" x1={left} x2={right} y1={y(value)} y2={y(value)}/><text className="chart-axis" x={right+10} y={y(value)+3}>{formatPrice(value)}</text></g>;})}
 <line className="chart-gridline" x1={left} x2={right} y1={volumeBottom} y2={volumeBottom}/>
 <text className="chart-axis" x={left} y={volumeTop-10}>VOLUME {active?compactAmount(active.volume):''}</text>
 {visible.map((c,i)=>{const color=c.close>=c.open?'#478167':'#c55780';return <g key={c.time}><line x1={x(i)} x2={x(i)} y1={y(c.high)} y2={y(c.low)} stroke={color}/><rect x={x(i)-body/2} y={Math.min(y(c.open),y(c.close))} width={body} height={Math.max(1,Math.abs(y(c.open)-y(c.close)))} fill={color}/><rect x={x(i)-body/2} y={volumeBottom-c.volume/maxVolume*(volumeBottom-volumeTop)} width={body} height={Math.max(1,c.volume/maxVolume*(volumeBottom-volumeTop))} fill={color} opacity=".4"/></g>;})}
 {last&&<g><line x1={left} x2={right} y1={y(last.close)} y2={y(last.close)} stroke="#b6477b" strokeDasharray="3 4"/><rect x={right+2} y={y(last.close)-10} width="76" height="20" rx="2" fill="#f2a8cd"/><text x={right+8} y={y(last.close)+3} className="chart-axis price-marker">{formatPrice(last.close)}</text></g>}
 {Array.from({length:points},(_,i)=>{const index=Math.round(i*(visible.length-1)/(points-1));return <text key={i} className="chart-axis" x={x(index)} y="482" textAnchor={i===0?'start':i===points-1?'end':'middle'}>{label(visible[index].time)}</text>;})}
 {hover!==null&&active&&<g><line x1={x(hover)} x2={x(hover)} y1={top} y2={volumeBottom} stroke="#867b81" strokeDasharray="3 3"/><circle cx={x(hover)} cy={y(active.close)} r="3" fill="#191919"/><rect x={Math.min(right-100,Math.max(left,x(hover)-50))} y="464" width="100" height="26" rx="3" fill="#191919"/><text x={Math.min(right-50,Math.max(left+50,x(hover)))} y="481" textAnchor="middle" fill="#fff" fontSize="10">{label(active.time)}</text></g>}
 </svg>:<div className="chart-empty"><span>{loading&&coin.marketStatus!=='unavailable'?'Loading candles…':error?'Chart data unavailable.':!coin.pairAddress?'Chart market unavailable.':'No trades in this timeframe.'}</span><button onClick={()=>setRevision(v=>v+1)}>Retry</button></div>}
 </div><div className="native-chart-footer"><span>{error&&candles.length?'Refresh failed · showing last loaded candles':loading?'Loading history…':'Candles · GeckoTerminal'}</span><div><button aria-label="Zoom out chart" onClick={()=>setCount(v=>Math.min(200,v+30))} disabled={count>=200}><Minus size={13}/></button><button aria-label="Zoom in chart" onClick={()=>setCount(v=>Math.max(20,v-30))} disabled={count<=20}><Plus size={13}/></button><button aria-label="Reset chart" onClick={()=>{setCount(100);setRevision(v=>v+1);}}><RotateCcw size={12}/></button></div></div></section>;
}
