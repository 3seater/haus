import snapshot from './token-snapshot.json';
import {launchAge} from './token-display';
export {money} from './token-display';
export type Coin = {id:string;mint:string;name:string;ticker:string;imageUrl:string;color:string;bg:string;art:string;cap:number|null;change:number|null;holders:number|null;members:number;progress:number|null;graduated:boolean;createdAt:string;status:'Building'|'Site live'|'Voting';story:string;age:string};
export const snapshotAt=snapshot.capturedAt;
const slugs=['slovenian-inu','bandit','cate','slotvine','pedro'];
const colors=['#b4d689','#c2b6e6','#e5bf88','#90bdff','#f1b198'];
export const coins:Coin[]=snapshot.tokens.map((token,i)=>({
 id:slugs[i],mint:token.mint,name:token.name,ticker:token.symbol,imageUrl:token.imageUrl,
 color:colors[i],bg:colors[i],art:'image',cap:token.marketCap,change:token.change,
 holders:token.holders,members:0,progress:token.progress,graduated:token.graduated,createdAt:token.createdAt,
 status:'Building',story:token.description||('A community website for '+token.name+'.'),age:launchAge(token.createdAt,snapshot.capturedAt),
}));
export type Theme='editorial'|'terminal'|'playful'|'midnight';
export type SiteDesign={title:string;tagline:string;description:string;theme:Theme};
export type Proposal={id:string;coinId:string;author:string;votes:number;voted:boolean;design:SiteDesign;status:'open'|'published'|'closed'};
export function voteOn(proposals:Proposal[],id:string){return proposals.map(p=>p.id===id&&p.status==='open'?{...p,voted:!p.voted,votes:p.votes+(p.voted?-1:1)}:p);}
export function winningProposal(proposals:Proposal[],coinId:string):Proposal|null{const eligible=proposals.filter(p=>p.coinId===coinId&&p.status==='open').sort((a,b)=>b.votes-a.votes);if(!eligible.length||eligible[0].votes<=0||eligible[0].votes===eligible[1]?.votes)return null;return eligible[0];}
export function closeRound(proposals:Proposal[],coinId:string){const winner=winningProposal(proposals,coinId);if(!winner)return proposals;return proposals.map(p=>p.coinId===coinId&&(p.status==='open'||p.status==='published')?{...p,status:p.id===winner.id?'published' as const:'closed' as const}:p);}
export const initialDesign=(coin:Coin):SiteDesign=>({title:`${coin.name}.\nbuilt by us.`,tagline:'a coin. a community. a place to call home.',description:coin.story,theme:'editorial'});
