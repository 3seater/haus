// Read-only preflight. Never creates keypairs, signs transactions or prints credentials.
const fs=require('node:fs');
const path=require('node:path');
const {PublicKey}=require('@solana/web3.js');
const {loadEnvConfig}=require('@next/env');
loadEnvConfig(process.cwd());
const deployment=require('../contracts/deployment.json');
async function main(){
 console.log('HAUS owner authority:',new PublicKey(deployment.ownerAuthority).toBase58());
 console.log('Contract status:',deployment.status);
 for(const name of ['SOLANA_RPC_URL','REDIS_URL','APP_ORIGIN','LAUNCH_ENCRYPTION_KEY','HAUS_VAULT_PROGRAM_ID','HAUS_WORKER_KEYPAIR_PATH'])console.log(name+': '+(process.env[name]?'configured':'MISSING'));
 console.log('Voting policy:',deployment.policyApproved?'approved':'NOT APPROVED');
 const artifact=path.join(process.cwd(),'contracts','target','deploy','haus_vault.so');
 if(!fs.existsSync(artifact)){console.log('Contract binary: MISSING. No deployment funding estimate is available until the program is compiled.');return;}
 const bytes=fs.statSync(artifact).size;
 console.log('Contract binary size:',bytes,'bytes');
 if(!process.env.SOLANA_RPC_URL){console.log('RPC required for current rent estimates.');return;}
 async function rpc(method,params){const response=await fetch(process.env.SOLANA_RPC_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params}),signal:AbortSignal.timeout(10000)});if(!response.ok)throw new Error('RPC unavailable');const result=await response.json();if(result.error)throw new Error('RPC request rejected');return result.result;}
 console.log('RPC genesis hash:',await rpc('getGenesisHash',[]));
 const sizes={programAccount:36,programDataAtBinarySize:bytes+45,temporaryUploadBuffer:bytes+37,configuration:148,perTokenVault:97,perRound:237,perBallot:17,perClaimReceipt:16};
 for(const [label,size] of Object.entries(sizes)){const lamports=await rpc('getMinimumBalanceForRentExemption',[size]);console.log(label+': '+lamports+' lamports rent exemption');}
 console.log('Estimates exclude transaction fees and any larger program allocation. Upload-buffer funding is temporary. No funds were moved.');
}
main().catch(()=>{console.error('Preflight failed. Check local configuration and RPC availability.');process.exitCode=1;});
