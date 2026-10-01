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
