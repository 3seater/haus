import {headers} from 'next/headers';
import {redirect} from 'next/navigation';
import {HomePage} from '@/components/home-page';
import {siteUrls} from '@/lib/site-urls';
export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const params=await searchParams;
 const {app,docs}=siteUrls((await headers()).get('host')||'localhost');
 if(params.coin||params.view){const query=new URLSearchParams();for(const [key,value] of Object.entries(params)){if(typeof value==='string')query.set(key,value);}redirect(`${app}?${query}`);}
 return <HomePage appUrl={app} docsUrl={docs}/>;
}
