import {emptyMarket} from './market-data';
// Only used in inert loading layouts; never a market quote or discoverable token.
export function loadingCoin(mint=''){
 return emptyMarket({id:mint,mint,name:'Token name',ticker:'TOKEN',imageUrl:'',color:'#e6e0d9',bg:'#e6e0d9',art:'image',cap:null,change:null,holders:null,members:0,progress:null,graduated:false,createdAt:'2026-01-01T00:00:00Z',status:'Building',story:'',age:''});
}
