import type {Coin} from './haus-data';
import type {LaunchRecord} from './launch-store';
/** Only finalized launches may become public communities. Never invent market values. */
export function launchCoin(record:LaunchRecord):Coin {
 if(record.status!=='ACTIVE'||!record.launchSignature||record.launchSlot===undefined)throw new Error('Launch is not finalized');
 return {id:record.mintAddress,mint:record.mintAddress,name:record.name,ticker:record.symbol,
 imageUrl:record.imageUrl,color:'#edc4dc',bg:'#edc4dc',art:'image',cap:null,change:null,holders:null,
 members:0,progress:null,graduated:false,createdAt:record.createdAt??'',status:'Building',story:record.description,age:'New'};
}
