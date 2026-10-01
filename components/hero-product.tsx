'use client';
import {useEffect,useRef,useState} from 'react';
import {Pause,Play} from 'lucide-react';
import {HausMark} from './haus-mark';
import {ProductPreview} from './product-preview';
import './hero-product.css';

const scenes=[{view:'launch',label:'Launch'},{view:'overview',label:'Community'},{view:'website',label:'Build'}] as const;
export function HeroProduct(){
 const ref=useRef<HTMLDivElement>(null);
 const [active,setActive]=useState(0),[paused,setPaused]=useState(false),[hover,setHover]=useState(false),[focused,setFocused]=useState(false),[visible,setVisible]=useState(false),[reduced,setReduced]=useState(true);
 useEffect(()=>{
  const media=matchMedia('(prefers-reduced-motion: reduce)');const update=()=>setReduced(media.matches);update();media.addEventListener('change',update);
  const observer=new IntersectionObserver(([entry])=>setVisible(entry.isIntersecting));if(ref.current)observer.observe(ref.current);
  return()=>{media.removeEventListener('change',update);observer.disconnect();};
 },[]);
 useEffect(()=>{
  if(paused||hover||focused||!visible||reduced)return;
  const timer=setInterval(()=>{if(document.visibilityState==='visible')setActive(i=>(i+1)%scenes.length);},7000);
  return()=>clearInterval(timer);
 },[paused,hover,focused,visible,reduced]);
 return <div ref={ref} className="hero-product" onPointerEnter={()=>setHover(true)} onPointerLeave={()=>{setHover(false);ref.current?.style.setProperty('--mark-x','0px');ref.current?.style.setProperty('--mark-y','0px');}} onPointerMove={event=>{
  if(reduced||event.pointerType==='touch')return;
  const box=event.currentTarget.getBoundingClientRect();event.currentTarget.style.setProperty('--mark-x',`${((event.clientX-box.left)/box.width-.5)*14}px`);event.currentTarget.style.setProperty('--mark-y',`${((event.clientY-box.top)/box.height-.5)*14}px`);
 }} onFocusCapture={()=>setFocused(true)} onBlurCapture={event=>{if(!event.currentTarget.contains(event.relatedTarget))setFocused(false);}}>
  <div className="hero-product-art" aria-hidden="true"><HausMark/></div>
  <div className="hero-product-stage"><ProductPreview view={scenes[active].view} focused/></div>
  <div className="hero-product-controls" aria-label="Product preview">
   {scenes.map((scene,index)=><button key={scene.view} aria-pressed={active===index} onClick={()=>{setActive(index);setPaused(true);}}>{scene.label}</button>)}
   {!reduced&&<button className="hero-product-play" aria-label={paused?'Play product previews':'Pause product previews'} onClick={()=>setPaused(value=>!value)}>{paused?<Play size={13}/>:<Pause size={13}/>}</button>}
  </div>
 </div>;
}
