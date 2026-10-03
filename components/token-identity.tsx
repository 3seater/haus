import {Copy} from 'lucide-react';
import type {Coin} from '@/lib/haus-data';
import {TokenArt} from './token-art';
import {SkeletonValue} from './ui/skeleton';

export function TokenIdentity({coin,onCopy,loading=false}:{coin:Coin;onCopy:()=>void;loading?:boolean}){
 return <div className="token-heading">{loading?<span className="token-art skeleton" aria-hidden="true"/>:<TokenArt coin={coin}/>}<div><h1><SkeletonValue loading={loading} width={loading?"10ch":"auto"}>{coin.name}<span>${coin.ticker}</span></SkeletonValue></h1><button className="address-copy" title={coin.mint} aria-label={`Copy contract address for ${coin.name}`} onClick={onCopy}><SkeletonValue loading={loading} width="15ch">{coin.mint.slice(0,6)}…{coin.mint.slice(-6)}</SkeletonValue> <Copy size={12}/></button></div></div>;
}
