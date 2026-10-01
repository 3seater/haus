import {PublicKey,SystemProgram,TransactionInstruction} from '@solana/web3.js';
import {createHash} from 'node:crypto';
export const OWNER_AUTHORITY='8nUax7zWTDE3yRuEcm4GevhmVP2u1NavKwvKSByZT92S';
export const discriminator=(kind:'global'|'account',name:string)=>createHash('sha256').update(`${kind}:${name}`).digest().subarray(0,8);
export function u64(value:bigint){if(value<0n||value>0xffffffffffffffffn)throw new Error('Invalid u64');const data=Buffer.alloc(8);data.writeBigUInt64LE(value);return data;}
export const configAddress=(program:PublicKey)=>PublicKey.findProgramAddressSync([Buffer.from('config')],program)[0];
export const vaultAddress=(program:PublicKey,mint:PublicKey)=>PublicKey.findProgramAddressSync([Buffer.from('vault'),mint.toBuffer()],program)[0];
export const roundAddress=(program:PublicKey,vault:PublicKey,id:bigint)=>PublicKey.findProgramAddressSync([Buffer.from('round'),vault.toBuffer(),u64(id)],program)[0];
export function initializeVaultInstruction(program:PublicKey,mint:PublicKey,developer:PublicKey){
 return new TransactionInstruction({programId:program,data:discriminator('global','initialize_vault'),keys:[
  {pubkey:developer,isSigner:true,isWritable:true},{pubkey:mint,isSigner:true,isWritable:false},
  {pubkey:configAddress(program),isSigner:false,isWritable:false},{pubkey:vaultAddress(program,mint),isSigner:false,isWritable:true},
  {pubkey:SystemProgram.programId,isSigner:false,isWritable:false},
 ]});
}
export type VaultState={mint:PublicKey;developer:PublicKey;createdAt:bigint;lastOpenedAt:bigint;nextRound:bigint};
export function decodeVault(data:Buffer):VaultState {
 if(data.length!==97||!data.subarray(0,8).equals(discriminator('account','Vault')))throw new Error('Invalid vault account');
 return {mint:new PublicKey(data.subarray(8,40)),developer:new PublicKey(data.subarray(40,72)),createdAt:data.readBigInt64LE(72),lastOpenedAt:data.readBigInt64LE(80),nextRound:data.readBigUInt64LE(88)};
}
export type VaultConfig={authority:PublicKey;snapshotAuthority:PublicKey;paused:boolean;firstDelay:bigint;votingWindow:bigint;period:bigint;executionDelay:bigint;quorumBps:number;minimumBudget:bigint};
export function decodeVaultConfig(data:Buffer):VaultConfig {
 if(data.length!==148||!data.subarray(0,8).equals(discriminator('account','Config'))||data[104]>1)throw new Error('Invalid vault configuration');
 return {authority:new PublicKey(data.subarray(8,40)),snapshotAuthority:new PublicKey(data.subarray(72,104)),paused:data[104]===1,
  firstDelay:data.readBigInt64LE(105),votingWindow:data.readBigInt64LE(113),period:data.readBigInt64LE(121),executionDelay:data.readBigInt64LE(129),quorumBps:data.readUInt16LE(137),minimumBudget:data.readBigUInt64LE(139)};
}
export type RoundState={vault:PublicKey;id:bigint;root:string;manifestHash:string;eligibleSupply:bigint;snapshotSlot:bigint;openedAt:bigint;closesAt:bigint;executeAfter:bigint;quorumBps:number;budget:bigint;remaining:bigint;votes:[bigint,bigint,bigint];finalized:boolean;outcome:number};
export function decodeRound(data:Buffer):RoundState {
 if(data.length!==237||!data.subarray(0,8).equals(discriminator('account','Round'))||data[234]>1||data[235]>2)throw new Error('Invalid round account');
 return {vault:new PublicKey(data.subarray(8,40)),id:data.readBigUInt64LE(40),root:data.subarray(48,80).toString('hex'),manifestHash:data.subarray(80,112).toString('hex'),eligibleSupply:data.readBigUInt64LE(112),snapshotSlot:data.readBigUInt64LE(120),openedAt:data.readBigInt64LE(128),closesAt:data.readBigInt64LE(136),executeAfter:data.readBigInt64LE(144),quorumBps:data.readUInt16LE(184),budget:data.readBigUInt64LE(194),remaining:data.readBigUInt64LE(202),votes:[data.readBigUInt64LE(210),data.readBigUInt64LE(218),data.readBigUInt64LE(226)],finalized:data[234]===1,outcome:data[235]};
}
const account=(pubkey:PublicKey,isWritable=false,isSigner=false)=>({pubkey,isWritable,isSigner});
export function openRoundInstruction(program:PublicKey,vault:PublicKey,id:bigint,authority:PublicKey,root:string,eligibleSupply:bigint,slot:bigint,manifestHash:string){
 if(!/^[a-f0-9]{64}$/.test(root)||!/^[a-f0-9]{64}$/.test(manifestHash))throw new Error('Invalid snapshot hash');
 return new TransactionInstruction({programId:program,keys:[account(authority,true,true),account(configAddress(program)),account(vault,true),account(roundAddress(program,vault,id),true),account(SystemProgram.programId)],data:Buffer.concat([discriminator('global','open_round'),u64(id),Buffer.from(root,'hex'),u64(eligibleSupply),u64(slot),Buffer.from(manifestHash,'hex')])});
}
export function finalizeRoundInstruction(program:PublicKey,vault:PublicKey,round:PublicKey){return new TransactionInstruction({programId:program,keys:[account(vault,true),account(round,true)],data:discriminator('global','finalize_round')});}
export function governanceInstruction(program:PublicKey,vault:PublicKey,round:PublicKey,wallet:PublicKey,action:'vote'|'claim_holder'|'claim_developer',weight=0n,proof:string[]=[],choice=0){
 if(!['vote','claim_holder','claim_developer'].includes(action)||proof.length>32||proof.some(p=>!/^[a-f0-9]{64}$/.test(p))||!Number.isInteger(choice)||choice<0||choice>2)throw new Error('Invalid governance instruction');
 if(action==='claim_developer')return new TransactionInstruction({programId:program,keys:[account(wallet,true,true),account(configAddress(program)),account(vault),account(round,true)],data:discriminator('global',action)});
 const length=Buffer.alloc(4);length.writeUInt32LE(proof.length);
 const receipt=PublicKey.findProgramAddressSync([Buffer.from(action==='vote'?'ballot':'claim'),round.toBuffer(),wallet.toBuffer()],program)[0];
 return new TransactionInstruction({programId:program,keys:[account(wallet,true,true),account(configAddress(program)),account(round,true),account(receipt,true),account(SystemProgram.programId)],data:Buffer.concat([discriminator('global',action),...(action==='vote'?[Buffer.from([choice])]:[]),u64(weight),length,...proof.map(p=>Buffer.from(p,'hex'))])});
}
