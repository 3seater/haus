import {mkdir,readFile,writeFile,rename} from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import type {SiteDesign} from './haus-data';
import {HttpError} from './config';
export type RoomMessage={id:string;wallet:string;text:string;createdAt:string};
export type SitePitch={id:string;wallet:string;design:SiteDesign;createdAt:string};
export type HausRoom={messages:RoomMessage[];pitches:SitePitch[]};
const directory=path.join(process.cwd(),'.haus-data');
let queue:Promise<unknown>=Promise.resolve();
// Caller validates the mint against HAUS's token registry before accessing storage.
export async function readRoom(mint:string):Promise<HausRoom>{
 try{return JSON.parse(await readFile(path.join(directory,`${mint}.json`),'utf8'));}
 catch(error){if((error as NodeJS.ErrnoException).code==='ENOENT')return {messages:[],pitches:[]};throw error;}
}
export function contribute(mint:string,wallet:string,content:{text:string}|{design:SiteDesign}){
 const operation=queue.then(async()=>{
  const room=await readRoom(mint),now=Date.now();
  const recent=[...room.messages,...room.pitches].filter(x=>x.wallet===wallet).sort((a,b)=>b.createdAt.localeCompare(a.createdAt))[0];
  if(recent&&now-Date.parse(recent.createdAt)<3000)throw new HttpError(429,'Give it a moment before posting again.');
  const base={id:randomUUID(),wallet,createdAt:new Date(now).toISOString()};
  if('text' in content){room.messages.push({...base,text:content.text});room.messages=room.messages.slice(-500);}
  else{if(room.pitches.length>=50)throw new HttpError(409,'This Haus has reached its pitch limit.');room.pitches.push({...base,design:content.design});}
  await mkdir(directory,{recursive:true});
  const target=path.join(directory,`${mint}.json`),temp=`${target}.tmp`;
  await writeFile(temp,JSON.stringify(room),'utf8');await rename(temp,target);return room;
 });
 queue=operation.catch(()=>{});return operation;
}
