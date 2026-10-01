import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {redis} from './redis';
import {HttpError} from './config';
import {emptyRoom,normalizeRoom,finalizeRounds,applyContribution,type HausRoom,type Contribution} from './community';
export type {HausRoom,RoomMessage,SitePitch} from './community';
const directory=path.join(process.cwd(),'.haus-data');
const cas="local old=redis.call('GET',KEYS[1]); if (old or '')~=ARGV[1] then return 0 end; if KEYS[2] and redis.call('EXISTS',KEYS[2])==0 then return -1 end; redis.call('SET',KEYS[1],ARGV[2]); if KEYS[2] then redis.call('PERSIST',KEYS[2]) end; return 1";
async function load(mint:string){
 const key='room:v2:'+mint;let raw=await redis().get(key);
 if(raw===null){
  let initial=emptyRoom();
  try{initial=normalizeRoom(JSON.parse(await readFile(path.join(directory,mint+'.json'),'utf8')));}catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;}
  await redis().set(key,JSON.stringify(initial),'NX');raw=await redis().get(key);
 }
 if(!raw)throw new HttpError(503,'Room storage is unavailable.');
 return {key,raw,room:normalizeRoom(JSON.parse(raw))};
}
async function update(mint:string,change:(room:HausRoom)=>HausRoom,assetKey?:string){
 for(let attempt=0;attempt<8;attempt++){
  const {key,raw,room}=await load(mint),next=change(room),encoded=JSON.stringify(next);
  if(Buffer.byteLength(encoded)>20*1024*1024)throw new HttpError(409,'This Haus has reached its pitch storage limit.');
  if(encoded===raw)return next;
  const result=Number(await redis().eval(cas,assetKey?2:1,...(assetKey?[key,assetKey]:[key]),raw,encoded));
  if(result===1)return next;
  if(result===-1)throw new HttpError(503,'Upload expired. Please retry.');
 }
 throw new HttpError(409,'The Haus is busy. Please retry your action.');
}
// Closing is deterministic and runs on reads too: no browser/admin is trusted to publish.
export const readRoom=(mint:string)=>update(mint,room=>finalizeRounds(room,Date.now()));
export function contribute(mint:string,wallet:string,content:Contribution){
 const id=randomUUID();return update(mint,room=>applyContribution(room,wallet,content,Date.now(),id),'asset' in content?'room:asset:'+mint+':'+content.asset.id:undefined);
}
