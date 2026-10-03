'use client';
import {ArrowUpRight} from 'lucide-react';
import {HausMark} from './haus-mark';
export function SiteFooter({onHow,homeUrl='/',docsUrl='/docs'}:{onHow:()=>void;homeUrl?:string;docsUrl?:string}){return <footer className="main-footer"><a href={homeUrl} className="brand" aria-label="HAUS home"><HausMark/><span>haus</span></a><span>© {new Date().getFullYear()} HAUS</span><div><button onClick={onHow}>How it works <ArrowUpRight size={12}/></button><a href={docsUrl}>Docs <ArrowUpRight size={12}/></a><a href="https://x.com" target="_blank" rel="noreferrer">Twitter <ArrowUpRight size={12}/></a></div></footer>;}
