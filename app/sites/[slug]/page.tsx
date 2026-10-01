'use client';
import {use,useEffect,useState} from 'react';
import {coins,type SiteDesign} from '@/lib/haus-data';
import {SitePreview} from '@/components/site-preview';
export default function SavedSite({params}:{params:Promise<{slug:string}>}){
 const {slug}=use(params);const coin=coins.find(c=>c.id===slug);const [design,setDesign]=useState<SiteDesign|null>(null);const [loaded,setLoaded]=useState(false);
 useEffect(()=>{setDesign(null);try{const saved=JSON.parse(localStorage.getItem('haus-workspace-v1')||'{}');const draft=saved.drafts?.[slug];if(draft&&typeof draft.title==='string'&&typeof draft.description==='string'&&typeof draft.tagline==='string'&&['editorial','terminal','playful','midnight'].includes(draft.theme))setDesign(draft);}catch{}setLoaded(true);},[slug]);
 if(!loaded)return <div className="empty-state">Opening your website…</div>;
 if(!coin||!design)return <div className="empty-state"><h1>No saved website yet.</h1><a className="button primary" href="/?view=builder">Open site studio</a></div>;
 return <div className="public-site"><div className="public-preview-banner">Saved draft · this device <a href={'/?coin='+coin.mint+'&view=builder'}>Edit website ↗</a></div><SitePreview coin={coin} design={design}/></div>;
}
