'use client';
import {useEffect,useState} from 'react';
import {ArrowLeft,ArrowRight,ArrowUpRight,Bookmark,Check,CheckCircle2,Copy,Download,ExternalLink,Globe,Info,LayoutGrid,List,LockKeyhole,Menu,MessageCircle,Monitor,Plus,RefreshCw,Search,Smartphone,Users,X} from 'lucide-react';
import {coins,initialDesign,type Coin,type SiteDesign,type Theme} from '@/lib/haus-data';
import {emptyMarket,type MarketCoin} from '@/lib/market-data';
import {money,launchAge} from '@/lib/token-display';
import {CoinCard} from './coin-card';
import {SortMenu} from './sort-menu';
import {MarketChart} from './market-chart';
import {MarketTables} from './market-tables';
import {formatPrice} from '@/lib/chart-data';
import {TokenArt} from './token-art';
import {TokenIdentity} from './token-identity';
import {HausMark} from './haus-mark';
import {Dialog} from './ui/dialog';
import {WalletMultiButton} from './wallet-button';
import {LaunchModal} from './launch-modal';
import {HowItWorks} from './how-it-works';
import {HausWorkspace} from './haus-workspace';
import {MyHauses} from './my-hauses';
import {SiteFooter} from './site-footer';

type View='explore'|'saved'|'coin'|'community'|'builder'|'hauses';
const themes:{id:Theme;label:string;color:string}[]=[{id:'editorial',label:'Editorial',color:'#e7e7cb'},{id:'terminal',label:'Terminal',color:'#163b28'},{id:'playful',label:'Playful',color:'#d5b8f0'},{id:'midnight',label:'After hours',color:'#273445'}];
const validViews:View[]=['explore','saved','coin','community','builder','hauses'];
const storageKey='haus-workspace-v1';
function Brand(){return <span className="brand"><HausMark/><span>haus</span></span>;}
function HouseScene(){return <div className="poster-art" aria-hidden="true"><div className="poster-outline"><HausMark/></div><HausMark className="poster-monogram"/><div className="star-sticker"><span>BUILT<br/>BY US.</span></div><span className="poster-cross">✳</span></div>;}

