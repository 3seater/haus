'use client';
import {useEffect,useRef,useState} from 'react';
import {useWallet} from '@solana/wallet-adapter-react';
import {useWalletModal} from '@solana/wallet-adapter-react-ui';
import bs58 from 'bs58';
import {ArrowLeft,ArrowUpRight,Check,ChevronDown,ChevronUp,Copy,Download,Globe,Image as ImageIcon,LayoutDashboard,LockKeyhole,MessageCircle,Monitor,Plus,Send,ShieldCheck,Sparkles,Vote,Wallet,ChartNoAxesCombined} from 'lucide-react';
import type {MarketCoin} from '@/lib/market-data';
import {initialDesign,type SiteDesign} from '@/lib/haus-data';
import {emptyRoom,type HausRoom} from '@/lib/community';
import {CommunityPitches,CommunityAssets} from './community-panels';
import {exportSite} from '@/lib/export-site';
import {money} from '@/lib/token-display';
import {TokenArt} from './token-art';
import {TokenIdentity} from './token-identity';
import {HausMark} from './haus-mark';
import {SitePreview} from './site-preview';
import {StudioControls} from './studio-controls';
import {MarketChart} from './market-chart';
import {MarketTables} from './market-tables';
import {VaultPanel} from './vault-panel';
import {Dialog} from './ui/dialog';

const tabs=[{id:'overview',label:'Overview',icon:LayoutDashboard},{id:'website',label:'Website',icon:Monitor},{id:'vault',label:'Fees & rewards',icon:Wallet},{id:'dex',label:'DEX tools',icon:Sparkles},{id:'proposals',label:'Pitches',icon:Vote},{id:'assets',label:'Assets',icon:ImageIcon},{id:'chart',label:'Chart',icon:ChartNoAxesCombined}] as const;
type Tab=typeof tabs[number]['id'];
type Session={token:string;wallet:string;mint:string;expires:number};
const short=(wallet:string)=>`${wallet.slice(0,4)}…${wallet.slice(-4)}`;

