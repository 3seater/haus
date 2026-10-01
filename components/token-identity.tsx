import {Copy} from 'lucide-react';
import type {Coin} from '@/lib/haus-data';
import {TokenArt} from './token-art';

export function TokenIdentity({coin,onCopy}:{coin:Coin;onCopy:()=>void}){
 return <div className="token-heading"><TokenArt coin={coin}/><div><h1>{coin.name}<span>${coin.ticker}</span></h1><button className="address-copy" title={coin.mint} aria-label={`Copy contract address for ${coin.name}`} onClick={onCopy}>{coin.mint.slice(0,6)}…{coin.mint.slice(-6)} <Copy size={12}/></button></div></div>;
}
