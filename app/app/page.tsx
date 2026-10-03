import type {Metadata} from 'next';
import {HausApp} from '@/components/haus-app';
import {headers} from 'next/headers';
import {siteUrls} from '@/lib/site-urls';
import {registeredCoins,registeredCoin} from '@/lib/token-registry';
import type {Coin} from '@/lib/haus-data';
export const metadata:Metadata={title:'Explore — HAUS'};
export default async function AppPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const {home,docs}=siteUrls((await headers()).get('host')||'localhost');
 const params=await searchParams;
 const value=(key:string)=>typeof params[key]==='string'?params[key] as string:undefined;
 const initialCoins:Coin[]=await registeredCoins().catch(()=>[]);
 const mint=value('coin');
 if(mint&&!initialCoins.some(c=>c.mint===mint)){const coin=await registeredCoin(mint).catch(()=>null);if(coin)initialCoins.push(coin);}
 return <HausApp initialCoins={initialCoins} docsUrl={docs} homeUrl={home} initialMint={mint} initialView={value('view')} initialTab={value('tab')}/>;
}
