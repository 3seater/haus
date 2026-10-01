import type {Metadata} from 'next';
import {HausApp} from '@/components/haus-app';
import {headers} from 'next/headers';
import {siteUrls} from '@/lib/site-urls';
export const metadata:Metadata={title:'Explore — HAUS'};
export default async function AppPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const {home}=siteUrls((await headers()).get('host')||'localhost');
 const params=await searchParams;
 const value=(key:string)=>typeof params[key]==='string'?params[key] as string:undefined;
 return <HausApp homeUrl={home} initialMint={value('coin')} initialView={value('view')} initialTab={value('tab')}/>;
}
