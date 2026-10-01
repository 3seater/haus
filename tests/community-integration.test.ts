import {metadata} from '../lib/ipfs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {Keypair} from '@solana/web3.js';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import {CommunityAccess} from '../lib/community-access';
import {readRoom,contribute} from '../lib/haus-room';
import {redis} from '../lib/redis';
import {createLaunch} from '../lib/pump';
import {OnlinePumpSdk} from '@pump-fun/pump-sdk';
import {rpc} from '../lib/solana';
import {HAUS_CREATOR_RECIPIENT} from '../lib/launch-policy';
const enabled=process.env.HAUS_INTEGRATION_CHECK==='true';
test('Redis keeps sessions across instances, rejects replay, serializes simultaneous votes and persists assets atomically',{skip:!enabled},async()=>{
 const pair=Keypair.generate(),wallet=pair.publicKey.toBase58(),mint=Keypair.generate().publicKey.toBase58();let owns=true;const holds=async()=>owns;const first=new CommunityAccess(holds),second=new CommunityAccess(holds);let challengeId='',token='';const assetId=randomUUID();
 try{
  const challenge=await first.challenge(wallet,mint,'https://haus.test');challengeId=challenge.id;
  const signature=bs58.encode(nacl.sign.detached(new TextEncoder().encode(challenge.message),pair.secretKey));
  const results=await Promise.allSettled([first.verify(challenge.id,wallet,mint,signature),second.verify(challenge.id,wallet,mint,signature)]);
  const successes=results.filter((r):r is PromiseFulfilledResult<Awaited<ReturnType<typeof first.verify>>>=>r.status==='fulfilled');assert.equal(successes.length,1);token=successes[0].value.token;
  assert.equal((await second.authorize(token,mint)).wallet,wallet);
  await assert.rejects(second.authorize(token,Keypair.generate().publicKey.toBase58()));
  const room=await contribute(mint,wallet,{design:{title:'Integration test',tagline:'Test',description:'Test',theme:'editorial'}}),pitchId=room.pitches[0].id;
  const voters=Array.from({length:5},()=>Keypair.generate().publicKey.toBase58());
  await Promise.all(voters.map(voter=>contribute(mint,voter,{pitchId})));
  assert.equal(Object.keys((await readRoom(mint)).rounds[0].votes).length,5);
  const asset={id:assetId,wallet,name:'test.png',type:'image/png',size:16,createdAt:new Date().toISOString()},key='room:asset:'+mint+':'+assetId;
  await assert.rejects(contribute(mint,wallet,{asset}),/Upload expired/);
  await redis().set(key,Buffer.alloc(16),'EX',60);await contribute(mint,wallet,{asset});assert.equal(await redis().ttl(key),-1);assert.equal((await readRoom(mint)).assets.length,1);
  owns=false;await assert.rejects(second.authorize(token,mint),/Holdings changed/);assert.equal(await redis().get('holder:session:'+token),null);
 }finally{try{await redis().del('room:v2:'+mint,'room:asset:'+mint+':'+assetId,'holder:challenge:'+challengeId,'holder:session:'+token,'rate:holder-challenge:'+wallet);}finally{redis().disconnect();}}
});
test('Mainnet launch simulation uses the authorized operator recipient without a vault or initial buy',{skip:process.env.HAUS_LAUNCH_SIMULATION!=='true'},async()=>{
 const publicPayer=(await new OnlinePumpSdk(rpc()).fetchGlobal()).feeRecipient.toBase58();
 const launch=await createLaunch(publicPayer,'HAUS simulation','HAUSTEST','https://example.com/haus-test.json','0');assert.equal(launch.creatorRecipient,HAUS_CREATOR_RECIPIENT);assert.equal(launch.initialBuyLamports,'0');assert.ok(launch.transaction);assert.ok(!('vaultProgram' in launch));
 // simulateTransaction only. No signed transaction is broadcast and no SOL is spent.
});

test('Configured metadata provider accepts an image without creating a token',{skip:process.env.HAUS_METADATA_CHECK!=='true'},async()=>{
 const bytes=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jXioAAAAASUVORK5CYII=','base64');
 const result=await metadata(new File([bytes],'haus-upload-check.png',{type:'image/png'}),'HAUS upload check','CHECK','Metadata storage connectivity check. No token is created.');assert.match(result.uri,/^https:\/\//);assert.match(result.imageUrl,/^https:\/\//);
});
