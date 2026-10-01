import {PublicKey} from '@solana/web3.js';
import {rpc} from './solana';
import {HttpError} from './config';
export async function launchLookupTable(){
 let address:PublicKey;
 try{address=new PublicKey(process.env.HAUS_LAUNCH_LOOKUP_TABLE!);}catch{throw new HttpError(503,'Launch address lookup table has not been configured.');}
 const result=await rpc().getAddressLookupTable(address,{commitment:'finalized'});
 if(!result.value||!result.value.isActive()||result.value.state.authority)throw new HttpError(503,'Launch lookup table must be finalized, active and frozen.');
 // Frozen tables cannot be extended, deactivated or closed by an administrator.
 return result.value;
}
