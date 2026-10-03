'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {ArrowRight,Delete} from 'lucide-react';
import {HausMark} from './haus-mark';

export function SiteEntry(){
 const [password,setPassword]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const submitting=useRef(false);
 const edit=useCallback((digit:string)=>{if(submitting.current)return;setError('');setPassword(value=>digit==='delete'?value.slice(0,-1):(value+digit).slice(0,4));},[]);
 const unlock=useCallback(async()=>{
  if(submitting.current||password.length!==4)return;
  submitting.current=true;setBusy(true);setError('');
  try{
   const response=await fetch('/api/site-access',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password})});
   if(!response.ok){const data=await response.json();throw new Error(data.error||'Please try again.');}
   if(window.location.pathname.replace(/\/$/,'')==='/entry')window.location.assign('/');else window.location.reload();
  }catch(e){setError(e instanceof Error?e.message:'Please try again.');setPassword('');setBusy(false);submitting.current=false;}
 },[password]);
 useEffect(()=>{
  const onKey=(event:KeyboardEvent)=>{
   if(event.ctrlKey||event.metaKey||event.altKey)return;
   if(/^\d$/.test(event.key)){event.preventDefault();edit(event.key);}
   else if(event.key==='Backspace'){event.preventDefault();edit('delete');}
   else if(event.key==='Enter'){event.preventDefault();void unlock();}
  };
  window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey);
 },[edit,unlock]);
 return <main className="site-entry"><div className="site-entry-inner">
  <div className="site-entry-logo" aria-label="HAUS"><HausMark/><span>HAUS</span></div>
  <p className="site-entry-eyebrow">A home for your coin.</p>
  <h1>MAKE YOURSELF<br/>AT HOME.</h1>
  <p className="site-entry-instruction" id="entry-instruction">Enter your four-digit access code.</p>
  <form onSubmit={event=>{event.preventDefault();void unlock();}} aria-label="Enter access code" aria-describedby="entry-instruction entry-error" aria-busy={busy}>
   <div className={`site-entry-digits${error?' has-error':''}`} role="status" aria-label={`${password.length} of 4 digits entered`}>
    {[0,1,2,3].map(index=><span key={index} className={index<password.length?'filled':''} aria-hidden="true"><i/></span>)}
   </div>
   <div className="site-entry-keypad">
    {['1','2','3','4','5','6','7','8','9'].map(digit=><button type="button" key={digit} onClick={()=>edit(digit)} disabled={busy} aria-label={digit}>{digit}</button>)}
    <button type="button" className="entry-delete" onClick={()=>edit('delete')} disabled={busy||!password} aria-label="Delete last digit"><Delete size={21}/></button>
    <button type="button" onClick={()=>edit('0')} disabled={busy} aria-label="0">0</button>
    <button type="submit" className="entry-submit" disabled={busy||password.length!==4} aria-label="Enter site">{busy?<span className="entry-loader"/>:<ArrowRight size={24}/>}</button>
   </div>
   <div className="site-entry-error" id="entry-error" role="status">{busy?'Opening the door…':error}</div>
  </form>
  <p className="site-entry-caption">YOUR COIN. YOUR PEOPLE. YOUR HAUS.</p>
 </div></main>;
}
