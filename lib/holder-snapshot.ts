import {AccountLayout,TOKEN_2022_PROGRAM_ID,unpackMint} from '@solana/spl-token';
import {PublicKey} from '@solana/web3.js';
import {rpc} from './solana';
import {buildRewardSnapshot} from './reward-snapshot';
/** All balances come from a single finalized getProgramAccounts response and slot. */
export async function captureHolderSnapshot(mint:PublicKey,round:PublicKey,excludedOwners:ReadonlySet<string>){
 const mintInfo=await rpc().getAccountInfo(mint,'finalized');
 if(!mintInfo?.owner.equals(TOKEN_2022_PROGRAM_ID))throw new Error('Only HAUS Token-2022 launches are supported');
 const result=await rpc().getProgramAccounts(TOKEN_2022_PROGRAM_ID,{commitment:'finalized',withContext:true,dataSlice:{offset:0,length:AccountLayout.span},filters:[{memcmp:{offset:0,bytes:mint.toBase58()}}]});
 let accountedSupply=0n;
 const balances=result.value.map(({account})=>{
  if(!account.owner.equals(TOKEN_2022_PROGRAM_ID)||account.data.length<AccountLayout.span)throw new Error('Invalid token account');
  const token=AccountLayout.decode(account.data);
  if(!token.mint.equals(mint))throw new Error('Wrong token in snapshot');
  accountedSupply+=token.amount;
  return {wallet:token.owner.toBase58(),amount:token.state===1?token.amount.toString():'0'};
 });
 const supplyAccount=await rpc().getAccountInfoAndContext(mint,{commitment:'finalized',minContextSlot:result.context.slot});
 if(!supplyAccount.value||unpackMint(mint,supplyAccount.value,TOKEN_2022_PROGRAM_ID).supply!==accountedSupply)throw new Error('Holder scan is incomplete or supply changed during capture; retry before publishing');
 return buildRewardSnapshot(round.toBase58(),result.context.slot,balances,excludedOwners);
}
