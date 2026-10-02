import type {Metadata} from 'next';
import {DocsPage} from '@/components/docs-page';
import {headers} from 'next/headers';
import {siteUrls} from '@/lib/site-urls';
export const metadata:Metadata={title:'Documentation — HAUS',description:'The complete guide to HAUS: discover coins, verify holdings, join communities, build websites and launch tokens.'};
export default async function Page(){const urls=siteUrls((await headers()).get('host')||'');return <DocsPage homeUrl={urls.home} appUrl={urls.app} docsUrl={urls.docs}/>;}
