import {PublicKey} from '@solana/web3.js';
import type {BondingCurve} from '@pump-fun/pump-sdk';
export const SOL_MINT='So11111111111111111111111111111111111111112';
export function curveMarket(curve:BondingCurve,solUsd:number|null){
 const reserves=Number(curve.virtualTokenReserves.toString());
 const solQuoted=curve.quoteMint.equals(PublicKey.default)||curve.quoteMint.toBase58()===SOL_MINT;
 const price=!curve.complete&&solQuoted&&reserves>0&&solUsd!==null&&solUsd>0?
  Number(curve.virtualQuoteReserves.toString())/reserves/1000*solUsd:null;
 return {graduated:curve.complete,
  // Standard non-mayhem Pump curves start with 793.1 million saleable tokens.
  progress:curve.complete?100:curve.isMayhemMode?null:Math.max(0,Math.min(100,100*(1-Number(curve.realTokenReserves.toString())/793100000000000))),
  price:price!==null&&Number.isFinite(price)?price:null,
  cap:price!==null&&Number.isFinite(price)?price*Number(curve.tokenTotalSupply.toString())/1e6:null};
}
