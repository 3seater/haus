import type {Coin} from './haus-data';
export type MarketCoin=Coin & {price:number|null;volume:number|null;liquidity:number|null;pairAddress:string|null;marketUrl:string;websites:{label:string;url:string}[];socials:{label:string;url:string}[];updatedAt:string|null;marketStatus:'current'|'unavailable'};
export type DexPair={chainId:string;dexId:string;pairAddress:string;baseToken:{address:string;name:string;symbol:string};priceUsd?:string;marketCap?:number;priceChange?:{h24?:number};volume?:{h24?:number};liquidity?:{usd?:number};info?:{imageUrl?:string;websites?:{label?:string;url:string}[];socials?:{type?:string;url:string}[]}};
export const finite=(value:unknown):number|null=>typeof value==='number'&&Number.isFinite(value)?value:null;
export function safeWebUrl(value:string):string|null{try{const url=new URL(value);return url.protocol==='https:'||url.protocol==='http:'?url.href:null;}catch{return null;}}
export function selectMarketPair(pairs:DexPair[],mint:string){
 return pairs.filter(p=>p.chainId==='solana'&&p.baseToken?.address===mint&&/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(p.pairAddress)).sort((a,b)=>(finite(b.liquidity?.usd)??0)-(finite(a.liquidity?.usd)??0)||(finite(b.volume?.h24)??0)-(finite(a.volume?.h24)??0))[0]??null;
}
export function emptyMarket(coin:Coin):MarketCoin{return {...coin,cap:null,change:null,progress:coin.graduated?100:null,price:null,volume:null,liquidity:null,pairAddress:null,marketUrl:`https://dexscreener.com/solana/${coin.mint}`,websites:[],socials:[],updatedAt:null,marketStatus:'unavailable'};}
export function normalizeMarket(coin:Coin,pair:DexPair|null,updatedAt:string):MarketCoin{
 const base=emptyMarket(coin);if(!pair)return base;
 const links=(items:{label?:string;type?:string;url:string}[]=[])=>items.flatMap(item=>{const url=safeWebUrl(item.url);return url?[{label:item.label||item.type||'Website',url}]:[];});
 return {...base,cap:finite(pair.marketCap),price:pair.priceUsd!==undefined?finite(Number(pair.priceUsd)):null,change:finite(pair.priceChange?.h24),volume:finite(pair.volume?.h24),liquidity:finite(pair.liquidity?.usd),pairAddress:pair.pairAddress,marketUrl:`https://dexscreener.com/solana/${pair.pairAddress}`,imageUrl:pair.info?.imageUrl&&safeWebUrl(pair.info.imageUrl)||coin.imageUrl,websites:links(pair.info?.websites),socials:links(pair.info?.socials),updatedAt,marketStatus:'current'};
}
