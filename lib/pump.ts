import { ComputeBudgetProgram, Keypair, PublicKey } from '@solana/web3.js';
import { PUMP_SDK, PUMP_PROGRAM_ID, bondingCurvePda,getPumpProgram,type CreateEventBc,OnlinePumpSdk,getBuyTokenAmountFromSolAmount } from '@pump-fun/pump-sdk';
import {EventParser,BN} from '@coral-xyz/anchor';
import {NATIVE_MINT} from '@solana/spl-token';
import { rpc } from './solana';
import { HttpError } from './config';
import {encrypt} from './crypto';

import {decodeVault,vaultAddress} from './vault-addresses';
import {buildVersionedLaunch} from './launch-versioned';
import {launchLookupTable} from './launch-lookup';
export async function createLaunch(user: string, name: string, symbol: string, uri: string,initialBuySol='0') {
  const creator=new PublicKey(user);
  if(Buffer.byteLength(uri,'utf8')>200)throw new HttpError(409,'Metadata provider returned an unsupported URI length. No transaction was created.');
  const lookup=process.env.HAUS_LAUNCH_LOOKUP_TABLE?await launchLookupTable():undefined;
  const mint = Keypair.generate();
  const [whole,fraction='']=initialBuySol.split('.');
  const solAmount=new BN((BigInt(whole)*1_000_000_000n+BigInt(fraction.padEnd(9,'0'))).toString());
  const args={mint:mint.publicKey,user:new PublicKey(user),creator,name,symbol,uri,mayhemMode:false,cashback:false,holderReward:false};
  let amount=new BN(0);
  let instructions;
  if(solAmount.isZero())instructions=[await PUMP_SDK.createV2Instruction(args)];
  else{
    const sdk=new OnlinePumpSdk(rpc());
    const [global,feeConfig]=await Promise.all([sdk.fetchGlobal(),sdk.fetchFeeConfig()]);
    amount=getBuyTokenAmountFromSolAmount({global,feeConfig,mintSupply:null,bondingCurve:null,amount:solAmount,quoteMint:NATIVE_MINT});
    instructions=await PUMP_SDK.createV2AndBuyInstructions({...args,global,amount,solAmount});
  }

  const block = await rpc().getLatestBlockhash('confirmed');
  const transaction = buildVersionedLaunch(args.user,block.blockhash,[ComputeBudgetProgram.setComputeUnitLimit({units:500000}),...instructions],lookup);
  // The mint signer stays encrypted server-side until the wallet approves the exact message.
  const mintSignerEncrypted=encrypt(Array.from(mint.secretKey));
  const simulation=await rpc().simulateTransaction(transaction,{sigVerify:false,commitment:'confirmed',accounts:{encoding:'base64',addresses:[user]}});
  if(simulation.value.err)throw new HttpError(409,'Launch simulation failed. Check that your wallet has enough SOL for creation, rent and your initial buy. No funds were spent.');
  const [balance,fee]=await Promise.all([rpc().getBalance(new PublicKey(user),'confirmed'),rpc().getFeeForMessage(transaction.message,'confirmed')]);
  const after=simulation.value.accounts?.[0]?.lamports;
  return {mint:mint.publicKey.toBase58(),mintSignerEncrypted,transaction:Buffer.from(transaction.serialize()).toString('base64'),initialBuyLamports:solAmount.toString(),maximumBuyLamports:solAmount.add(solAmount.divn(100)).toString(),tokenAmount:amount.toString(),estimatedDebitLamports:after===undefined||after===null?null:Math.max(0,balance-after).toString(),networkFeeLamports:fee.value?.toString()??null,creatorRecipient:args.creator.toBase58(),...block};
}
export async function verifyLaunch(mint: string, wallet: string, signature: string, expected:{name:string;symbol:string;metadataUri:string;creatorRecipient?:string;vaultProgram?:string}) {
  if(!expected.creatorRecipient)throw new HttpError(409,'Launch recipient evidence is missing.');
  const program=expected.vaultProgram?new PublicKey(expected.vaultProgram):null;
  const recipient=program?vaultAddress(program,new PublicKey(mint)):new PublicKey(wallet);
  if(recipient.toBase58()!==expected.creatorRecipient)throw new HttpError(403,'Unexpected creator-fee recipient.');
  const transaction = await rpc().getTransaction(signature,{commitment:'finalized',maxSupportedTransactionVersion:0});
  if (!transaction || transaction.meta?.err) throw new HttpError(409,'Launch is not finalized yet.');
  const [account, supply] = await Promise.all([
    rpc().getAccountInfo(bondingCurvePda(new PublicKey(mint)),'finalized'),
    rpc().getTokenSupply(new PublicKey(mint),'finalized')
  ]);
  if (!transaction || transaction.meta?.err || !account || !account.owner.equals(PUMP_PROGRAM_ID)) throw new HttpError(409,'Launch is not finalized yet.');
  const keys = transaction.transaction.message.getAccountKeys({accountKeysFromLookups:transaction.meta?.loadedAddresses});
  let signed = false, containsMint = false;
  for (let i=0;i<keys.length;i++) {
    if (keys.get(i)?.toBase58() === wallet && transaction.transaction.message.isAccountSigner(i)) signed = true;
    if (keys.get(i)?.toBase58() === mint) containsMint = true;
  }
  const curve=PUMP_SDK.decodeBondingCurve(account);
  if (!signed || !containsMint || !curve.creator.equals(recipient) || curve.isMayhemMode || curve.isCashbackCoin || curve.isHolderReward) throw new HttpError(403,'Launch does not match the configured HAUS creator-fee recipient and modes.');
  if(program){
  const vaultAccount=await rpc().getAccountInfo(recipient,'finalized');
  if(!vaultAccount||!vaultAccount.owner.equals(program))throw new HttpError(403,'Community vault is missing.');
  const vault=decodeVault(vaultAccount.data);
  if(vault.mint.toBase58()!==mint||vault.developer.toBase58()!==wallet)throw new HttpError(403,'Community vault identity does not match this launch.');
  }
  const logs=transaction.meta?.logMessages;
  if(!logs||logs.some(log=>log.includes('Log truncated')))throw new HttpError(409,'Complete launch evidence is unavailable.');
  const events=[...new EventParser(PUMP_PROGRAM_ID,getPumpProgram(rpc()).coder).parseLogs(logs)]
    .filter(event=>event.name.replaceAll('_','').toLowerCase()==='createevent')
    .map(event=>event.data as unknown as CreateEventBc).filter(event=>event.mint.toBase58()===mint);
  if(events.length!==1)throw new HttpError(403,'Transaction does not contain the expected token creation.');
  const event=events[0];
  if(event.user.toBase58()!==wallet||!event.creator.equals(recipient)||event.name!==expected.name||event.symbol!==expected.symbol||event.uri!==expected.metadataUri||event.isMayhemMode||event.isCashbackEnabled||event.isHolderReward||![PublicKey.default.toBase58(),NATIVE_MINT.toBase58()].includes(event.quoteMint.toBase58()))throw new HttpError(403,'Token creation evidence does not match this launch.');
  return {slot:transaction.slot,supply:supply.value.amount,createdAt:new Date((transaction.blockTime??Number(event.timestamp))*1000).toISOString()};
}


