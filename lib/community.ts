import {HttpError} from './config';
import type {SiteDesign} from './haus-data';
export type RoomMessage={id:string;wallet:string;text:string;createdAt:string};
export type SitePitch={id:string;wallet:string;design:SiteDesign;createdAt:string;roundId?:string};
export type SiteRound={id:string;openedAt:string;closesAt:string;status:'open'|'published'|'closed';votes:Record<string,string>;winnerId?:string};
export type SharedAsset={id:string;wallet:string;name:string;type:string;size:number;createdAt:string};
export type HausRoom={messages:RoomMessage[];pitches:SitePitch[];rounds:SiteRound[];assets:SharedAsset[];publishedPitchId?:string};
export const SITE_VOTING={durationMs:3600000,minimumVoters:3};
export const emptyRoom=():HausRoom=>({messages:[],pitches:[],rounds:[],assets:[]});
export function normalizeRoom(value:Partial<HausRoom>):HausRoom{return {...emptyRoom(),...value};}
export function finalizeRounds(room:HausRoom,now:number){
 for(const round of room.rounds){
  if(round.status!=='open'||Date.parse(round.closesAt)>now)continue;
  const votes=Object.values(round.votes),counts=new Map<string,number>();
  for(const id of votes)if(room.pitches.some(p=>p.id===id&&p.roundId===round.id))counts.set(id,(counts.get(id)||0)+1);
  const winner=[...counts].find(([,count])=>count>votes.length/2);
  if(votes.length>=SITE_VOTING.minimumVoters&&winner){round.status='published';round.winnerId=winner[0];room.publishedPitchId=winner[0];}
  else round.status='closed';
 }
 return room;
}
export type Contribution={text:string}|{design:SiteDesign}|{pitchId:string}|{asset:SharedAsset};
// All callers authorize the wallet against fresh on-chain holdings before mutation.
export function applyContribution(room:HausRoom,wallet:string,content:Contribution,now:number,id:string){
 finalizeRounds(room,now);
 const base={id,wallet,createdAt:new Date(now).toISOString()};
 if('pitchId' in content){
  const pitch=room.pitches.find(p=>p.id===content.pitchId),round=room.rounds.find(r=>r.id===pitch?.roundId);
  if(!pitch||!round||round.status!=='open')throw new HttpError(409,'This voting round has closed.');
  // Replacing a choice never increases the wallet's voting power.
  round.votes[wallet]=pitch.id;return room;
 }
 if('asset' in content){
  if(room.assets.length>=100||room.assets.reduce((n,a)=>n+a.size,0)+content.asset.size>64*1024*1024)throw new HttpError(409,'This Haus has reached its shared asset storage limit.');
  room.assets.push({...content.asset,wallet});return room;
 }
 const recent=[...room.messages,...room.pitches].filter(x=>x.wallet===wallet).sort((a,b)=>b.createdAt.localeCompare(a.createdAt))[0];
 if(recent&&now-Date.parse(recent.createdAt)<3000)throw new HttpError(429,'Give it a moment before posting again.');
 if('text' in content){room.messages.push({...base,text:content.text});room.messages=room.messages.slice(-500);return room;}
 let round=room.rounds.find(r=>r.status==='open');
 if(!round){
  // Bound history while retaining the currently published design.
  room.rounds=room.rounds.slice(-9);
  const keep=new Set(room.rounds.map(r=>r.id));room.pitches=room.pitches.filter(p=>p.id===room.publishedPitchId||(p.roundId&&keep.has(p.roundId)));
  round={id,openedAt:base.createdAt,closesAt:new Date(now+SITE_VOTING.durationMs).toISOString(),status:'open',votes:{}};room.rounds.push(round);
 }
 if(room.pitches.some(p=>p.roundId===round!.id&&p.wallet===wallet))throw new HttpError(409,'You already pitched a site in this round. You can pitch again after it closes.');
 if(room.pitches.filter(p=>p.roundId===round!.id).length>=20)throw new HttpError(409,'This round has 20 pitches. Try in the next round.');
 room.pitches.push({...base,design:structuredClone(content.design),roundId:round.id});return room;
}
