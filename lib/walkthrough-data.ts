import type {MarketCoin} from './market-data';
import type {HausRoom} from './community';
import {initialDesign} from './haus-data';

// Local illustration data only: never added to discovery or sent to the API.
export const walkthroughCoin:MarketCoin={
 id:'walkthrough',mint:'haus-walkthrough',name:'Your coin',ticker:'COIN',
 imageUrl:'/haus-mark.svg',color:'#191919',bg:'#ED8EBE',art:'',
 cap:null,change:null,holders:null,members:0,progress:null,graduated:false,
 createdAt:'2026-01-01T00:00:00Z',status:'Building',age:'',
 story:'A coin. A community. A place to build something together.',
 price:null,volume:null,liquidity:null,pairAddress:null,marketUrl:'',
 websites:[],socials:[],updatedAt:null,marketStatus:'unavailable',
};
export const walkthroughRoom:HausRoom={
 messages:[],assets:[],rounds:[],
 pitches:[
  {id:'example-editorial',wallet:'CommunityBuilder',createdAt:'2026-01-01T00:00:00Z',design:initialDesign(walkthroughCoin)},
  {id:'example-minimal',wallet:'HausContributor',createdAt:'2026-01-01T00:00:00Z',design:{...initialDesign(walkthroughCoin),title:'Built together.',tagline:'Our coin. Our next chapter.'}},
 ],
};
