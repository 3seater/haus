'use client';

import {useEffect,useState} from 'react';
import {CheckCircle2,X} from 'lucide-react';

export function Toast({message,onDismiss,error=false}:{message:string;onDismiss:()=>void;error?:boolean}) {
 const [displayed,setDisplayed]=useState(message);
 useEffect(()=>{
  if(message){setDisplayed(message);return;}
  // Keep the last message mounted until its exit animation finishes.
  const timer=setTimeout(()=>setDisplayed(''),200);
  return()=>clearTimeout(timer);
 },[message]);
 if(!displayed)return null;
 return <div className={error?'wallet-error-toast':'toast'} data-state={message?'open':'closing'} role={error?'alert':'status'}>
  {!error&&<CheckCircle2 size={18}/>}
  <span>{displayed}</span>
  <button onClick={onDismiss} disabled={!message} aria-label={error?'Dismiss wallet error':'Dismiss notification'}><X size={15}/></button>
 </div>;
}
