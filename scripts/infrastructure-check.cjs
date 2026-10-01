// Uses random HAUS-only probe keys; never reads or changes Perks application data.
require('@next/env').loadEnvConfig(process.cwd());
const assert=require('node:assert/strict');
const {unlink}=require('node:fs/promises');
const {Keypair}=require('@solana/web3.js');
const {redis}=require('../.worker-build/lib/redis');
const {rpc}=require('../.worker-build/lib/solana');
const {persistSnapshot,readSnapshot}=require('../.worker-build/lib/snapshot-store');
const {buildRewardSnapshot}=require('../.worker-build/lib/reward-snapshot');
const {withWorkerLease}=require('../.worker-build/lib/worker-lease');
async function main(){
 assert.equal(process.env.REDIS_KEY_PREFIX||'haus:','haus:');
 assert.equal(await redis().ping(),'PONG');
 assert.equal(await rpc().getGenesisHash(),'5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d');
 await withWorkerLease(async assertLease=>{await assertLease();await assert.rejects(withWorkerLease(async()=>{}),/Another fee worker/);});
 const round=Keypair.generate().publicKey.toBase58(),wallet=Keypair.generate().publicKey.toBase58();
 const manifest=buildRewardSnapshot(round,0,[{wallet,amount:'1'}],new Set());
 const localFile=`.haus-data/snapshots/${round}.json`;
 try{
  await persistSnapshot(manifest);
  assert.equal(await redis().ttl(`reward-snapshot:${round}`),-1);
  await unlink(localFile);assert.deepEqual(await readSnapshot(round),manifest);
  await persistSnapshot(manifest);
  await assert.rejects(persistSnapshot({...manifest,slot:1}),/different immutable snapshot/);
  await redis().del(`reward-snapshot:${round}`);assert.deepEqual(await readSnapshot(round),manifest);
  console.log(JSON.stringify({mainnetRpc:'PASS',redis:'PASS',snapshotReplication:'PASS',immutableConflict:'PASS',localRecovery:'PASS',realSolSpent:0}));
 }finally{await redis().del(`reward-snapshot:${round}`);await unlink(localFile).catch(()=>{});}
}
main().catch(()=>{console.error('Infrastructure check failed. No credentials were logged.');process.exitCode=1;}).finally(()=>redis().disconnect());
