'use client';
import type {Coin,SiteDesign} from '@/lib/haus-data';
import {exportSite} from '@/lib/export-site';
import {useState} from 'react';
import {PanelSkeleton} from './ui/skeleton';
export function SitePreview({coin,design,compact=false}:{coin:Coin;design:SiteDesign;compact?:boolean}){
 const [loaded,setLoaded]=useState(false);
 return <div className={`studio-preview loading-frame ${compact?'compact':''}`} aria-busy={!loaded} data-loading={!loaded}>{!loaded&&<div className="frame-skeleton"><PanelSkeleton label="Loading website preview" rows={8}/></div>}<iframe className="studio-preview-frame" onLoad={()=>setLoaded(true)} title={`${coin.name} website preview`} sandbox="allow-popups allow-popups-to-escape-sandbox" srcDoc={exportSite(coin,design).replace('<head>','<head><base href="about:srcdoc">')}/></div>;
}
