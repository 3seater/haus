import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseCandles,parseTrades,formatPrice} from '../lib/chart-data';
test('Candles are chronological, deduplicated and invalid OHLC values are omitted',()=>{
 const candles=parseCandles([[200,2,3,1,2.5,10],[100,1,2,.5,1.5,5],[200,2,4,1,3,20],[300,5,3,1,2,1],[400,2,3,1,2,-10],[500,NaN,3,1,2,1]]);
 assert.deepEqual(candles.map(c=>c.time),[100,200]);assert.equal(candles[1].close,3);assert.deepEqual(parseCandles(null),[]);
});
test('Trade direction is derived from requested token rather than pool base side',()=>{
 const mint='11111111111111111111111111111111',wallet='22222222222222222222222222222222';
 const attributes={tx_hash:'3'.repeat(88),tx_from_address:wallet,block_timestamp:'2026-09-30T20:00:00Z',kind:'sell',from_token_address:wallet,to_token_address:mint,to_token_amount:'50',from_token_amount:'2',price_to_in_usd:'.04',price_from_in_usd:'1',volume_in_usd:'2'};
 const trades=parseTrades([{id:'one',attributes}],mint);assert.equal(trades[0].side,'buy');assert.equal(trades[0].amount,50);assert.equal(trades[0].price,.04);
 assert.deepEqual(parseTrades([{attributes:{...attributes,from_token_address:wallet,to_token_address:wallet}}],mint),[]);
 assert.deepEqual(parseTrades([{attributes:{...attributes,tx_hash:'<script>'}}],mint),[]);
});
test('Small token prices retain meaningful precision',()=>{
 assert.equal(formatPrice(null),'—');assert.equal(formatPrice(0),'$0');assert.equal(formatPrice(.0000000321),'$0.0000000321');
});
