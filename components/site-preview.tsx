'use client';
import type {Coin,SiteDesign} from '@/lib/haus-data';
import {exportSite} from '@/lib/export-site';
export function SitePreview({coin,design,compact=false}:{coin:Coin;design:SiteDesign;compact?:boolean}){
 return <iframe className={`studio-preview ${compact?'compact':''}`} title={`${coin.name} website preview`} sandbox="allow-popups allow-popups-to-escape-sandbox" srcDoc={exportSite(coin,design).replace('<head>','<head><base href="about:srcdoc">')}/>;
}
