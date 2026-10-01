'use client';
import {useEffect,useState} from 'react';
import {ArrowUpRight,RefreshCw} from 'lucide-react';
import type {MarketCoin} from '@/lib/market-data';
import {compactAmount,formatPrice,type Trade,type Holder} from '@/lib/chart-data';
const short=(address:string)=>address.slice(0,5)+'…'+address.slice(-4);
function age(date:string){const seconds=Math.max(0,Math.floor((Date.now()-Date.parse(date))/1000));return seconds<60?seconds+'s':seconds<3600?Math.floor(seconds/60)+'m':seconds<86400?Math.floor(seconds/3600)+'h':Math.floor(seconds/86400)+'d';}
export function MarketTables({coin}:{coin:MarketCoin}){
 const [tab,setTab]=useState<'Trades'|'Holders'|'About'>('Trades'),[trades,setTrades]=useState<Trade[]>([]),[holders,setHolders]=useState<Holder[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState(false),[revision,setRevision]=useState(0);
 useEffect(()=>{setTrades([]);setHolders([]);setTab('Trades');},[coin.mint]);
 useEffect(()=>{
  setError(false);setLoading(true);if(tab==='About'){setLoading(false);return;}if(tab==='Trades'&&!coin.pairAddress){setLoading(false);return;}
  const controller=new AbortController();let cancelled=false;
  const path=tab==='Trades'?'/api/market-history?kind=trades&mint='+coin.mint+'&pool='+coin.pairAddress:'/api/holders?mint='+coin.mint;
  async function load(){try{const r=await fetch(path,{signal:controller.signal});if(!r.ok)throw new Error();const d=await r.json();if(!cancelled){if(tab==='Trades')setTrades(d.trades);else setHolders(d.holders);setError(false);}}catch{if(!cancelled)setError(true);}finally{if(!cancelled)setLoading(false);}}
  void load();const timer=window.setInterval(()=>{if(document.visibilityState==='visible')void load();},tab==='Holders'?120000:60000);return()=>{cancelled=true;controller.abort();clearInterval(timer);};
 },[coin.mint,coin.pairAddress,tab,revision]);
 const rows=tab==='Trades'?trades:holders;
 return <section className="market-tables"><header><div role="tablist" aria-label="Token information">{(['Trades','Holders','About'] as const).map(t=><button key={t} role="tab" id={'market-tab-'+t} aria-controls={'market-panel-'+t} aria-selected={tab===t} className={tab===t?'active':''} onClick={()=>setTab(t)}>{t}</button>)}</div>{tab!=='About'&&<button className="table-refresh" aria-label={'Refresh '+tab.toLowerCase()} onClick={()=>setRevision(v=>v+1)}><RefreshCw size={13}/></button>}</header>
 <div role="tabpanel" id={'market-panel-'+tab} aria-labelledby={'market-tab-'+tab}>
 {tab==='About'?<div className="token-about"><p>{coin.story}</p><dl><div><dt>Contract</dt><dd><a href={'https://solscan.io/token/'+coin.mint} target="_blank" rel="noreferrer">{coin.mint} <ArrowUpRight size={12}/></a></dd></div><div><dt>Network</dt><dd>Solana</dd></div><div><dt>Launch</dt><dd>{new Date(coin.createdAt).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}</dd></div><div><dt>Status</dt><dd>{coin.graduated?'Graduated':'Bonding curve'}</dd></div></dl><div className="about-links">{[...coin.websites,...coin.socials].map((link,i)=><a key={i} href={link.url} target="_blank" rel="noreferrer">{link.label==='twitter'?'X':link.label} <ArrowUpRight size={12}/></a>)}</div></div>:<>
 {tab==='Holders'&&<div className="table-caption">20 largest token accounts · includes pools and vaults</div>}
 <div className="market-table-scroll"><table><thead><tr>{(tab==='Trades'?['Type / amount','Value (USD)','Price','Trader','Age']:['Rank','Owner / account','Balance','Supply']).map(label=><th key={label}>{label}</th>)}</tr></thead><tbody>
 {tab==='Trades'?trades.slice(0,30).map(t=><tr key={t.id}><td className={t.side==='buy'?'positive':'negative'}><span className={'trade-dot '+t.side}/><b>{t.side==='buy'?'Buy':'Sell'}</b> {compactAmount(t.amount)}</td><td>{formatPrice(t.usd)}</td><td>{formatPrice(t.price)}</td><td><a href={'https://solscan.io/account/'+t.wallet} target="_blank" rel="noreferrer">{short(t.wallet)}</a></td><td><a href={'https://solscan.io/tx/'+t.signature} target="_blank" rel="noreferrer" title={new Date(t.time).toLocaleString()}>{age(t.time)} <ArrowUpRight size={11}/></a></td></tr>):holders.map((h,i)=><tr key={h.account}><td>{String(i+1).padStart(2,'0')}</td><td><a href={'https://solscan.io/account/'+h.owner} target="_blank" rel="noreferrer">{short(h.owner)}</a><a className="holder-account" href={'https://solscan.io/account/'+h.account} target="_blank" rel="noreferrer">Account {short(h.account)} <ArrowUpRight size={10}/></a></td><td>{compactAmount(h.amount)} <span className="muted">{coin.ticker}</span></td><td><span className="supply-value">{h.percentage.toFixed(2)}%</span><span className="holder-share"><i style={{width:Math.min(100,h.percentage)+'%'}}/></span></td></tr>)}
 {!rows.length&&<tr><td colSpan={tab==='Trades'?5:4} className="table-empty">{loading?'Loading '+tab.toLowerCase()+'…':error?'Unable to load '+tab.toLowerCase()+'.':tab==='Trades'?'No recent trades available for this pool.':'No holder accounts returned.'}{!loading&&<button onClick={()=>setRevision(v=>v+1)}>Retry</button>}</td></tr>}
 </tbody></table></div>{error&&rows.length>0&&<div className="table-caption">Refresh failed · showing last loaded data</div>}
 <div className="table-source">{tab==='Trades'?'Recent pool trades · GeckoTerminal':'Token accounts · Solana RPC'}</div></>}
 </div></section>;
}
