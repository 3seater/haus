import {Keypair,PublicKey,type TransactionInstruction} from '@solana/web3.js';
import {PUMP_SDK,type Global} from '@pump-fun/pump-sdk';
import {BN} from '@coral-xyz/anchor';
import {initializeVaultInstruction,vaultAddress} from './vault-addresses';

// Intersect two independent launches to remove mint-, vault- and user-specific
// addresses. This remains useful if Pump changes its shared account layout.
export async function launchLookupAddresses(program:PublicKey,global:Global){
 const sample=async()=>{
  const mint=Keypair.generate().publicKey,user=Keypair.generate().publicKey;
  const instructions=await PUMP_SDK.createV2AndBuyInstructions({global,mint,user,creator:vaultAddress(program,mint),name:'N'.repeat(32),symbol:'T'.repeat(10),uri:'https://example.com/'+'x'.repeat(181),mayhemMode:false,cashback:false,holderReward:false,amount:new BN(100000),solAmount:new BN(10000000)});
  instructions.splice(1,0,initializeVaultInstruction(program,mint,user));
  return instructions;
 };
 const [a,b]=await Promise.all([sample(),sample()]);
 const keys=(ixs:TransactionInstruction[])=>new Set(ixs.flatMap(ix=>ix.keys.filter(k=>!k.isSigner).map(k=>k.pubkey.toBase58())));
 const common=keys(b);
 return [...new Set([...keys(a)].filter(key=>common.has(key)).concat([global.feeRecipient,...global.feeRecipients].map(key=>key.toBase58())))].sort().map(key=>new PublicKey(key));
}
