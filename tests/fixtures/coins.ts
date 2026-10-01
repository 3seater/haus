import snapshot from './token-snapshot.json';
import {launchAge} from '../../lib/token-display';
import type {Coin} from '../../lib/haus-data';

const slugs=['slovenian-inu','bandit','cate','slotvine','pedro'];
const colors=['#b4d689','#c2b6e6','#e5bf88','#90bdff','#f1b198'];
export const coins:Coin[]=snapshot.tokens.map((token,i)=>({
 id:slugs[i],mint:token.mint,name:token.name,ticker:token.symbol,imageUrl:token.imageUrl,
 color:colors[i],bg:colors[i],art:'image',cap:token.marketCap,change:token.change,
 holders:token.holders,members:0,progress:token.progress,graduated:token.graduated,createdAt:token.createdAt,
 status:'Building',story:token.description||('A community website for '+token.name+'.'),age:launchAge(token.createdAt,snapshot.capturedAt),
}));
