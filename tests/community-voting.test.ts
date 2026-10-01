import {test} from 'node:test';
import assert from 'node:assert/strict';
import {coins,type Proposal,voteOn,winningProposal,closeRound} from '../lib/haus-data';
const initialProposals:Proposal[]=[
 {id:'p1',coinId:coins[0].id,author:'frogfather.sol',votes:128,voted:false,status:'open',design:{title:`${coins[0].name}.\nbuilt by us.`,tagline:'the internet needs a deep breath.',description:coins[0].story,theme:'editorial'}},
 {id:'p2',coinId:coins[0].id,author:'lily.sol',votes:96,voted:false,status:'open',design:{title:`Welcome to ${coins[0].name}.`,tagline:'built different. built together.',description:coins[0].story,theme:'playful'}},
 {id:'p3',coinId:coins[1].id,author:'anonymous.sol',votes:74,voted:false,status:'open',design:{title:`${coins[1].name}.\nbuilt together.`,tagline:'a home for the beautifully anonymous.',description:coins[1].story,theme:'midnight'}},
];

test('A preview vote toggles without accumulating duplicate votes',()=>{
 const once=voteOn(initialProposals,'p1');assert.equal(once[0].votes,129);assert.equal(once[0].voted,true);
 const twice=voteOn(once,'p1');assert.equal(twice[0].votes,128);assert.equal(twice[0].voted,false);
 assert.equal(initialProposals[0].votes,128);
});
test('Round selects the unique winner for that token and closes losing designs',()=>{
 assert.equal(winningProposal(initialProposals,initialProposals[0].coinId)?.id,'p1');
 const result=closeRound(initialProposals,initialProposals[0].coinId);assert.equal(result[0].status,'published');assert.equal(result[1].status,'closed');assert.equal(result[2].status,'open');
 assert.deepEqual(voteOn(result,'p1'),result);assert.deepEqual(voteOn(result,'p2'),result);
 assert.equal(winningProposal(result,initialProposals[0].coinId),null);
});
test('Ties and zero turnout do not publish; another token cannot affect outcome',()=>{
 const tied=initialProposals.map(p=>({...p,votes:10}));assert.equal(winningProposal(tied,initialProposals[0].coinId),null);assert.deepEqual(closeRound(tied,initialProposals[0].coinId),tied);
 assert.equal(winningProposal(initialProposals.map(p=>({...p,votes:0})),initialProposals[0].coinId),null);
 const another=initialProposals.map(p=>p.id==='p3'?{...p,votes:999999}:p);assert.equal(winningProposal(another,initialProposals[0].coinId)?.id,'p1');
});
test('A later round replaces the published version without deleting its history',()=>{
 const first=closeRound(initialProposals,initialProposals[0].coinId);
 const next=[...first,{...initialProposals[1],id:'p4',votes:20}];
 const result=closeRound(next,initialProposals[0].coinId);assert.equal(result.filter(p=>p.coinId===initialProposals[0].coinId&&p.status==='published').length,1);assert.equal(result.find(p=>p.id==='p4')?.status,'published');assert.equal(result.find(p=>p.id==='p1')?.status,'closed');
});
