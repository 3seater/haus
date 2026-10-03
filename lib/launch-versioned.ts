import {AddressLookupTableAccount,Keypair,MessageV0,Transaction,TransactionMessage,VersionedTransaction,type PublicKey,type TransactionInstruction} from '@solana/web3.js';
import nacl from 'tweetnacl';
import {verifyWalletAdditions} from './launch-transaction';

export function buildVersionedLaunch(payer:PublicKey,blockhash:string,instructions:TransactionInstruction[],lookup?:AddressLookupTableAccount){
 const tx=new VersionedTransaction(new TransactionMessage({payerKey:payer,recentBlockhash:blockhash,instructions}).compileToV0Message(lookup?[lookup]:[]));
 if(tx.serialize().length>1232)throw new Error('This launch is too large. Try without an initial buy; an address lookup table is needed for larger launches.');
 return tx;
}

// Preserve exact matching for lookup-table launches. Basic launches can include
// the same bounded wallet additions accepted by the legacy launch verifier.
export function verifyVersionedLaunch(encoded:string,preparedMessage:string,mint:Keypair){
 const bytes=Buffer.from(encoded,'base64');
 if(bytes.length>1232)throw new Error('Oversized launch');
 const tx=VersionedTransaction.deserialize(bytes),message=tx.message.serialize();
 if(tx.version!==0)throw new Error('Unexpected launch transaction format');
 if(Buffer.from(message).toString('base64')!==preparedMessage){
  const original=MessageV0.deserialize(Buffer.from(preparedMessage,'base64'));
  if(original.addressTableLookups.length||tx.message.addressTableLookups.length)throw new Error('Launch lookup message changed');
  const asLegacy=(value:MessageV0)=>{
   const decoded=TransactionMessage.decompile(value);
   return new Transaction({feePayer:decoded.payerKey,recentBlockhash:decoded.recentBlockhash}).add(...decoded.instructions);
  };
  verifyWalletAdditions(asLegacy(tx.message as MessageV0),asLegacy(original).serializeMessage().toString('base64'));
 }
 const signers=tx.message.staticAccountKeys.slice(0,tx.message.header.numRequiredSignatures);
 if(signers.length!==2||signers[0].equals(mint.publicKey)||!signers[1].equals(mint.publicKey))throw new Error('Unexpected launch signers');
 if(!nacl.sign.detached.verify(message,tx.signatures[0],signers[0].toBytes()))throw new Error('Missing or invalid wallet approval');
 tx.sign([mint]);
 if(!signers.every((key,i)=>nacl.sign.detached.verify(message,tx.signatures[i],key.toBytes())))throw new Error('Invalid final launch signatures');
 return tx;
}
