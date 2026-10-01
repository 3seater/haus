import {test} from 'node:test';
import assert from 'node:assert/strict';
import {launchCoin} from '../lib/launch-coin';
import type {LaunchRecord} from '../lib/launch-store';
const record:LaunchRecord={mintAddress:'mint',name:'Example',symbol:'EX',description:'Story',imageUrl:'https://example.com/logo.png',metadataUri:'https://example.com/token.json',creatorWallet:'wallet',status:'ACTIVE',launchSignature:'signature',launchSlot:123,createdAt:'2026-10-01T00:00:00.000Z'};
test('Only a finalized launch becomes a community; live values stay unavailable until indexed',()=>{
 assert.throws(()=>launchCoin({...record,status:'PENDING'}));
 assert.throws(()=>launchCoin({...record,launchSignature:undefined}));
 assert.throws(()=>launchCoin({...record,launchSlot:undefined}));
 const coin=launchCoin(record);assert.equal(coin.id,record.mintAddress);assert.equal(coin.story,'Story');assert.equal(coin.createdAt,record.createdAt);
 for(const value of [coin.cap,coin.change,coin.progress,coin.holders])assert.equal(value,null);
});
