'use client';
import {siteDesignSchema} from '@/lib/site-design';
import {use,useEffect,useState} from 'react';
import type {SiteDesign,Coin} from '@/lib/haus-data';
import {PanelSkeleton} from '@/components/ui/skeleton';
import {SitePreview} from '@/components/site-preview';
export default function SavedSite({params}:{params:Promise<{slug:string}>}){
 const {slug}=use(params);const [coinLoaded,setCoinLoaded]=useState(false);const [coin,setCoin]=useState<Coin|null>(null);const [design,setDesign]=useState<SiteDesign|null>(null);const [loaded,setLoaded]=useState(false);
 useEffect(()=>{let stopped=false;setCoinLoaded(false);void fetch('/api/markets?mint='+encodeURIComponent(slug)).then(async response=>{if(!response.ok)return;const data=await response.json();if(!stopped)setCoin(data.coins.find((c:Coin)=>c.mint===slug)||null);}).catch(()=>{}).finally(()=>{if(!stopped)setCoinLoaded(true);});return()=>{stopped=true;};},[slug]);
 useEffect(()=>{setDesign(null);try{const saved=JSON.parse(localStorage.getItem('haus-workspace-v1')||'{}');const draft=saved.drafts?.[slug];const parsed=siteDesignSchema.safeParse(draft);if(parsed.success)setDesign(parsed.data);}catch{}setLoaded(true);},[slug]);
 if(!loaded||!coinLoaded)return <div className="draft-viewport"><PanelSkeleton label="Loading your saved website" rows={12}/></div>;
 if(!coin||!design)return <div className="empty-state draft-viewport"><h1>No saved website yet.</h1><a className="button primary" href="/app?view=builder">Open site studio</a></div>;
 return <div className="public-site draft-viewport"><div className="public-preview-banner">Saved draft · this device <a href={'/app?coin='+coin.mint+'&view=builder'}>Edit website ↗</a></div><SitePreview coin={coin} design={design}/></div>;
}
