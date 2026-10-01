import {HttpError} from './config';
export const MAX_ASSET_BYTES=4*1024*1024;
export function assetFormat(bytes:Uint8Array){
 if(bytes.length<12||bytes.length>MAX_ASSET_BYTES)throw new HttpError(400,'Choose a PNG, JPEG, WebP or GIF under 4 MB.');
 const b=Buffer.from(bytes);
 if(b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))return {type:'image/png',extension:'png'};
 if(b[0]===255&&b[1]===216&&b[2]===255)return {type:'image/jpeg',extension:'jpg'};
 if(b.toString('ascii',0,4)==='RIFF'&&b.toString('ascii',8,12)==='WEBP')return {type:'image/webp',extension:'webp'};
 if(['GIF87a','GIF89a'].includes(b.toString('ascii',0,6)))return {type:'image/gif',extension:'gif'};
 throw new HttpError(400,'Only PNG, JPEG, WebP and GIF images are supported.');
}
export function assetName(name:string,extension:string){return (name.replace(/\.[^.]*$/,'').replace(/[^a-zA-Z0-9 _-]/g,'').trim().slice(0,70)||'community-asset')+'.'+extension;}
