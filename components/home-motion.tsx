'use client';
import {useEffect,useRef,useState} from 'react';
import {ArrowUpRight,ArrowRight} from 'lucide-react';
import {CtaField} from './cta-field';
import {HausMark} from './haus-mark';
import {journeyPosition} from '@/lib/home-motion';
import './home-motion.css';
import {ProductPreview} from './product-preview';

const steps=[
 {title:'Launch your token.',copy:'Create your token on Pump.fun through HAUS, with every transaction reviewed in your wallet.',label:'Launch'},
 {title:'Enter your haus.',copy:'Connect your wallet and verify your holdings. Meet the people building alongside you.',label:'Enter'},
 {title:'Build together.',copy:'Chat with holders, share ideas, and create your coin’s website in one workspace.',label:'Build'},
 {title:'Decide together.',copy:'Pitch a website, vote with other holders and publish the community’s winning design.',label:'Decide'},
];

/** One passive scroll listener per scene; no wheel interception or scroll locking. */
function useScrollScene(ref:React.RefObject<HTMLElement|null>,update:(node:HTMLElement)=>void){
 const updateRef=useRef(update);updateRef.current=update;
 useEffect(()=>{
  const node=ref.current;if(!node)return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');let frame=0;
  const draw=()=>{frame=0;if(!reduced.matches)updateRef.current(node);};
  const schedule=()=>{if(!frame)frame=requestAnimationFrame(draw);};
  const resize=new ResizeObserver(schedule);resize.observe(node);
  window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule);reduced.addEventListener('change',schedule);schedule();
  return()=>{cancelAnimationFrame(frame);resize.disconnect();window.removeEventListener('scroll',schedule);window.removeEventListener('resize',schedule);reduced.removeEventListener('change',schedule);};
 },[ref]);
}

export function HausAssembly({step=3,hero=false}:{step?:number;hero?:boolean}){
 const view=hero?'website':(['launch','enter','website','proposals'] as const)[step];
 return <div className={`haus-assembly ${hero?'assembly-hero':''}`}><ProductPreview view={view} focused={!hero}/></div>;
}

export function ScrollWalkthrough(){
 const ref=useRef<HTMLElement>(null),[active,setActive]=useState(0),activeRef=useRef(0);
 const [manual,setManual]=useState(false);const manualRef=useRef(false);
 useEffect(()=>{const media=matchMedia('(prefers-reduced-motion: reduce), (max-width: 700px), (max-height: 650px)');const update=()=>{manualRef.current=media.matches;setManual(media.matches);};update();media.addEventListener('change',update);return()=>media.removeEventListener('change',update);},[]);
 useScrollScene(ref,node=>{
  if(manualRef.current)return;
  const top=window.innerWidth<=800?72:86;
  const {progress,step:next}=journeyPosition(node.getBoundingClientRect().top,node.offsetHeight,window.innerHeight,top);
  node.style.setProperty('--journey-progress',String(progress));
  if(next!==activeRef.current){activeRef.current=next;setActive(next);}
 });
 function choose(index:number){
  if(manualRef.current){activeRef.current=index;setActive(index);return;}
  const node=ref.current;if(!node)return;const top=innerWidth<=800?72:86;
  const travel=node.offsetHeight-(innerHeight-top);
  window.scrollTo({top:window.scrollY+node.getBoundingClientRect().top-top+(index+.1)/4*travel,behavior:'smooth'});
 }
 return <section id="how" ref={ref} className="home-journey" aria-label="How HAUS works">
  <div className="journey-sticky"><div className="home-wrap journey-inner">
   <div className="journey-heading"><h2>LAUNCH IT. BUILD IT.<br/>TOGETHER.</h2></div>
   <div className="journey-body">
    <div className="journey-story"><span className="journey-big-number" aria-hidden="true">0{active+1}</span><div className="journey-copy" key={active}><h3>{steps[active].title}</h3><p>{steps[active].copy}</p></div></div>
    <HausAssembly step={active}/>
   </div>
   <nav className="journey-timeline" aria-label="Walkthrough steps">{steps.map((step,index)=><button key={step.label} aria-label={`Step ${index+1}: ${step.label}`} aria-current={active===index?'step':undefined} data-complete={index<active} onClick={()=>choose(index)}><span className="journey-timeline-dot"/><span>{step.label}</span></button>)}</nav>
  </div></div>
 </section>;
}

export function ScrollType(){
 const ref=useRef<HTMLElement>(null);
 useScrollScene(ref,node=>{const rect=node.getBoundingClientRect();if(rect.bottom<0||rect.top>innerHeight)return;const progress=(innerHeight-rect.top)/(innerHeight+rect.height);node.style.setProperty('--type-shift',`${(progress-.5)*240}px`);});
 return <section ref={ref} className="home-scroll-type" aria-label="Independent minds. Shared direction."><div aria-hidden="true"><span>INDEPENDENT MINDS. <i><HausMark/></i> INDEPENDENT MINDS. <i><HausMark/></i> </span><span>SHARED DIRECTION. <i><HausMark/></i> SHARED DIRECTION. <i><HausMark/></i> </span></div></section>;
}

export function BuildHausCTA({appUrl}:{appUrl:string}){
 return <section className="home-build-cta">
  <CtaField/>
  <div className="home-wrap build-content"><h2>BUILD<br/>YOUR <span>HAUS.</span></h2><div className="build-actions"><a className="button dark" href={appUrl}>Build your haus <ArrowUpRight size={20}/></a><a className="button build-docs" href="/docs">Read the docs <ArrowUpRight size={20}/></a></div></div>
 </section>;
}
