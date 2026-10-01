import type {Metadata} from 'next';
import {DocsPage} from '@/components/docs-page';
export const metadata:Metadata={title:'Documentation — HAUS',description:'The complete guide to HAUS: discover coins, verify holdings, join communities, build websites and launch tokens.'};
export default function Page(){return <DocsPage/>;}
