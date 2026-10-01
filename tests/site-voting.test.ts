import {test} from 'node:test';
import assert from 'node:assert/strict';
import {emptyRoom,applyContribution,finalizeRounds,SITE_VOTING} from '../lib/community';
const design={title:'A community site',tagline:'Together',description:'Built by holders',theme:'editorial' as const};
const start=1700000000000;
function pitches(){const room=emptyRoom();applyContribution(room,'author1',{design},start,'p1');applyContribution(room,'author2',{design:{...design,title:'Second'}},start+100,'p2');return room;}
test('One wallet has one changeable vote, and pitch contents are immutable snapshots',()=>{
 const room=pitches();applyContribution(room,'voter',{pitchId:'p1'},start+1000,'unused');applyContribution(room,'voter',{pitchId:'p1'},start+1001,'unused');assert.equal(Object.keys(room.rounds[0].votes).length,1);applyContribution(room,'voter',{pitchId:'p2'},start+1002,'unused');assert.equal(room.rounds[0].votes.voter,'p2');
 assert.throws(()=>applyContribution(room,'author1',{design},start+5000,'p3'),/already pitched/);
 const copy={...design};const r=emptyRoom();applyContribution(r,'a',{design:copy},start,'one');copy.title='Changed';assert.equal(r.pitches[0].design.title,design.title);
});
test('Quorum and strict majority publish only after the deadline',()=>{
 const room=pitches();for(const [wallet,pitchId] of [['a','p1'],['b','p1'],['c','p2']])applyContribution(room,wallet,{pitchId},start+1000, 'unused');
 finalizeRounds(room,start+SITE_VOTING.durationMs-1);assert.equal(room.publishedPitchId,undefined);
 finalizeRounds(room,start+SITE_VOTING.durationMs);assert.equal(room.publishedPitchId,'p1');assert.equal(room.rounds[0].status,'published');
 assert.throws(()=>applyContribution(room,'late',{pitchId:'p2'},start+SITE_VOTING.durationMs,'unused'),/closed/);
});
test('A tie, low turnout or no majority keeps the existing published site',()=>{
 for(const votes of [['p1','p2'],['p1','p1'],['p1','p1','p2','p2'],[]]){
  const room=pitches();room.publishedPitchId='old';votes.forEach((pitchId,i)=>applyContribution(room,'v'+i,{pitchId},start+1000,'unused'));
  finalizeRounds(room,start+SITE_VOTING.durationMs);assert.equal(room.publishedPitchId,'old');assert.equal(room.rounds[0].status,'closed');
 }
});
test('Pitches after expiry start a new round and cannot revive old votes',()=>{
 const room=pitches();applyContribution(room,'a',{design},start+SITE_VOTING.durationMs,'next');assert.equal(room.rounds.length,2);assert.equal(room.pitches[2].roundId,'next');assert.deepEqual(room.rounds[1].votes,{});
 assert.throws(()=>applyContribution(room,'v',{pitchId:'missing'},start+5000000,'unused'),/closed/);
});
