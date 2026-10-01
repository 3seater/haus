import {randomUUID} from 'node:crypto';
import {redis} from './redis';
/** Prevent overlapping schedulers; on-chain round/claim accounts remain the final duplicate guard. */
export async function withWorkerLease<T>(run:(assertLease:()=>Promise<void>)=>Promise<T>){
 const key='worker:fee-lease',token=randomUUID();
 if(!await redis().set(key,token,'PX',120000,'NX'))throw new Error('Another fee worker holds the lease');
 let lost=false;
 const renew=async()=>{
  try{if(Number(await redis().eval("if redis.call('GET',KEYS[1])==ARGV[1] then return redis.call('PEXPIRE',KEYS[1],ARGV[2]) end return 0",1,key,token,120000))!==1)lost=true;}catch{lost=true;}
 };
 const timer=setInterval(()=>void renew(),20000);timer.unref();
 try{return await run(async()=>{if(lost||await redis().get(key)!==token)throw new Error('Fee worker lease was lost; submission stopped');});}
 finally{clearInterval(timer);await redis().eval("if redis.call('GET',KEYS[1])==ARGV[1] then return redis.call('DEL',KEYS[1]) end return 0",1,key,token).catch(()=>{});}
}
