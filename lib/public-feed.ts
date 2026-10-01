// Per-process cache and request deduplication keep public-provider usage bounded.
const cache=new Map<string,{expires:number;value:unknown}>();
const pending=new Map<string,Promise<unknown>>();
let geckoCooldown=0;
export async function cachedFeed<T>(key:string,ttl:number,read:()=>Promise<T>,staleOnError=false):Promise<T>{
 const existing=cache.get(key);if(existing&&existing.expires>Date.now())return existing.value as T;
 if(pending.has(key))return pending.get(key) as Promise<T>;
 const request=read().then(value=>{if(cache.size>100)cache.delete(cache.keys().next().value!);cache.set(key,{expires:Date.now()+ttl,value});return value;}).catch(error=>{if(staleOnError&&existing&&Date.now()-existing.expires<15*60000)return {...existing.value as object,stale:true} as T;throw error;}).finally(()=>pending.delete(key));pending.set(key,request);return request;
}
export async function gecko(path:string){
 if(Date.now()<geckoCooldown)throw new Error('Chart provider rate limited. Retrying shortly.');
 const r=await fetch(`https://api.geckoterminal.com/api/v2${path}`,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(10000),cache:'no-store'});
 if(r.status===429){const retry=Number(r.headers.get('Retry-After'));geckoCooldown=Date.now()+Math.max(60000,Number.isFinite(retry)?retry*1000:0);}
 if(r.status===429)throw new Error('Chart provider rate limited. Retrying shortly.');if(!r.ok)throw new Error(r.status===404?'No indexed history for this pool.':'Market history unavailable');return r.json();
}
// One bounded retry handles transient RPC failures. Authorization never uses cached balances.
export async function rpc(method:string,params:unknown[]){
 for(let attempt=0;attempt<2;attempt++){
  try{const r=await fetch(process.env.SOLANA_RPC_URL||'https://api.mainnet-beta.solana.com',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params}),signal:AbortSignal.timeout(7000),cache:'no-store'});if(!r.ok)throw new Error('Solana data unavailable');const body=await r.json();if(body.error||body.result===undefined)throw new Error('Solana data unavailable');return body.result;}
  catch{if(attempt===1)throw new Error('Solana data unavailable. Please retry.');}
 }
}
