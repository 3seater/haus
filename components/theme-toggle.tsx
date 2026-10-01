'use client';
import {useEffect,useSyncExternalStore} from 'react';
import {Moon,Sun} from 'lucide-react';

type Theme='light'|'dark';
const key='haus-theme';
const eventName='haus-theme-change';
function current():Theme{return document.documentElement.dataset.theme==='dark'?'dark':'light';}
function subscribe(notify:()=>void){
 window.addEventListener(eventName,notify);
 return()=>window.removeEventListener(eventName,notify);
}
function apply(theme:Theme){
 document.documentElement.dataset.theme=theme;
 window.dispatchEvent(new Event(eventName));
}
export function ThemeSync(){
 useEffect(()=>{
  // Storage can be unavailable in private contexts; the toggle still works locally.
  try{const stored=localStorage.getItem(key);apply(stored==='dark'?'dark':'light');}catch{apply(current());}
  function sync(event:StorageEvent){if(event.key===key||event.key===null)apply(event.newValue==='dark'?'dark':'light');}
  window.addEventListener('storage',sync);
  return()=>window.removeEventListener('storage',sync);
 },[]);
 return null;
}
export function ThemeToggle(){
 const theme=useSyncExternalStore(subscribe,current,()=> 'light' as Theme);
 function toggle(){
  const next:Theme=current()==='dark'?'light':'dark';
  apply(next);
  try{localStorage.setItem(key,next);}catch{}
 }
 return <button className="theme-toggle" type="button" onClick={toggle} aria-label={`Switch to ${theme==='dark'?'light':'dark'} mode`} title={`Switch to ${theme==='dark'?'light':'dark'} mode`}>
  {theme==='dark'?<Sun size={18} strokeWidth={1.8}/>:<Moon size={18} strokeWidth={1.8}/>}
 </button>;
}