export function HausApp(){
 const [view,setView]=useState<View>('explore');
 const [selectedId,setSelectedId]=useState(coins[0].id);
 const [markets,setMarkets]=useState<MarketCoin[]>(()=>coins.map(emptyMarket));
 const [loading,setLoading]=useState(true),[marketError,setMarketError]=useState(false),[refresh,setRefresh]=useState(0);
 const [query,setQuery]=useState(''),[filter,setFilter]=useState('Trending'),[sort,setSort]=useState('volume'),[list,setList]=useState(false);
 const [saved,setSaved]=useState<string[]>([]),[drafts,setDrafts]=useState<Record<string,SiteDesign>>({}),[ready,setReady]=useState(false);
 const [mobileNav,setMobileNav]=useState(false);
 const [toast,setToast]=useState(''),[launch,setLaunch]=useState(false);
 const [info,setInfo]=useState<'privacy'|null>(null);
 const [howOpen,setHowOpen]=useState(false);
 const selected=markets.find(c=>c.id===selectedId)||markets[0];

 useEffect(()=>{
  function readLocation(){const params=new URLSearchParams(window.location.search);const coin=coins.find(c=>c.mint===params.get('coin'));if(coin)setSelectedId(coin.id);const page=params.get('view') as View|null;setView(page&&validViews.includes(page)?page:coin?'coin':'explore');}
  readLocation();window.addEventListener('popstate',readLocation);
  try{const value=JSON.parse(localStorage.getItem(storageKey)||'{}');if(Array.isArray(value.saved))setSaved(value.saved.filter((id:unknown)=>typeof id==='string'&&coins.some(c=>c.id===id)));if(value.drafts&&typeof value.drafts==='object'){const valid:Record<string,SiteDesign>={};for(const coin of coins){const d=value.drafts[coin.id];if(d&&typeof d.title==='string'&&typeof d.description==='string'&&typeof d.tagline==='string'&&themes.some(t=>t.id===d.theme))valid[coin.id]=d;}setDrafts(valid);}}catch{}
  setReady(true);return()=>window.removeEventListener('popstate',readLocation);
 },[]);
 useEffect(()=>{if(ready)try{localStorage.setItem(storageKey,JSON.stringify({saved,drafts}));}catch{}},[ready,saved,drafts]);
 useEffect(()=>{if(!toast)return;const timer=setTimeout(()=>setToast(''),3600);return()=>clearTimeout(timer);},[toast]);
 useEffect(()=>{
  let cancelled=false;const controller=new AbortController();
  async function load(){try{const response=await fetch('/api/markets',{signal:controller.signal,cache:'no-store'});if(!response.ok)throw new Error();const result=await response.json();if(!Array.isArray(result.coins))throw new Error();if(!cancelled){setMarkets(result.coins);setMarketError(!result.coins.some((c:MarketCoin)=>c.marketStatus==='current'));}}catch{if(!cancelled)setMarketError(true);}finally{if(!cancelled)setLoading(false);}}
  void load();const interval=setInterval(()=>{if(document.visibilityState==='visible')void load();},30000);
  return()=>{cancelled=true;controller.abort();clearInterval(interval);};
 },[refresh]);

 function navigate(next:View,coinId=selectedId){setView(next);setSelectedId(coinId);setMobileNav(false);const coin=coins.find(c=>c.id===coinId)!;const params=new URLSearchParams();if(['coin','community','builder'].includes(next))params.set('coin',coin.mint);if(next!=='explore'&&next!=='coin')params.set('view',next);window.history.pushState({},'',params.size?`/?${params}`:'/');window.scrollTo({top:0,behavior:'smooth'});}
 function openCoin(coin:Coin){navigate('coin',coin.id);}
 function editCoin(coin:Coin){navigate('builder',coin.id);}
 function toggleSaved(){setSaved(old=>old.includes(selectedId)?old.filter(id=>id!==selectedId):[...old,selectedId]);}
 async function copy(value:string,label:string){try{await navigator.clipboard.writeText(value);setToast(`${label} copied.`);}catch{setToast('Clipboard unavailable. Select and copy the address below.');}}
 const filtered=markets.filter(c=>`${c.name} ${c.ticker} ${c.mint}`.toLowerCase().includes(query.toLowerCase())&&(view!=='saved'||saved.includes(c.id))&&(filter!=='About to graduate'||(!c.graduated&&c.progress!==null&&c.progress>=80))&&(filter!=='Graduated'||c.graduated)).sort((a,b)=>sort==='progress'?(b.progress??-1)-(a.progress??-1):sort==='market'?(b.cap??-1)-(a.cap??-1):sort==='new'?Date.parse(b.createdAt)-Date.parse(a.createdAt):(b.volume??-1)-(a.volume??-1));

 return <><div className="app-shell"><header className="topbar"><button className="brand-button" onClick={()=>navigate('explore')} aria-label="HAUS home"><Brand/></button><nav className={mobileNav?'main-nav is-open':'main-nav'}>{[{id:'explore',label:'Explore'},{id:'saved',label:'Saved'},{id:'hauses',label:'My Hauses'}].map(n=><button key={n.id} className={view===n.id?'active':''} onClick={()=>navigate(n.id as View)}>{n.label}</button>)}</nav><div className="header-actions"><button className="header-how" onClick={()=>setHowOpen(true)} aria-label="How it works"><Info size={14}/><span>How it works</span></button><WalletMultiButton/><button className="button primary header-launch" onClick={()=>setLaunch(true)}>Launch a coin <ArrowUpRight size={17}/></button><button className="mobile-menu icon-button" onClick={()=>setMobileNav(!mobileNav)} aria-label="Toggle navigation" aria-expanded={mobileNav}><Menu size={22}/></button></div></header>
 <main className={`main-content view-${view}`}>
 {(view==='explore'||view==='saved')&&<>
  {view==='explore'?<section className="hero-panel"><div className="hero-copy"><h1>WE ARE<br/>THE <span>DEVS.</span><span className="headline-asterisk">✳</span></h1><div className="hero-bottom"><p>Your coin. Built by its holders.</p><button className="button dark" onClick={()=>setLaunch(true)}>Start a haus <ArrowUpRight size={19}/></button></div></div><HouseScene/></section>:<section className="page-heading"><h1>SAVED COINS<span className="pink-period">.</span></h1><button className="button secondary" onClick={()=>navigate('explore')}>Explore <ArrowUpRight size={17}/></button></section>}
  <section className="explore-section"><div className="section-heading"><div className="section-title"><h2>{view==='saved'?'YOUR WATCHLIST':'ON THE BLOCK'}</h2><span className="count-label">{filtered.length.toString().padStart(2,'0')}</span></div><div className="discovery-controls"><div className="searchbox"><Search size={16}/><input aria-label="Search coins or communities" placeholder="Find your coin" value={query} onChange={e=>setQuery(e.target.value)}/></div><div className="layout-toggle"><button className={!list?'active':''} aria-label="Grid view" onClick={()=>setList(false)}><LayoutGrid size={16}/></button><button className={list?'active':''} aria-label="List view" onClick={()=>setList(true)}><List size={17}/></button></div></div></div>
  <div className="filter-bar"><div className="filter-pills">{['Trending','New','About to graduate','Graduated'].map(f=><button key={f} aria-pressed={filter===f} title={f==='About to graduate'?'Bonding curves at 80% or higher':undefined} onClick={()=>{setFilter(f);setSort(f==='New'?'new':f==='About to graduate'?'progress':'volume');}} className={`pill ${filter===f?'selected':''}`}>{f}</button>)}</div><div className="filter-end"><button className="refresh-markets" aria-label="Refresh markets" onClick={()=>{setLoading(true);setRefresh(v=>v+1);}}><RefreshCw size={13} className={loading?'spin':''}/></button><SortMenu value={sort} onChange={setSort}/></div></div>
  <div className={`coin-grid ${list?'list-view':''}`}>{filtered.map(c=><CoinCard key={c.id} coin={{...c,age:ready?launchAge(c.createdAt,new Date().toISOString()):c.age}} onSelect={openCoin}/>)}</div>
  {!filtered.length&&<div className="empty-state"><Bookmark/><h3>{view==='saved'?'YOUR LIST STARTS HERE.':'NO COINS FOUND.'}</h3><button className="button secondary" onClick={()=>{setQuery('');setFilter('Trending');setSort('volume');navigate('explore');}}>Explore coins <ArrowRight size={15}/></button></div>}
  {marketError&&!loading&&<div className="market-error" role="status">Market data is temporarily unavailable. Charts and trading links are still accessible.<button onClick={()=>setRefresh(v=>v+1)}>Retry</button></div>}
  </section>
 </>}

 {view==='coin'&&<>
  <button className="back-link" onClick={()=>navigate('explore')}><ArrowLeft size={14}/> All coins</button>
  <section className="token-header"><TokenIdentity coin={selected} onCopy={()=>void copy(selected.mint,'Address')}/><div className="token-live-price"><b>{formatPrice(selected.price)}</b><span className={selected.change!==null&&selected.change<0?'negative':'positive'}>{selected.change===null?'—':(selected.change>=0?'+':'')+selected.change.toFixed(2)+'%'} <small>24H</small></span></div><div className="token-actions"><button className={`icon-button save-coin ${saved.includes(selectedId)?'is-saved':''}`} aria-label={saved.includes(selectedId)?'Unsave coin':'Save coin'} onClick={toggleSaved}><Bookmark size={18} fill={saved.includes(selectedId)?'currentColor':'none'}/></button><button className="button primary" onClick={()=>navigate('community')}><Users size={16}/> Enter Haus <ArrowUpRight size={16}/></button></div></section>
  <div className="market-stats"><div><span>MARKET CAP</span><b>{money(selected.cap)}</b></div><div><span>24H VOLUME</span><b>{money(selected.volume)}</b></div><div><span>LIQUIDITY</span><b>{money(selected.liquidity)}</b></div><div><span>24H CHANGE</span><b className={selected.change===null?'':selected.change>=0?'positive':'negative'}>{selected.change===null?'—':`${selected.change>=0?'+':''}${selected.change.toFixed(2)}%`}</b></div></div>
  <div className="token-market-layout"><div className="token-chart-column"><MarketChart key={'chart-'+selected.mint} coin={selected}/><MarketTables key={'tables-'+selected.mint} coin={selected}/></div><aside className="trade-sidebar"><div className="trade-box"><h2>MAKE YOUR MOVE.</h2><a className="button dark full" href={`https://pump.fun/coin/${selected.mint}`} target="_blank" rel="noreferrer">Trade on Pump.fun <ArrowUpRight size={17}/></a><a className="button secondary full" href={selected.marketUrl} target="_blank" rel="noreferrer">DEX Screener <ArrowUpRight size={16}/></a><div className="trade-curve"><div><span>{selected.graduated?'Graduated':'Bonding curve'}</span><b>{selected.progress===null?'—':`${Number(selected.progress.toFixed(2))}%`}</b></div><div className={`migration-track ${selected.graduated?'complete':''}`} role="progressbar" aria-label="Migration progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={selected.progress??undefined}><span style={{width:`${selected.progress??0}%`}}/></div></div><dl className="token-facts"><div><dt>Network</dt><dd>Solana</dd></div><div><dt>Launched</dt><dd>{launchAge(selected.createdAt,new Date().toISOString())}</dd></div><div><dt>Supply market cap</dt><dd>{money(selected.cap)}</dd></div></dl><a className="text-button" href={`https://solscan.io/token/${selected.mint}`} target="_blank" rel="noreferrer">View contract <ExternalLink size={13}/></a></div><div className="community-cta"><HausMark/><h3>THIS COIN HAS A HAUS.</h3><button className="text-button" onClick={()=>navigate('community')}>Enter Haus <ArrowRight size={14}/></button></div></aside></div>
 </>}

 {(view==='community'||view==='builder')&&<HausWorkspace key={selected.mint} coin={selected} initialTab={view==='builder'?'website':'overview'} draft={drafts[selected.id]} onBack={()=>navigate('coin')} onSave={nextDesign=>{const next={...drafts,[selected.id]:nextDesign};localStorage.setItem(storageKey,JSON.stringify({saved,drafts:next}));setDrafts(next);}}/>}

 {view==='hauses'&&<MyHauses markets={markets} onOpen={coin=>navigate('community',coin.id)} onExplore={()=>navigate('explore')}/>}
 <SiteFooter onHow={()=>setHowOpen(true)}/>
 </main>
 </div>
 {howOpen&&<HowItWorks onClose={()=>setHowOpen(false)} onStart={()=>{setHowOpen(false);navigate('explore');}}/>}
 <LaunchModal open={launch} onOpenChange={setLaunch}/>
 <Dialog open={info==='privacy'} onOpenChange={()=>setInfo(null)} title="PRIVACY." description="How this version of HAUS handles your data."><div className="privacy-copy"><p>Your saved coins and website drafts are stored in this browser. Clearing site storage removes them.</p><p>Market data is requested from DEX Screener and Solana RPC. Chart history and trades are requested from GeckoTerminal. External images connect your browser to their providers.</p><p>Wallet connections are handled by your wallet extension. HAUS does not ask for your seed phrase or private key.</p><p>Trading and launching through external links are handled by those services.</p></div></Dialog>
 {toast&&<div className="toast" role="status"><CheckCircle2 size={18}/><span>{toast}</span><button onClick={()=>setToast('')} aria-label="Dismiss notification"><X size={15}/></button></div>}
 </>;
}
