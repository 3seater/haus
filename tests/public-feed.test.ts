import {test} from 'node:test';
import assert from 'node:assert/strict';
import {cachedFeed} from '../lib/public-feed';
test('History cache retains timestamped data on a provider failure and marks it stale',async()=>{
 const key='history-test';const original={candles:[{time:100}],updatedAt:'2026-01-01T00:00:00Z'};
 await cachedFeed(key,-1,async()=>original,true);
 const result=await cachedFeed(key,100,async()=>{throw new Error('rate limit');},true) as typeof original&{stale:boolean};
 assert.deepEqual(result.candles,original.candles);assert.equal(result.updatedAt,original.updatedAt);assert.equal(result.stale,true);
});
test('An uncached failure is not replaced with invented data',async()=>{
 await assert.rejects(cachedFeed('missing-test',100,async()=>{throw new Error('unavailable');},true),/unavailable/);
});

test('History cache refreshes after its freshness budget and deduplicates simultaneous readers',async()=>{
 const {HISTORY_CACHE_MS}=await import('../lib/market-refresh');
 const now=Date.now;let clock=now();Date.now=()=>clock;
 try{
  let reads=0;const read=async()=>({revision:++reads});
  const first=await cachedFeed('history-freshness-test',HISTORY_CACHE_MS,read);
  clock+=HISTORY_CACHE_MS-1;
  assert.deepEqual(await cachedFeed('history-freshness-test',HISTORY_CACHE_MS,read),first);
  clock+=1;
  const results=await Promise.all([cachedFeed('history-freshness-test',HISTORY_CACHE_MS,read),cachedFeed('history-freshness-test',HISTORY_CACHE_MS,read)]);
  assert.equal(reads,2);assert.deepEqual(results,[{revision:2},{revision:2}]);
 }finally{Date.now=now;}
});
