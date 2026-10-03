import {test} from 'node:test';
import assert from 'node:assert/strict';
import {homeMarketSummary} from '../lib/home-market-summary';
import {emptyMarket} from '../lib/market-data';
import {coins} from './fixtures/coins';
const now=Date.now();
const current={...emptyMarket(coins[0]),volume:23.6,updatedAt:new Date(now).toISOString(),marketStatus:'current' as const};
test('One unindexed token does not hide available volume or count as zero',()=>{
 const summary=homeMarketSummary([current,emptyMarket(coins[1])],now);
 assert.equal(summary.volume,23.6);assert.equal(summary.partial,true);assert.equal(summary.reporting,1);
 assert.equal(homeMarketSummary([emptyMarket(coins[0])],now).volume,null);
});
test('Volume totals include actual zero, expire old quotes, and identify delayed data',()=>{
 assert.equal(homeMarketSummary([{...current,volume:0}],now).volume,0);
 assert.equal(homeMarketSummary([current,{...current,volume:10}],now).volume,33.6);
 assert.equal(homeMarketSummary([current],now+60001).volume,null);
 assert.equal(homeMarketSummary([{...current,marketStatus:'stale'}],now).delayed,true);
 assert.equal(homeMarketSummary([],now).volume,0);
});
