import {PublicKey,SystemProgram,TransactionInstruction} from '@solana/web3.js';
import {ASSOCIATED_TOKEN_PROGRAM_ID,NATIVE_MINT,TOKEN_PROGRAM_ID,createAssociatedTokenAccountIdempotentInstruction,getAssociatedTokenAddressSync} from '@solana/spl-token';
import {PUMP_PROGRAM_ID,PUMP_AMM_PROGRAM_ID} from '@pump-fun/pump-sdk';
import {discriminator,vaultAddress} from './vault-addresses';
const pda=(program:PublicKey,seed:string,owner?:PublicKey)=>PublicKey.findProgramAddressSync([Buffer.from(seed),...(owner?[owner.toBuffer()]:[])],program)[0];
const key=(pubkey:PublicKey,isWritable=false)=>({pubkey,isWritable,isSigner:false});
/** No creator signature and no arbitrary recipient: both sources pay the mint-specific vault. */
export function feeCollectionInstructions(program:PublicKey,mint:PublicKey,payer:PublicKey,includeCurve:boolean,includeAmm:boolean){
 const vault=vaultAddress(program,mint),creatorVault=pda(PUMP_PROGRAM_ID,'creator-vault',vault);
 const destination=getAssociatedTokenAddressSync(NATIVE_MINT,vault,true);
 const instructions:TransactionInstruction[]=[];
 if(includeCurve)instructions.push(new TransactionInstruction({programId:PUMP_PROGRAM_ID,data:discriminator('global','collect_creator_fee_v2'),keys:[
  key(vault,true),key(destination,true),key(creatorVault,true),key(getAssociatedTokenAddressSync(NATIVE_MINT,creatorVault,true),true),
  key(NATIVE_MINT),key(TOKEN_PROGRAM_ID),key(ASSOCIATED_TOKEN_PROGRAM_ID),key(SystemProgram.programId),key(pda(PUMP_PROGRAM_ID,'__event_authority')),key(PUMP_PROGRAM_ID),
 ]}));
 if(includeAmm){
  const authority=pda(PUMP_AMM_PROGRAM_ID,'creator_vault',vault);
  instructions.push(createAssociatedTokenAccountIdempotentInstruction(payer,destination,vault,NATIVE_MINT));
  instructions.push(new TransactionInstruction({programId:PUMP_AMM_PROGRAM_ID,data:discriminator('global','collect_coin_creator_fee'),keys:[
   key(NATIVE_MINT),key(TOKEN_PROGRAM_ID),key(vault),key(authority),key(getAssociatedTokenAddressSync(NATIVE_MINT,authority,true),true),key(destination,true),key(pda(PUMP_AMM_PROGRAM_ID,'__event_authority')),key(PUMP_AMM_PROGRAM_ID),
  ]}));
  instructions.push(new TransactionInstruction({programId:program,data:discriminator('global','unwrap_fees'),keys:[key(vault,true),key(destination,true),key(TOKEN_PROGRAM_ID)]}));
 }
 return instructions;
}
