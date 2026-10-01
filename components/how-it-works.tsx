'use client';
import {useState} from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {ArrowLeft,ArrowRight,ArrowUpRight,Users,X} from 'lucide-react';
import {HausMark} from './haus-mark';
import './how-it-works.css';

const slides=[
 {title:'A coin. A community.',copy:'Big ideas start small. Give yours a place to belong.'},
 {title:'Find your coin.',copy:'Follow the chart. Find the community. Make yourself at home.'},
 {title:'Build its home.',copy:'Design a website. Make it yours. Export it to the world.'},
 {title:'We are the devs.',copy:'Traders become builders. That’s the idea behind HAUS.'},
];

function Artwork({step}:{step:number}){
 if(step===0)return <div className="guide-art"><div className="guide-emblem"><HausMark/></div></div>;
 if(step===1)return <div className="guide-art"><div className="guide-market"><header><HausMark/><span>YOUR COIN</span><ArrowUpRight size={15}/></header><svg viewBox="0 0 280 120"><path d="M0 35H280M0 75H280M0 115H280" stroke="var(--line)" fill="none"/><path d="M0 106 25 95 47 102 74 73 97 83 125 52 148 64 173 37 198 45 227 19 250 29 280 9" stroke="var(--ink)" strokeWidth="3" fill="none" strokeLinejoin="round"/></svg><footer>THE CHART IS JUST THE START.</footer></div></div>;
 if(step===2)return <div className="guide-art"><div className="guide-website"><header><i/><i/><i/><span>YOUR COIN / YOUR WORLD</span></header><div><b>GOOD<br/>COMPANY.</b><HausMark/></div><footer><span/><span/><ArrowUpRight size={14}/></footer></div></div>;
 return <div className="guide-art"><div className="guide-people"><span><Users size={25}/></span><i/><span className="guide-people-home"><HausMark/></span><i/><span><Users size={25}/></span></div></div>;
}

export function HowItWorks({onClose,onStart}:{onClose:()=>void;onStart:()=>void}){
 const [step,setStep]=useState(0);const slide=slides[step];
 return <Dialog.Root open onOpenChange={open=>{if(!open)onClose();}}><Dialog.Portal><Dialog.Overlay className="modal-overlay guide-overlay"/><Dialog.Content className={`haus-guide guide-step-${step}`} onKeyDown={e=>{if(e.key==='ArrowRight'){e.preventDefault();setStep(s=>Math.min(slides.length-1,s+1));}if(e.key==='ArrowLeft'){e.preventDefault();setStep(s=>Math.max(0,s-1));}}}>
 <Dialog.Close className="guide-close" aria-label="Close how it works"><X size={18}/></Dialog.Close>
 <div className="guide-slide" key={step}><div aria-hidden="true"><Artwork step={step}/></div><div className="guide-copy" aria-live="polite"><Dialog.Title className="guide-title">{slide.title}</Dialog.Title><Dialog.Description className="guide-description">{slide.copy}</Dialog.Description></div></div>
 <div className="guide-pagination" aria-label="Walkthrough slides">{slides.map((s,i)=><button key={s.title} aria-label={`Slide ${i+1}: ${s.title}`} aria-current={step===i?'step':undefined} data-complete={i<step||undefined} onClick={()=>setStep(i)}><span/></button>)}</div>
 <footer className="guide-navigation"><button className="guide-back" aria-label="Previous slide" disabled={step===0} onClick={()=>setStep(s=>s-1)}><ArrowLeft size={16}/>Back</button><button className="guide-next" onClick={()=>step===slides.length-1?onStart():setStep(s=>s+1)}>{step===slides.length-1?'Explore HAUS':'Next'}<ArrowRight size={16}/></button></footer>
 </Dialog.Content></Dialog.Portal></Dialog.Root>;
}
