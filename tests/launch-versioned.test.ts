import {test} from 'node:test';
import assert from 'node:assert/strict';
import {AddressLookupTableAccount,ComputeBudgetProgram,Keypair,PublicKey,SystemProgram,TransactionInstruction,VersionedTransaction} from '@solana/web3.js';
import {PUMP_SDK,type Global} from '@pump-fun/pump-sdk';
import {BN} from '@coral-xyz/anchor';
import {buildVersionedLaunch,verifyVersionedLaunch} from '../lib/launch-versioned';
import {launchLookupAddresses} from '../lib/launch-lookup-plan';
import {initializeVaultInstruction,vaultAddress} from '../lib/vault-addresses';
import {launchIntent} from '../lib/launch-access';
const pub=()=>Keypair.generate().publicKey;
test('Versioned launches allow bounded wallet additions but reject altered launch contents',()=>{
 const payer=Keypair.generate(),mint=Keypair.generate(),blockhash=pub().toBase58();
 const create=(lamports=1)=>SystemProgram.createAccount({fromPubkey:payer.publicKey,newAccountPubkey:mint.publicKey,lamports,space:0,programId:SystemProgram.programId});
 const limit=ComputeBudgetProgram.setComputeUnitLimit({units:500000});
 const original=buildVersionedLaunch(payer.publicKey,blockhash,[limit,create()]);
 const prepared=Buffer.from(original.message.serialize()).toString('base64');
 const assertion=()=>new TransactionInstruction({programId:new PublicKey('L2TExMFKdjpN9kozasaurPirfHy9P8sbXoAN1qA3S95'),keys:[{pubkey:payer.publicKey,isSigner:true,isWritable:true}],data:Buffer.from([6,0,0])});
 const additions=()=>[limit,ComputeBudgetProgram.setComputeUnitPrice({microLamports:1000}),create(),assertion()];
 const encode=(instructions:TransactionInstruction[],hash=blockhash,sign=true)=>{
  const tx=buildVersionedLaunch(payer.publicKey,hash,instructions);
  if(sign)tx.sign([payer]);
  return Buffer.from(tx.serialize()).toString('base64');
 };
 const approved=encode(additions());
 const signed=verifyVersionedLaunch(approved,prepared,mint);
 assert.deepEqual(signed.message.serialize(),VersionedTransaction.deserialize(Buffer.from(approved,'base64')).message.serialize());
 assert.ok(signed.signatures[1].some(byte=>byte!==0));
 const changed=additions();changed[2]=create(2);
 assert.throws(()=>verifyVersionedLaunch(encode(changed),prepared,mint));
 assert.throws(()=>verifyVersionedLaunch(encode([...additions(),SystemProgram.transfer({fromPubkey:payer.publicKey,toPubkey:pub(),lamports:1})]),prepared,mint));
 const highFee=additions();highFee[1]=ComputeBudgetProgram.setComputeUnitPrice({microLamports:1_000_000_000});
 assert.throws(()=>verifyVersionedLaunch(encode(highFee),prepared,mint));
 const write=additions();write[3].data=Buffer.from([0,0,0]);
 assert.throws(()=>verifyVersionedLaunch(encode(write),prepared,mint));
 const privilege=additions();privilege[3].keys.push({pubkey:pub(),isSigner:false,isWritable:true});
 assert.throws(()=>verifyVersionedLaunch(encode(privilege),prepared,mint));
 assert.throws(()=>verifyVersionedLaunch(encode(additions(),pub().toBase58()),prepared,mint));
 assert.throws(()=>verifyVersionedLaunch(encode(additions(),blockhash,false),prepared,mint));
 assert.throws(()=>verifyVersionedLaunch(approved,prepared,Keypair.generate()));
 const lookupAddress=pub();
 const lookup=new AddressLookupTableAccount({key:pub(),state:{deactivationSlot:18446744073709551615n,lastExtendedSlot:1,lastExtendedSlotStartIndex:0,addresses:[lookupAddress]}});
 // A lookup-bearing message must never enter the no-lookup compatibility path.
 const withLookup=buildVersionedLaunch(payer.publicKey,blockhash,[limit,create(),new TransactionInstruction({programId:pub(),keys:[{pubkey:lookupAddress,isSigner:false,isWritable:false}],data:Buffer.alloc(0)})],lookup);
 assert.ok(withLookup.message.addressTableLookups.length);
 withLookup.sign([payer]);
 assert.throws(()=>verifyVersionedLaunch(Buffer.from(withLookup.serialize()).toString('base64'),prepared,mint));
});
test('Maximum metadata and initial buy fit an atomic launch using shared lookup addresses',async()=>{
 const program=pub(),global={feeRecipient:pub(),feeRecipients:[pub(),pub()]} as Global;
 const lookup=new AddressLookupTableAccount({key:pub(),state:{deactivationSlot:18446744073709551615n,lastExtendedSlot:1,lastExtendedSlotStartIndex:0,addresses:await launchLookupAddresses(program,global)}});
 for(let attempt=0;attempt<16;attempt++){
  const mint=Keypair.generate(),user=Keypair.generate();
  const instructions=await PUMP_SDK.createV2AndBuyInstructions({global,mint:mint.publicKey,user:user.publicKey,creator:vaultAddress(program,mint.publicKey),name:'N'.repeat(32),symbol:'T'.repeat(10),uri:'https://example.com/'+'x'.repeat(181),mayhemMode:false,cashback:false,holderReward:false,amount:new BN(100000),solAmount:new BN(10000000)});
  instructions.splice(1,0,initializeVaultInstruction(program,mint.publicKey,user.publicKey));
  const tx=buildVersionedLaunch(user.publicKey,pub().toBase58(),[ComputeBudgetProgram.setComputeUnitLimit({units:500000}),...instructions],lookup);
  assert.ok(tx.serialize().length<=1232);assert.ok(tx.signatures.every(s=>s.every(byte=>byte===0)));
  const prepared=Buffer.from(tx.message.serialize()).toString('base64');
  const encode=(value:VersionedTransaction)=>Buffer.from(value.serialize()).toString('base64');
  assert.throws(()=>verifyVersionedLaunch(encode(tx),prepared,mint));
  tx.sign([user]);const signed=verifyVersionedLaunch(encode(tx),prepared,mint);
  assert.ok(signed.signatures[1].some(byte=>byte!==0));
  assert.throws(()=>verifyVersionedLaunch(encode(tx),prepared,Keypair.generate()));
  tx.message.recentBlockhash=pub().toBase58();tx.sign([user]);
  assert.throws(()=>verifyVersionedLaunch(encode(tx),prepared,mint));
 }
});
test('Launch metadata limits use bytes rather than JavaScript string length',()=>{
 const intent={wallet:pub().toBase58(),name:'😀'.repeat(9),symbol:'EX',description:'Test',imageHash:'a'.repeat(64),initialBuySol:'0'};
 assert.equal(launchIntent.safeParse(intent).success,false);
 assert.equal(launchIntent.safeParse({...intent,name:'😀'.repeat(8)}).success,true);
});

test('Maximum-size basic launch fits without a lookup table and requires exact wallet approval',async()=>{
 const payer=Keypair.generate(),mint=Keypair.generate(),creator=pub();
 const ix=await PUMP_SDK.createV2Instruction({mint:mint.publicKey,user:payer.publicKey,creator,name:'N'.repeat(32),symbol:'T'.repeat(10),uri:'https://example.com/'+'x'.repeat(181),mayhemMode:false,cashback:false,holderReward:false});
 const tx=buildVersionedLaunch(payer.publicKey,pub().toBase58(),[ComputeBudgetProgram.setComputeUnitLimit({units:500000}),ix]);assert.ok(tx.serialize().length<=1232);assert.equal(tx.message.addressTableLookups.length,0);
 const message=Buffer.from(tx.message.serialize()).toString('base64');tx.sign([payer]);assert.ok(verifyVersionedLaunch(Buffer.from(tx.serialize()).toString('base64'),message,mint));
});
