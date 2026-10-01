import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Keypair,PublicKey,Transaction,ComputeBudgetProgram} from '@solana/web3.js';
import {buildRewardSnapshot,verifyRewardProof,holderEntitlement} from '../lib/reward-snapshot';
import {feeVoteOutcome,validateFeePolicy} from '../lib/fee-policy';
import {vaultAddress,roundAddress,initializeVaultInstruction,u64} from '../lib/vault-addresses';
import {launchConfigurationChecks} from '../lib/launch-readiness';
import {feeCollectionInstructions} from '../lib/fee-collection';
import {PUMP_PROGRAM_ID,PUMP_AMM_PROGRAM_ID,PUMP_SDK} from '@pump-fun/pump-sdk';
const pub=()=>Keypair.generate().publicKey;
test('Actual Pump SDK creation plus vault initialization fits one unsigned wallet transaction',async()=>{
 const program=pub(),mint=pub(),developer=pub(),recipient=vaultAddress(program,mint);
 const create=await PUMP_SDK.createV2Instruction({mint,user:developer,creator:recipient,name:'Example',symbol:'EX',uri:'https://example.com/token.json',mayhemMode:false,cashback:false,holderReward:false});
 const tx=new Transaction({feePayer:developer,recentBlockhash:pub().toBase58()}).add(ComputeBudgetProgram.setComputeUnitLimit({units:500000}),create,initializeVaultInstruction(program,mint,developer));
 assert.ok(tx.serialize({requireAllSignatures:false}).length<=1232);
 assert.ok(tx.signatures.every(signature=>signature.signature===null));
 assert.deepEqual(new Set(tx.signatures.map(s=>s.publicKey.toBase58())),new Set([mint.toBase58(),developer.toBase58()]));
 // The off-curve recipient is serialized into Pump's instruction, not the developer address.
 assert.ok(create.data.includes(recipient.toBuffer()));
});
test('Both fee sources target the vault; the worker only pays transaction costs',()=>{
 const program=pub(),mint=pub(),payer=pub(),vault=vaultAddress(program,mint);
 const instructions=feeCollectionInstructions(program,mint,payer,true,true);
 assert.equal(instructions.length,4);
 assert.ok(instructions[0].programId.equals(PUMP_PROGRAM_ID));assert.ok(instructions[0].keys[0].pubkey.equals(vault));
 assert.ok(instructions[2].programId.equals(PUMP_AMM_PROGRAM_ID));assert.ok(instructions[2].keys[2].pubkey.equals(vault));
 assert.ok(instructions[3].programId.equals(program));assert.ok(instructions[3].keys[0].pubkey.equals(vault));
 assert.equal(instructions.flatMap(ix=>ix.keys).some(k=>k.isSigner&&!k.pubkey.equals(payer)),false);
 assert.deepEqual(feeCollectionInstructions(program,mint,payer,false,false),[]);
});
test('Vaults and rounds are isolated; initialization requires both developer and new mint signatures',()=>{
 const program=pub(),mint=pub(),developer=pub(),vault=vaultAddress(program,mint);
 assert.equal(PublicKey.isOnCurve(vault.toBytes()),false);assert.notEqual(vault.toBase58(),vaultAddress(program,pub()).toBase58());
 assert.notEqual(roundAddress(program,vault,0n).toBase58(),roundAddress(program,vault,1n).toBase58());
 const ix=initializeVaultInstruction(program,mint,developer);assert.deepEqual(ix.keys.filter(k=>k.isSigner).map(k=>k.pubkey.toBase58()),[developer.toBase58(),mint.toBase58()]);
 assert.throws(()=>u64(-1n));assert.throws(()=>u64(1n<<64n));
});
test('Snapshot aggregates token accounts, excludes pools, and binds proof to wallet and round',()=>{
 const round=pub().toBase58(),a=pub().toBase58(),b=pub().toBase58(),c=pub().toBase58(),pool=pub().toBase58();
 const snapshot=buildRewardSnapshot(round,123,[{wallet:a,amount:'3'},{wallet:a,amount:'7'},{wallet:b,amount:'20'},{wallet:c,amount:'30'},{wallet:pool,amount:'900'}],new Set([pool]));
 assert.equal(snapshot.eligibleSupply,'60');assert.equal(snapshot.members.length,3);
 for(const member of snapshot.members){
  assert.ok(verifyRewardProof(round,member.wallet,member.amount,member.proof,snapshot.root));
  assert.equal(verifyRewardProof(pub().toBase58(),member.wallet,member.amount,member.proof,snapshot.root),false);
  assert.equal(verifyRewardProof(round,pub().toBase58(),member.amount,member.proof,snapshot.root),false);
  assert.equal(verifyRewardProof(round,member.wallet,(BigInt(member.amount)+1n).toString(),member.proof,snapshot.root),false);
 }
 assert.equal(snapshot.members.find(m=>m.wallet===a)!.amount,'10');
 const reordered=buildRewardSnapshot(round,123,[{wallet:c,amount:'30'},{wallet:b,amount:'20'},{wallet:a,amount:'10'}],new Set());assert.equal(reordered.root,snapshot.root);
});
test('Rewards conserve funds with exact integers and deterministic dust',()=>{
 const budget=9007199254740999n,weights=[1n,2n,3n],supply=6n;
 const allocated=weights.reduce((sum,w)=>sum+holderEntitlement(budget,w,supply),0n);
 assert.ok(allocated<=budget);assert.ok(budget-allocated<3n);assert.throws(()=>holderEntitlement(1n,2n,1n));
});
test('Quorum and strict majority fail closed, including split votes and fabricated weight',()=>{
 assert.equal(feeVoteOutcome([0n,9n,0n],100n,1000),'hold');
 assert.equal(feeVoteOutcome([0n,10n,0n],100n,1000),'holders');
 assert.equal(feeVoteOutcome([0n,5n,5n],100n,1000),'hold');
 assert.equal(feeVoteOutcome([4n,3n,3n],100n,1000),'hold');
 assert.equal(feeVoteOutcome([0n,4n,6n],100n,1000),'developer');
 assert.throws(()=>feeVoteOutcome([0n,101n,0n],100n,1000));
});
test('Policy cannot silently overlap rounds or accept zero quorum',()=>{
 const policy={firstDelay:3600,votingWindow:3600,period:21600,executionDelay:0,quorumBps:1000,minimumBudget:10000000n};
 assert.equal(validateFeePolicy(policy),policy);assert.throws(()=>validateFeePolicy({...policy,period:3599}));assert.throws(()=>validateFeePolicy({...policy,quorumBps:0}));
});
test('Operator-recipient launches do not depend on the deferred vault; encryption still fails closed',()=>{
 const checks=launchConfigurationChecks({NEXT_PUBLIC_DEMO_MODE:'false',LAUNCHES_ENABLED:'true',NEXT_PUBLIC_SOLANA_NETWORK:'mainnet-beta',SOLANA_RPC_URL:'https://example.com',REDIS_URL:'redis://localhost:6379',APP_ORIGIN:'https://example.com',LAUNCH_ENCRYPTION_KEY:Buffer.alloc(32).toString('base64'),METADATA_PROVIDER:'pump'});
 assert.deepEqual(checks.filter(c=>!c.ready).map(c=>c.id),[]);
 assert.equal(launchConfigurationChecks({LAUNCH_ENCRYPTION_KEY:'invalid'}).find(c=>c.id==='encryption')!.ready,false);
});
