import {randomUUID,randomBytes} from 'node:crypto';
import {redis,rateLimit} from './redis';
import {verifySignature} from './auth';
import {ownsTokens} from './holder-access';
import {rpc,cachedFeed} from './public-feed';
import {HttpError} from './config';
type Session={wallet:string;mint:string;expires:number};
export class CommunityAccess {
 constructor(private holds=async(wallet:string,mint:string)=>{
  const genesis=await cachedFeed('holder:network',300000,()=>rpc('getGenesisHash',[]));
  if(genesis!=='5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d')throw new HttpError(503,'Holdings verification requires Solana mainnet.');
  return ownsTokens(await rpc('getTokenAccountsByOwner',[wallet,{mint},{encoding:'jsonParsed',commitment:'confirmed'}]),wallet,mint);
 }){}
 async challenge(wallet:string,mint:string,origin:string){
  await rateLimit('holder-challenge:'+wallet,5,120);
  const id=randomUUID(),expires=Date.now()+120000;
  const message=`HAUS holder verification
Origin: ${origin}
Wallet: ${wallet}
Token: ${mint}
Network: Solana mainnet-beta
Nonce: ${id}
Expires: ${new Date(expires).toISOString()}

Verify membership to participate in this token's Haus. This does not authorize a transaction.`;
  await redis().set('holder:challenge:'+id,JSON.stringify({wallet,mint,message,expires}),'EX',120);
  return {id,message,expires};
 }
 async verify(id:string,wallet:string,mint:string,signature:string){
  const key='holder:challenge:'+id,raw=await redis().get(key);
  if(!raw)throw new HttpError(401,'Verification expired. Please verify again.');
  const c=JSON.parse(raw);
  if(c.wallet!==wallet||c.mint!==mint||c.expires<=Date.now())throw new HttpError(401,'Verification does not match this wallet and token.');
  verifySignature(wallet,c.message,signature);
  if(!await this.holds(wallet,mint))throw new HttpError(403,'No tokens found in this wallet on Solana mainnet.');
  const used=await redis().eval("if redis.call('GET',KEYS[1])==ARGV[1] then return redis.call('DEL',KEYS[1]) end return 0",1,key,raw);
  if(Number(used)!==1)throw new HttpError(401,'Verification was already used. Please verify again.');
  const token=randomBytes(32).toString('hex'),session={wallet,mint,expires:Date.now()+900000};
  await redis().set('holder:session:'+token,JSON.stringify(session),'EX',900);
  return {token,...session};
 }
 async authorize(token:string,mint:string){
  if(!/^[a-f0-9]{64}$/.test(token))throw new HttpError(401,'Please verify your holdings.');
  const key='holder:session:'+token,raw=await redis().get(key),s:Session|null=raw?JSON.parse(raw):null;
  if(!s||s.mint!==mint||s.expires<=Date.now())throw new HttpError(401,'Please verify your holdings again.');
  if(!await this.holds(s.wallet,mint)){await redis().del(key);throw new HttpError(403,'Holdings changed. Please verify again.');}
  return s;
 }
}
export const communityAccess=new CommunityAccess();
export const bearer=(request:Request)=>(request.headers.get('authorization')||'').replace(/^Bearer /,'');
