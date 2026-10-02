'use client';
import {useState} from 'react';
import {ArrowRight} from 'lucide-react';
import {HausMark} from './haus-mark';
export function SiteEntry(){
 const [password,setPassword]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 return <main className="site-entry"><div className="site-entry-inner">
  <div className="site-entry-logo" aria-label="HAUS"><HausMark/></div>
  <form onSubmit={async e=>{e.preventDefault();if(busy)return;setBusy(true);setError('');try{const response=await fetch('/api/site-access',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password})});if(!response.ok){const data=await response.json();throw new Error(data.error||'Please try again.');}if(window.location.pathname.replace(/\/$/,'')==='/entry'){window.location.assign('/');}else{window.location.reload();}}catch(e){setError(e instanceof Error?e.message:'Please try again.');setBusy(false);}}}>
   <div className="site-entry-field"><input aria-label="Site password" aria-describedby={error?'entry-error':undefined} aria-invalid={!!error} type="password" autoComplete="current-password" placeholder="Password" value={password} maxLength={128} onChange={e=>{setPassword(e.target.value);setError('');}} required/><button aria-label="Enter site" disabled={busy||!password}>{busy?<span className="entry-loader"/>:<ArrowRight size={20}/>}</button></div>
   <div className="site-entry-error" id="entry-error" role="status">{error}</div>
  </form>
 </div></main>;
}
