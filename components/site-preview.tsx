'use client';
import { ArrowUpRight, Copy, Home } from 'lucide-react';
import {useState} from 'react';
import {Coin,SiteDesign} from '@/lib/haus-data';
import {TokenArt} from './token-art';
export function SitePreview({coin,design,compact=false}:{coin:Coin;design:SiteDesign;compact?:boolean}){
 const [copied,setCopied]=useState(false);
 return <div inert={compact || undefined} className={`generated-site theme-${design.theme} ${compact?'compact':''}`} style={{'--coin-color':coin.color} as React.CSSProperties}>
  <header><span className="site-wordmark">{coin.name}<span>®</span></span><span className="site-nav">our story <span>the community</span><ArrowUpRight size={14}/></span></header>
  <div className="generated-hero"><div><span className="site-eyebrow">{design.tagline}</span><h2>{design.title}</h2><p>{design.description}</p><button onClick={()=>{window.location.href=`/?coin=${coin.mint}&view=community`;}}>meet the community <ArrowUpRight size={15}/></button></div><div className="site-art"><TokenArt coin={coin}/><span className="art-sticker">100%<br/>community energy</span></div></div>
  <footer id="community-note"><span><Home size={12}/> a haus built by holders</span><button onClick={()=>{void navigator.clipboard.writeText(coin.mint).then(()=>setCopied(true)).catch(()=>setCopied(false));}}><Copy size={11}/>{copied?'Address copied':`${coin.ticker} · copy address`}</button><span>make yourself at home ↗</span></footer>
 </div>;
}
