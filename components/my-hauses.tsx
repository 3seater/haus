'use client';
import {useEffect,useState} from 'react';
import {useWallet} from '@solana/wallet-adapter-react';
import {WalletMultiButton} from './wallet-button';
import {TokenArt} from './token-art';
import {ArrowUpRight,Users} from 'lucide-react';
import type {MarketCoin} from '@/lib/market-data';
export function MyHauses({markets,onOpen,onExplore}:{markets:MarketCoin[];onOpen:(coin:MarketCoin)=>void;onExplore:()=>void}){
 const {publicKey}=useWallet(),wallet=publicKey?.toBase58();const [mints,setMints]=useState<string[]>([]);
 useEffect(()=>{setMints([]);if(wallet)try{const ids=JSON.parse(localStorage.getItem('haus-memberships:'+wallet)||'[]');if(Array.isArray(ids))setMints(ids.filter(x=>typeof x==='string'));}catch{}},[wallet]);
 const joined=markets.filter(c=>mints.includes(c.mint));
 return <section><div className="page-heading"><div><h1>MY HAUSES.</h1><p>Communities you’ve verified into on this device.</p></div></div>{!wallet?<div className="empty-state"><Users/><h3>YOUR PEOPLE. YOUR HAUSES.</h3><p>Connect your wallet to find your communities.</p><WalletMultiButton/></div>:joined.length?<><div className="my-haus-grid">{joined.map(c=><button key={c.mint} onClick={()=>onOpen(c)}><TokenArt coin={c}/><div><h2>{c.name}</h2><span>${c.ticker}</span></div><ArrowUpRight size={20}/></button>)}</div><p className="muted">Verify your current holdings inside a Haus to participate.</p></>:<div className="empty-state"><Users/><h3>FIND YOUR FIRST HAUS.</h3><p>Open a coin, enter its Haus, and verify your holdings. It will appear here.</p><button className="button primary" onClick={onExplore}>Explore coins <ArrowUpRight size={16}/></button></div>}</section>;
}
