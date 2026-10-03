import {coins} from './fixtures/coins';
import {test} from 'node:test';
import assert from 'node:assert/strict';

import {emptyMarket,normalizeMarket,selectMarketPair,staleMarket,type DexPair} from '../lib/market-data';
import {exportSite} from '../lib/export-site';
const coin=coins[0];
const pair:DexPair={chainId:'solana',dexId:'pumpfun',pairAddress:coins[1].mint,baseToken:{address:coin.mint,name:coin.name,symbol:coin.ticker},priceUsd:'0.000031',marketCap:31000,liquidity:{usd:4000},volume:{h24:500}};
test('Market selection rejects wrong-chain, quote-only and invalid pairs',()=>{
 assert.equal(selectMarketPair([{...pair,chainId:'ethereum'},{...pair,baseToken:{...pair.baseToken,address:coins[2].mint}},{...pair,pairAddress:'bad'},pair],coin.mint),pair);
 assert.equal(selectMarketPair([],coin.mint),null);
});
test('Market selection chooses liquidity, with volume as a tie-breaker',()=>{
 const liquid={...pair,liquidity:{usd:8000}},active={...liquid,volume:{h24:900}};
 assert.equal(selectMarketPair([pair,liquid,active],coin.mint),active);
});
test('Unavailable markets never reuse snapshot prices or invent zero progress',()=>{
 const market=emptyMarket(coin);assert.equal(market.cap,null);assert.equal(market.price,null);assert.equal(market.change,null);assert.equal(market.progress,null);assert.equal(market.marketStatus,'unavailable');
 const partial=normalizeMarket(coin,{...pair,marketCap:undefined,priceUsd:'invalid'},'now');assert.equal(partial.cap,null);assert.equal(partial.price,null);
});
test('External project links accept web URLs only',()=>{
 const market=normalizeMarket(coin,{...pair,info:{websites:[{url:'javascript:alert(1)'},{url:'https://example.com'}],socials:[{url:'data:text/html,unsafe'},{type:'twitter',url:'https://x.com/test'}]}},'now');
 assert.equal(market.websites.length,1);assert.equal(market.socials.length,1);assert.equal(market.price,0.000031);assert.equal(market.cap,31000);
});
test('Website export escapes editable content and uses the real contract',()=>{
 const html=exportSite(coin,{title:'<script>alert("x")</script>',tagline:'A & B',description:'A "coin"',theme:'editorial'});
 assert.ok(!html.includes('<script>'));assert.ok(html.includes('&lt;script&gt;'));assert.ok(html.includes('A &amp; B'));assert.ok(html.includes(coin.mint));assert.ok(!html.includes(`https://pump.fun/coin/${coin.mint}`));assert.ok(html.includes('<!doctype html>'));
});

test('Provider failures preserve only recent genuine quotes, labelled stale with original timestamp',()=>{
 const now=Date.now(),previous=normalizeMarket(coin,pair,new Date(now-1000).toISOString());
 const stale=staleMarket(coin,previous,now);assert.equal(stale.cap,previous.cap);assert.equal(stale.updatedAt,previous.updatedAt);assert.equal(stale.marketStatus,'stale');
 assert.equal(staleMarket(coin,previous,now+16*60000).price,null);assert.equal(staleMarket(coins[1],previous,now).price,null);
 assert.equal(staleMarket(coin,previous,now+60000).price,null);
});
test('Indexed artwork cannot overwrite the token launch artwork',()=>{
 const registered={...coin,imageUrl:'https://example.com/original.png'};
 assert.equal(normalizeMarket(registered,{...pair,info:{imageUrl:'https://example.com/other.png'}},new Date().toISOString()).imageUrl,registered.imageUrl);
});