export function HausWorkspace({coin,initialTab='overview',draft,onSave,onBack,initialVerifyOpen=false,previewRoom}:{previewRoom?:HausRoom;initialVerifyOpen?:boolean;coin:MarketCoin;initialTab?:Tab;draft?:SiteDesign;onSave:(design:SiteDesign)=>void;onBack:()=>void}){
 const [tab,setTab]=useState<Tab>(initialTab),[design,setDesign]=useState<SiteDesign>(draft||initialDesign(coin));
 const [room,setRoom]=useState<HausRoom>(previewRoom||emptyRoom()),[loading,setLoading]=useState(!previewRoom),[feedError,setFeedError]=useState('');
 const [text,setText]=useState(''),[notice,setNotice]=useState(''),[sending,setSending]=useState(false),[pitching,setPitching]=useState(false);
 const [previewSize,setPreviewSize]=useState<'desktop'|'mobile'>('desktop');
 const [connecting,setConnecting]=useState(false);
 const [studioPreview,setStudioPreview]=useState(false);
 const [session,setSession]=useState<Session|null>(null),[verifyOpen,setVerifyOpen]=useState(initialVerifyOpen),[verifying,setVerifying]=useState(false),[verifyError,setVerifyError]=useState('');
 const [chatSize,setChatSize]=useState<'normal'|'expanded'|'collapsed'>('normal');
 const {publicKey,signMessage}=useWallet(),{setVisible}=useWalletModal();
 const wallet=publicKey?.toBase58()||'';
 const identity=useRef(wallet);identity.current=wallet;
 const active=session&&session.wallet===wallet&&session.mint===coin.mint&&session.expires>Date.now()?session:null;
 const canEditStudio=!!active||studioPreview;
 useEffect(()=>{setStudioPreview(process.env.NODE_ENV==='development'&&process.env.NEXT_PUBLIC_STUDIO_PREVIEW_BYPASS==='true'&&['localhost','127.0.0.1','[::1]'].includes(location.hostname));},[]);
 const chatList=useRef<HTMLDivElement>(null),nearBottom=useRef(true);
 const requestVersion=useRef(0);

 useEffect(()=>{if(previewRoom)return;const desired=new URLSearchParams(location.search).get('tab');setTab(tabs.some(t=>t.id===desired)?desired as Tab:initialTab);},[initialTab,previewRoom]);
 useEffect(()=>{setSession(null);setVerifyError('');if(wallet&&connecting){setVerifyOpen(true);setConnecting(false);}},[wallet,connecting]);
 useEffect(()=>{if(!session)return;const timer=setTimeout(()=>setSession(null),Math.max(0,session.expires-Date.now()));return()=>clearTimeout(timer);},[session]);
 useEffect(()=>{if(!notice)return;const timer=setTimeout(()=>setNotice(''),5000);return()=>clearTimeout(timer);},[notice]);
 useEffect(()=>{
  if(previewRoom)return;
  let stopped=false;const controller=new AbortController();
  async function load(){const version=++requestVersion.current;try{const response=await fetch(`/api/haus?mint=${coin.mint}`,{cache:'no-store',signal:controller.signal});const data=await response.json();if(!response.ok)throw new Error(data.error||'Room unavailable.');if(!stopped&&version===requestVersion.current){setRoom(data);setFeedError('');}}catch(error){if(!stopped)setFeedError(error instanceof Error?error.message:'Room unavailable.');}finally{if(!stopped)setLoading(false);}}
  void load();const timer=setInterval(()=>{if(document.visibilityState==='visible')void load();},6000);
  return()=>{stopped=true;controller.abort();clearInterval(timer);};
 },[coin.mint,previewRoom]);
 useEffect(()=>{if(nearBottom.current&&chatList.current)chatList.current.scrollTop=chatList.current.scrollHeight;},[room.messages.length,chatSize]);

 function selectTab(next:Tab){setTab(next);const url=new URL(location.href);url.searchParams.set('view','community');url.searchParams.set('tab',next);history.replaceState({},'',url);}
 function gate(action:()=>void){if(!active){setVerifyOpen(true);return;}action();}
 function studioGate(action:()=>void){if(canEditStudio)action();else gate(action);}
 async function post(body:object,token?:string){const response=await fetch('/api/haus',{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify({mint:coin.mint,...body})});const data=await response.json();if(!response.ok){if(response.status===401||response.status===403)setSession(null);throw new Error(data.error||'Please try again.');}return data;}
 async function verify(){
  if(!wallet){setConnecting(true);setVerifyOpen(false);setVisible(true);return;}
  if(!signMessage){setVerifyError('Choose a wallet that supports message signing.');return;}
  const signer=wallet;setVerifying(true);setVerifyError('');
  try{const challenge=await post({action:'challenge',wallet:signer});if(identity.current!==signer)return;const signature=await signMessage(new TextEncoder().encode(challenge.message));if(identity.current!==signer)return;const proof=await post({action:'verify',wallet:signer,id:challenge.id,signature:bs58.encode(signature)});if(identity.current!==signer)return;setSession(proof);try{const key='haus-memberships:'+signer;const ids=JSON.parse(localStorage.getItem(key)||'[]');localStorage.setItem(key,JSON.stringify([...new Set([...(Array.isArray(ids)?ids:[]),coin.mint])]));}catch{}setVerifyOpen(false);setNotice('You’re in. Welcome to the Haus.');}
  catch(error){setVerifyError(error instanceof Error?error.message:'Verification was not completed.');}finally{setVerifying(false);}
 }
 async function send(){if(!active){setVerifyOpen(true);return;}if(!text.trim()||sending)return;setSending(true);try{const data=await post({action:'message',text:text.trim()},active.token);requestVersion.current++;setRoom(data);setText('');nearBottom.current=true;}catch(error){setNotice((error as Error).message);}finally{setSending(false);}}
 async function pitch(){if(!active){setVerifyOpen(true);return;}setPitching(true);try{const data=await post({action:'pitch',design},active.token);requestVersion.current++;setRoom(data);selectTab('proposals');setNotice('Your website pitch is in the Haus.');}catch(error){setNotice((error as Error).message);}finally{setPitching(false);}}
 async function vote(pitchId:string){if(!active){setVerifyOpen(true);return;}try{const data=await post({action:'vote',pitchId},active.token);requestVersion.current++;setRoom(data);setNotice('Your vote is saved.');}catch(error){setNotice((error as Error).message);}}
 async function uploadAsset(file:File){if(!active){setVerifyOpen(true);return false;}try{const body=new FormData();body.set('file',file);const response=await fetch('/api/haus/assets?mint='+coin.mint,{method:'POST',headers:{Authorization:'Bearer '+active.token},body});const data=await response.json();if(!response.ok){if([401,403].includes(response.status))setSession(null);throw new Error(data.error||'Upload failed.');}requestVersion.current++;setRoom(data);setNotice('Asset shared with the Haus.');return true;}catch(error){setNotice((error as Error).message);return false;}}
 function download(){studioGate(()=>{const url=URL.createObjectURL(new Blob([exportSite(coin,design)],{type:'text/html'}));const a=document.createElement('a');a.href=url;a.download=`${coin.id}-website.html`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});}
 async function copy(value:string){try{await navigator.clipboard.writeText(value);setNotice('Copied.');}catch{setNotice('Clipboard unavailable.');}}
 function save(){studioGate(()=>{try{onSave(design);setNotice('Draft saved on this device.');}catch{setNotice('Could not save. Export HTML to keep your work.');}});}

 return <section className={`haus-workspace chat-${chatSize}`}>
  <button className="back-link" onClick={onBack}><ArrowLeft size={14}/> Back to coin</button>
  <header className="haus-heading"><TokenIdentity coin={coin} onCopy={()=>void copy(coin.mint)}/><div className="haus-membership">{studioPreview&&tab==='website'?<span className="haus-status verified"><Check size={14}/>Studio preview unlocked</span>:<><span className={active?'haus-status verified':'haus-status'}>{active?<ShieldCheck size={14}/>:<Globe size={14}/>} {active?'Verified holder':'Browsing as a guest'}</span><button className={`button ${active?'secondary':'dark'}`} onClick={()=>setVerifyOpen(true)}>{active?<><Check size={15}/>{short(wallet)}</>:<><Wallet size={15}/>Verify holdings</>}</button></>}</div></header>
  <div className="haus-grid"><div className="haus-tools">
   <nav className="haus-tabs" aria-label="Haus tools">{tabs.map(t=><button key={t.id} className={tab===t.id?'active':''} aria-current={tab===t.id?'page':undefined} onClick={()=>selectTab(t.id)}><t.icon size={16}/>{t.label}</button>)}</nav>
   <div className="haus-tool-content">
   {tab==='overview'&&<>
    <div className="haus-welcome"><div><h2>THE HOLDERS<br/>ARE THE DEVS.</h2><button className="button dark" onClick={()=>selectTab('website')}>Build its home <ArrowUpRight size={17}/></button></div><div className="haus-welcome-art" aria-hidden="true"><HausMark/><span>BUILT<br/>BY US.</span></div></div>
    <div className="haus-tool-grid"><button onClick={()=>selectTab('website')}><Monitor/><ArrowUpRight className="tool-arrow"/><h3>Website studio</h3></button><button onClick={()=>selectTab('dex')}><Sparkles/><ArrowUpRight className="tool-arrow"/><h3>DEX tools</h3></button><button onClick={()=>selectTab('proposals')}><Vote/><ArrowUpRight className="tool-arrow"/><h3>Community pitches</h3><p>{room.pitches.length} website {room.pitches.length===1?'pitch':'pitches'} from holders.</p></button><button onClick={()=>selectTab('assets')}><ImageIcon/><ArrowUpRight className="tool-arrow"/><h3>Brand assets</h3></button></div>
    {coin.marketStatus!=='current'&&<p className="haus-footnote" role="status">{coin.marketStatus==='stale'?'Delayed quote · last updated '+new Date(coin.updatedAt!).toLocaleTimeString():'Market data is not available yet.'}</p>}<div className="haus-market-peek"><div><span>MARKET CAP</span><b>{money(coin.cap)}</b></div><div><span>24H VOLUME</span><b>{money(coin.volume)}</b></div><button className="text-button" onClick={()=>selectTab('chart')}>Open chart <ArrowUpRight size={15}/></button></div>
   </>}
   {tab==='website'&&<>
    <div className="haus-tool-heading"><div><h2>Website studio</h2></div><button className="button secondary" onClick={download}><Download size={14}/>Export HTML</button></div>
    <div className="haus-site-editor"><StudioControls design={design} setDesign={setDesign} enabled={canEditStudio} gate={studioGate}/><div className={`haus-site-canvas preview-${previewSize}`}><div className="haus-canvas-label"><span>{coin.ticker.toLowerCase()} / website</span><div className="studio-device-toggle"><button aria-pressed={previewSize==='desktop'} onClick={()=>setPreviewSize('desktop')}>Desktop</button><button aria-pressed={previewSize==='mobile'} onClick={()=>setPreviewSize('mobile')}>Mobile</button></div></div><SitePreview compact coin={coin} design={design}/></div></div>
    <div className="haus-editor-actions"><button className="button secondary" onClick={save}>Save draft</button><button className="button primary" disabled={pitching||!design.title.trim()} onClick={()=>gate(()=>void pitch())}>{pitching?'Submitting…':'Pitch to the Haus'} <ArrowUpRight size={15}/></button></div><p className="haus-footnote">Drafts save to this device. Submit one pitch per round. Holder votes publish the winning design to a public HAUS site.</p>
   </>}
   {tab==='dex'&&<>
    <div className="haus-tool-heading"><div><h2>DEX tools</h2></div><Sparkles size={25}/></div>
    <div className="haus-dex-profile"><TokenArt coin={coin}/><div><h3>{coin.name}</h3><span>${coin.ticker}</span></div><a className="button secondary" href={coin.marketUrl} target="_blank" rel="noreferrer">View profile <ArrowUpRight size={14}/></a></div>
    <div className="haus-funding"><span className="haus-feature-state"><LockKeyhole size={12}/>Funding not connected</span><h3>ONE COIN.<br/>EVERYONE CHIPS IN.</h3><p>A shared fund for the coin’s DEX profile.</p><div className="haus-currency-options"><span>SOL</span><span>USDC</span></div><button className="button secondary" disabled>Contributions unavailable</button><small>No deposit address has been created.</small></div>
    <div className="haus-resource-row"><h3>Project links</h3><div>{[...coin.websites,...coin.socials].map((l,i)=><a key={i} href={l.url} target="_blank" rel="noreferrer">{l.label==='twitter'?'X / Twitter':l.label}<ArrowUpRight size={14}/></a>)}<a href={`https://pump.fun/coin/${coin.mint}`} target="_blank" rel="noreferrer">Pump.fun<ArrowUpRight size={14}/></a></div></div>
   </>}
   {tab==='proposals'&&<CommunityPitches coin={coin} room={room} wallet={wallet} loading={loading} error={feedError} onCreate={()=>selectTab('website')} onView={value=>{setDesign(value);selectTab('website');}} onVote={vote}/>}
   {tab==='assets'&&<>
    <div className="haus-tool-heading"><div><h2>Brand assets</h2></div><ImageIcon size={25}/></div><div className="haus-assets"><div className="haus-asset-art"><TokenArt coin={coin}/><a className="button secondary" href={coin.imageUrl} target="_blank" rel="noreferrer">Open artwork <ArrowUpRight size={14}/></a></div><div className="haus-asset-info"><label>NAME<b>{coin.name}</b></label><label>TICKER<b>${coin.ticker}</b></label><label>CONTRACT<span>{coin.mint}</span><button className="text-button" onClick={()=>void copy(coin.mint)}><Copy size={13}/>Copy address</button></label></div></div><CommunityAssets coin={coin} room={room} loading={loading} error={feedError} onUpload={uploadAsset}/>
   </>}
   {tab==='vault'&&<VaultPanel mint={coin.mint}/>}
   {tab==='chart'&&<><div className="haus-tool-heading"><div><h2>The market</h2></div><a className="button secondary" href={`https://pump.fun/coin/${coin.mint}`} target="_blank" rel="noreferrer">Trade <ArrowUpRight size={14}/></a></div><MarketChart coin={coin}/><MarketTables coin={coin}/></>}
   </div>
  </div>
  <aside className="haus-room" aria-label="Team chat"><header className="haus-room-header"><div><MessageCircle size={18}/><h2>Team chat</h2></div><div className="haus-room-buttons"><button className="icon-button" aria-label={chatSize==='expanded'?'Restore chat size':'Expand chat'} onClick={()=>setChatSize(chatSize==='expanded'?'normal':'expanded')}><ChevronUp size={18}/></button><button className="icon-button" aria-label={chatSize==='collapsed'?'Open chat':'Minimize chat'} onClick={()=>setChatSize(chatSize==='collapsed'?'normal':'collapsed')}><ChevronDown size={18}/></button></div></header>
   <div className="haus-room-body"><div className="haus-messages" ref={chatList} aria-live="polite" aria-relevant="additions" onScroll={()=>{const e=chatList.current!;nearBottom.current=e.scrollHeight-e.scrollTop-e.clientHeight<60;}}>
   {feedError?<div className="haus-chat-empty" role="alert"><p>{feedError}</p></div>:loading?<div className="haus-chat-empty">Loading messages…</div>:!room.messages.length?<div className="haus-chat-empty"><p>No messages yet.</p></div>:room.messages.map(m=><article className={`haus-message ${m.wallet===wallet?'own':''}`} key={m.id}><header><span className="haus-avatar">{m.wallet.slice(0,2)}</span><b title={m.wallet}>{short(m.wallet)}{m.wallet===wallet?' · you':''}</b><time dateTime={m.createdAt}>{new Date(m.createdAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</time></header><p>{m.text}</p></article>)}
   </div><div className="haus-composer">{active?<><form onSubmit={e=>{e.preventDefault();void send();}}><textarea aria-label="Message the Haus" placeholder="Write a message…" value={text} maxLength={1000} rows={2} onChange={e=>setText(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.nativeEvent.isComposing){e.preventDefault();void send();}}}/><button aria-label="Send message" disabled={sending||!text.trim()}><Send size={17}/></button></form></>:<><button className="button dark full" onClick={()=>setVerifyOpen(true)}><LockKeyhole size={14}/>Verify to chat</button></>}</div></div>
  </aside></div>
  {notice&&<div className="haus-notice" role="status">{notice}<button onClick={()=>setNotice('')} aria-label="Dismiss message">×</button></div>}
  <Dialog inline={initialVerifyOpen} open={verifyOpen} onOpenChange={setVerifyOpen} title={active?'YOU’RE IN.':'YOUR COIN. YOUR HAUS.'} description={active?`You’re verified for ${coin.name}.`:`Hold $${coin.ticker} to build, pitch and chat.`} className="haus-verify-dialog"><div className="haus-verify-art"><TokenArt coin={coin}/><ShieldCheck size={42}/></div><ol className="haus-verify-steps"><li className={wallet?'done':''}><span>{wallet?<Check size={14}/>:'1'}</span><div>Connect your wallet<small>{wallet?short(wallet):'Your Solana wallet'}</small></div></li><li className={active?'done':''}><span>{active?<Check size={14}/>:'2'}</span><div>Sign & verify holdings<small>A positive token balance on mainnet</small></div></li></ol>{verifyError&&<p className="haus-verify-error" role="alert">{verifyError}</p>}{active?<button className="button dark full" onClick={()=>setVerifyOpen(false)}>Back to the Haus <ArrowUpRight size={15}/></button>:<button className="button dark full" disabled={verifying} onClick={()=>void verify()}>{verifying?'Waiting for verification…':wallet?'Sign & verify holdings':'Connect wallet'} <Wallet size={16}/></button>}<p className="haus-footnote">Message signature only. No transaction or token transfer. Holdings are checked again when you post, vote or upload.</p></Dialog>
 </section>;
}
