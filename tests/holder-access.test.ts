import {test} from 'node:test';
import assert from 'node:assert/strict';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import {Keypair} from '@solana/web3.js';
import {HolderAccess,ownsTokens} from '../lib/holder-access';

const signer=Keypair.generate(),wallet=signer.publicKey.toBase58(),mint=Keypair.generate().publicKey.toBase58();
const sign=(message:string)=>bs58.encode(nacl.sign.detached(new TextEncoder().encode(message),signer.secretKey));
test('Membership requires a valid wallet signature and a positive holding, and consumes the nonce',async()=>{
 const access=new HolderAccess(async()=>true),c=access.challenge(wallet,mint,'http://localhost:3100');
 const s=await access.verify(c.id,wallet,mint,sign(c.message));
 assert.equal((await access.authorize(s.token,mint)).wallet,wallet);
 await assert.rejects(()=>access.verify(c.id,wallet,mint,sign(c.message)),/expired/);
 await assert.rejects(()=>access.authorize(s.token,'different-mint'),/verify/);
 await assert.rejects(()=>access.authorize('forged-session',mint),/verify/);
 const zero=new HolderAccess(async()=>false),d=zero.challenge(wallet,mint,'http://localhost:3100');
 await assert.rejects(()=>zero.verify(d.id,wallet,mint,sign(d.message)),/No tokens/);
});
test('Wrong wallet, wrong mint, altered message and expired challenges cannot authenticate',async()=>{
 let time=1000;const access=new HolderAccess(async()=>true,()=>time);
 for(const kind of ['wallet','mint','message','expired']){
  const c=access.challenge(wallet,mint,'http://localhost:3100');
  if(kind==='expired')time+=120001;
  await assert.rejects(()=>access.verify(c.id,kind==='wallet'?Keypair.generate().publicKey.toBase58():wallet,kind==='mint'?'different':mint,sign(c.message+(kind==='message'?'altered':''))));
 }
});
test('Each contribution rechecks holdings and sessions expire or fail closed on RPC failure',async()=>{
 let time=0,hasTokens=true,rpcDown=false,checks=0;
 const access=new HolderAccess(async()=>{checks++;if(rpcDown)throw new Error('RPC unavailable');return hasTokens;},()=>time);
 const c=access.challenge(wallet,mint,'http://localhost:3100'),s=await access.verify(c.id,wallet,mint,sign(c.message));
 await access.authorize(s.token,mint);assert.equal(checks,2);
 rpcDown=true;await assert.rejects(()=>access.authorize(s.token,mint),/RPC/);rpcDown=false;
 hasTokens=false;await assert.rejects(()=>access.authorize(s.token,mint),/Holdings changed/);
 hasTokens=true;await assert.rejects(()=>access.authorize(s.token,mint),/verify/);
 const d=access.challenge(wallet,mint,'http://localhost:3100'),s2=await access.verify(d.id,wallet,mint,sign(d.message));
 time+=15*60000;await assert.rejects(()=>access.authorize(s2.token,mint),/verify/);
});
test('Holdings parser binds mint, owner and token program and uses integer units',()=>{
 const entry=(amount:string,owner=wallet,tokenMint=mint,state='initialized',program='TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')=>({account:{owner:program,data:{parsed:{info:{owner,mint:tokenMint,state,tokenAmount:{amount}}}}}});
 assert.equal(ownsTokens({value:[entry('0'),entry('1')]},wallet,mint),true);
 for(const bad of [entry('0'),entry('-1'),entry('1','other'),entry('1',wallet,'other'),entry('1',wallet,mint,'frozen'),entry('1',wallet,mint,'initialized','bad'),entry('NaN')])assert.equal(ownsTokens({value:[bad]},wallet,mint),false);
 assert.throws(()=>ownsTokens({},wallet,mint));
});
