import {AddressLookupTableAccount,Keypair,TransactionMessage,VersionedTransaction,type PublicKey,type TransactionInstruction} from '@solana/web3.js';
import nacl from 'tweetnacl';

export function buildVersionedLaunch(payer:PublicKey,blockhash:string,instructions:TransactionInstruction[],lookup?:AddressLookupTableAccount){
 const tx=new VersionedTransaction(new TransactionMessage({payerKey:payer,recentBlockhash:blockhash,instructions}).compileToV0Message(lookup?[lookup]:[]));
 if(tx.serialize().length>1232)throw new Error('This launch is too large. Try without an initial buy; an address lookup table is needed for larger launches.');
 return tx;
}

// Versioned launches require the exact prepared message. Lookup indices, payer,
// recipient, budget and blockhash are all covered by the wallet signature.
export function verifyVersionedLaunch(encoded:string,preparedMessage:string,mint:Keypair){
 const bytes=Buffer.from(encoded,'base64');
 if(bytes.length>1232)throw new Error('Oversized launch');
 const tx=VersionedTransaction.deserialize(bytes),message=tx.message.serialize();
 if(tx.version!==0||Buffer.from(message).toString('base64')!==preparedMessage)throw new Error('Launch message changed');
 const signers=tx.message.staticAccountKeys.slice(0,tx.message.header.numRequiredSignatures);
 if(signers.length!==2||signers[0].equals(mint.publicKey)||!signers[1].equals(mint.publicKey))throw new Error('Unexpected launch signers');
 if(!nacl.sign.detached.verify(message,tx.signatures[0],signers[0].toBytes()))throw new Error('Missing or invalid wallet approval');
 tx.sign([mint]);
 if(!signers.every((key,i)=>nacl.sign.detached.verify(message,tx.signatures[i],key.toBytes())))throw new Error('Invalid final launch signatures');
 return tx;
}
