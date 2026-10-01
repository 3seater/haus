import {loadEnvConfig} from '@next/env';
import {mkdir,writeFile} from 'node:fs/promises';
import {PublicKey} from '@solana/web3.js';
import {OnlinePumpSdk} from '@pump-fun/pump-sdk';
import {rpc} from '../lib/solana';
import {launchLookupAddresses} from '../lib/launch-lookup-plan';
import {OWNER_AUTHORITY} from '../lib/vault-addresses';
loadEnvConfig(process.cwd());
async function main(){
 const programId=process.env.HAUS_VAULT_PROGRAM_ID||'FBVrAjsfxzA6ENq2vaf7Szwzj213uLsHMidYh6SRTu75';
 if(await rpc().getGenesisHash()!=='5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d')throw new Error('Expected mainnet RPC');
 const addresses=await launchLookupAddresses(new PublicKey(programId),await new OnlinePumpSdk(rpc()).fetchGlobal());
 const rent=await rpc().getMinimumBalanceForRentExemption(56+32*addresses.length);
 await mkdir('.haus-data/deployment',{recursive:true});
 await writeFile('.haus-data/deployment/launch-table-plan.json',JSON.stringify({status:'UNSIGNED_PLAN',programId,placeholderProgram:!process.env.HAUS_VAULT_PROGRAM_ID,authority:OWNER_AUTHORITY,addresses:addresses.map(a=>a.toBase58()),rentLamports:rent,steps:['Create table using a fresh finalized slot','Extend with these addresses','Wait until extension is finalized and active','Verify launch transaction size and simulations','Freeze only after verifying all addresses','Set HAUS_LAUNCH_LOOKUP_TABLE to the frozen table address']},null,2));
 console.log(JSON.stringify({addresses:addresses.length,rentLamports:rent,placeholderProgram:!process.env.HAUS_VAULT_PROGRAM_ID,signed:false,submitted:false}));
}
main().catch(()=>{console.error('Unable to prepare lookup table plan; check RPC and deployment configuration.');process.exitCode=1;});
