import {randomUUID,randomBytes} from 'node:crypto';
import {verifySignature} from './auth';
import {HttpError} from './config';

type Challenge={wallet:string;mint:string;message:string;expires:number};
type Session={wallet:string;mint:string;expires:number};
/** Single-server pilot. Proofs are short-lived and never persisted. */
export class HolderAccess {
 private challenges=new Map<string,Challenge>();
 private sessions=new Map<string,Session>();
 constructor(private holds:(wallet:string,mint:string)=>Promise<boolean>,private now=()=>Date.now()){}
 challenge(wallet:string,mint:string,origin:string){
  this.prune();
  if(this.challenges.size>=2000)throw new HttpError(429,'Please try again shortly.');
  const recent=[...this.challenges.values()].filter(c=>c.wallet===wallet);
  if(recent.length>=5)throw new HttpError(429,'Finish an existing verification or try again in two minutes.');
  const id=randomUUID(),expires=this.now()+120000;
  const message=`HAUS holder verification\nOrigin: ${origin}\nWallet: ${wallet}\nToken: ${mint}\nNetwork: Solana mainnet-beta\nNonce: ${id}\nExpires: ${new Date(expires).toISOString()}\n\nVerify membership to participate in this token's Haus. This does not authorize a transaction.`;
  this.challenges.set(id,{wallet,mint,message,expires});return {id,message,expires};
 }
 async verify(id:string,wallet:string,mint:string,signature:string){
  const c=this.challenges.get(id);this.challenges.delete(id);
  if(!c||c.expires<=this.now()||c.wallet!==wallet||c.mint!==mint)throw new HttpError(401,'Verification expired. Please verify again.');
  verifySignature(wallet,c.message,signature);
  if(!await this.holds(wallet,mint))throw new HttpError(403,'No tokens found in this wallet on Solana mainnet.');
  this.prune();if(this.sessions.size>=2000)throw new HttpError(429,'Please try again shortly.');
  const token=randomBytes(32).toString('hex'),session={wallet,mint,expires:this.now()+15*60000};
  this.sessions.set(token,session);return {token,...session};
 }
 async authorize(token:string,mint:string){
  const s=this.sessions.get(token);
  if(!s||s.mint!==mint||s.expires<=this.now())throw new HttpError(401,'Please verify your holdings again.');
  // A session proves the signer; every write independently proves current holdings.
  if(!await this.holds(s.wallet,mint)){this.sessions.delete(token);throw new HttpError(403,'Holdings changed. Please verify again.');}
  return s;
 }
 private prune(){for(const [k,v] of this.challenges)if(v.expires<=this.now())this.challenges.delete(k);for(const [k,v] of this.sessions)if(v.expires<=this.now())this.sessions.delete(k);}
}

export function ownsTokens(result:unknown,wallet:string,mint:string){
 const accounts=(result as {value?:unknown[]})?.value;
 if(!Array.isArray(accounts))throw new Error('Invalid holdings response');
 return accounts.some((entry:any)=>{
  const a=entry?.account,info=a?.data?.parsed?.info;
  return ['TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA','TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'].includes(a?.owner)
   &&info?.owner===wallet&&info?.mint===mint&&info?.state==='initialized'
   &&typeof info?.tokenAmount?.amount==='string'&&/^\d+$/.test(info.tokenAmount.amount)&&BigInt(info.tokenAmount.amount)>0n;
 });
}
