import {test} from 'node:test';
import assert from 'node:assert/strict';
import {BN} from '@coral-xyz/anchor';
import {PublicKey,Keypair} from '@solana/web3.js';
import type {BondingCurve} from '@pump-fun/pump-sdk';
import {curveMarket} from '../lib/curve-market';
import {tokenImageSources} from '../lib/token-image';
const curve={virtualTokenReserves:new BN('1073000000000000'),virtualQuoteReserves:new BN('30000000000'),realTokenReserves:new BN('793100000000000'),tokenTotalSupply:new BN('1000000000000000'),complete:false,isMayhemMode:false,quoteMint:PublicKey.default} as BondingCurve;
test('A new curve has a USD market cap before a DEX pair is indexed',()=>{
 const result=curveMarket(curve,120);
 assert.ok(Math.abs(result.cap!-3355.0792171481825)<0.00001);
 assert.equal(result.progress,0);
 assert.ok(Math.abs(result.cap!-result.price!*1e9)<0.00001);
 assert.equal(curveMarket({...curve,realTokenReserves:new BN('396550000000000')},120).progress,50);
});
test('Do not invent quotes without SOL pricing or reuse completed/non-SOL curves',()=>{
 assert.equal(curveMarket(curve,null).price,null);
 assert.equal(curveMarket({...curve,complete:true},120).price,null);
 assert.equal(curveMarket({...curve,complete:true},120).progress,100);
 assert.equal(curveMarket({...curve,quoteMint:Keypair.generate().publicKey},120).cap,null);
 assert.equal(curveMarket({...curve,virtualTokenReserves:new BN(0)},120).cap,null);
 assert.equal(curveMarket({...curve,isMayhemMode:true},120).progress,null);
});
test('IPFS artwork keeps its content identity across gateway fallbacks',()=>{
 const original='https://ipfs.io/ipfs/bafkreitest';
 assert.deepEqual(tokenImageSources(original),['https://gateway.pinata.cloud/ipfs/bafkreitest','https://dweb.link/ipfs/bafkreitest',original]);
 assert.deepEqual(tokenImageSources('https://example.com/image.png'),['https://example.com/image.png']);
});
