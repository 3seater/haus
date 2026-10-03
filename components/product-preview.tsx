'use client';
import {useEffect,useRef,useState} from 'react';
import {initialDesign,type Coin} from '@/lib/haus-data';
import {usePreviewCoin} from './use-preview-coin';
import {templates} from '@/lib/site-design';
import {SitePreview} from './site-preview';
import './product-preview.css';
import {PanelSkeleton} from './ui/skeleton';
import {loadingCoin} from '@/lib/loading-coin';
import {WalkthroughPreview} from './walkthrough-preview';

type View='launch'|'enter'|'explore'|'overview'|'website'|'proposals';

/** Embed the real app route so the marketing view cannot drift from the product. */
export function ProductPreview({view,focused=false}:{view:View;focused?:boolean}){
 return focused?<DirectProductPreview view={view}/>:<EmbeddedProductPreview view={view}/>;
}
function EmbeddedProductPreview({view,focused=false}:{view:View;focused?:boolean}){
 const coin=usePreviewCoin();
 const ref=useRef<HTMLDivElement>(null);
 const [visible,setVisible]=useState(false),[scale,setScale]=useState(0.5);
 const [sizes,setSizes]=useState<Partial<Record<View,number>>>({});
 const [available,setAvailable]=useState(500);
 const observers=useRef<Map<View,ResizeObserver>>(new Map());
 useEffect(()=>()=>{observers.current.forEach(observer=>observer.disconnect());},[]);
 const [visited,setVisited]=useState<View[]>([view]);
 const [loaded,setLoaded]=useState<Partial<Record<View,boolean>>>({});
 const [displayed,setDisplayed]=useState<View>(view);
 useEffect(()=>{setVisited(previous=>previous.includes(view)?previous:[...previous,view]);},[view]);
 useEffect(()=>{if(loaded[view])setDisplayed(view);},[view,loaded]);
 useEffect(()=>{
  const node=ref.current;if(!node)return;
  const update=()=>{setScale(node.clientWidth/(focused?900:1200));setAvailable(Math.min(540,Math.max(300,window.innerHeight-300)));};
  const resize=new ResizeObserver(update);resize.observe(node);window.addEventListener('resize',update);
  const observer=new IntersectionObserver(([entry])=>{if(entry.isIntersecting){setVisible(true);observer.disconnect();}},{rootMargin:'300px'});observer.observe(node);
  return()=>{resize.disconnect();observer.disconnect();window.removeEventListener('resize',update);};
 },[focused]);
 return <div className={`product-preview ${focused?'product-preview-focused':''}`} ref={ref}>
  <div className="product-preview-screen loading-frame" style={focused?{height:available}:undefined} inert>
   {!loaded[displayed]&&<div className="frame-skeleton"><PanelSkeleton label="Loading app preview" rows={8}/></div>}
   {visible&&visited.map(scene=>{
    const narrow=focused&&(scene==='launch'||scene==='enter');
    const width=narrow?540:focused?900:1200;
    const height=focused?(sizes[scene]||850):850;
    const fit=focused?Math.min(scale*900/width,available/height,1):scale;
    return <iframe key={scene} src={focused?`/app/preview?scene=${scene}`:scene==='explore'||!coin?'/app':`/app?coin=${coin.mint}&view=community&tab=${scene}`} title={`HAUS app — ${scene}`} tabIndex={-1} onLoad={event=>{
     if(focused){
      const content=event.currentTarget.contentDocument?.querySelector(narrow?'.modal-content':'.haus-workspace');
      if(content){const measure=()=>setSizes(previous=>({...previous,[scene]:Math.ceil(content.getBoundingClientRect().height)+32}));observers.current.get(scene)?.disconnect();const observer=new ResizeObserver(measure);observer.observe(content);observers.current.set(scene,observer);measure();}
     }
     setLoaded(previous=>({...previous,[scene]:true}));
    }} style={focused?{width,height,left:'50%',top:'50%',transform:`translate(-50%,-50%) scale(${fit}) translateY(${displayed===scene?0:16}px)`,transformOrigin:'center',opacity:displayed===scene?1:0,visibility:displayed===scene?'visible':'hidden'}:{transform:`scale(${scale})`,visibility:displayed===scene?'visible':'hidden'}}/>;
   })}
  </div>
 </div>;
}

/** Use the exact export renderer and template definitions from the website editor. */
export function TemplatePreview(){
 const coin=usePreviewCoin();return <div className="loading-frame" data-loading={!coin} aria-busy={!coin}>{!coin&&<div className="frame-skeleton"><PanelSkeleton label="Loading website preview" rows={8}/></div>}<LiveTemplatePreview key={coin?.mint||'loading'} coin={coin||loadingCoin()}/></div>;
}
function LiveTemplatePreview({coin}:{coin:Coin}){
 const [design,setDesign]=useState(()=>initialDesign(coin));
 return <div className="product-template-preview">
  <SitePreview coin={coin} design={design}/>
  <div className="product-template-picker" aria-label="Website template">
   {templates.slice(0,3).map(template=><button key={template.id} aria-pressed={design.theme===template.id} onClick={()=>setDesign(d=>({...d,theme:template.id}))}>{template.label}</button>)}
  </div>
 </div>;
}

function DirectProductPreview({view}:{view:View}){
 const host=useRef<HTMLDivElement>(null);
 const [scale,setScale]=useState(.6);
 useEffect(()=>{
  const node=host.current;if(!node)return;
  const observer=new ResizeObserver(()=>setScale(node.clientWidth/900));observer.observe(node);
  return()=>observer.disconnect();
 },[]);
 return <div ref={host} className="direct-product-preview"><div style={{transform:`scale(${scale})`}} className="direct-product-position"><div key={view} className="direct-product-content"><WalkthroughPreview scene={view}/></div></div></div>;
}
