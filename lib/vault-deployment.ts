import {PublicKey} from '@solana/web3.js';
import {rpc} from './solana';
import {HttpError} from './config';
import {configAddress,decodeVaultConfig,OWNER_AUTHORITY} from './vault-addresses';
export async function verifiedVaultDeployment(){
 if(!OWNER_AUTHORITY)throw new HttpError(503,'Community vault authority is not configured.');
 if(process.env.HAUS_VAULT_RELEASE_APPROVED!=='true'||!process.env.HAUS_VAULT_PROGRAM_ID)throw new HttpError(503,'Community vault deployment and verification are pending. Launching is disabled to protect creator fees.');
 let program:PublicKey;try{program=new PublicKey(process.env.HAUS_VAULT_PROGRAM_ID);}catch{throw new HttpError(503,'Invalid vault program configuration.');}
 const [executable,account]=await rpc().getMultipleAccountsInfo([program,configAddress(program)],'finalized');
 if(!executable?.executable||!account||!account.owner.equals(program))throw new HttpError(503,'The configured vault program is not deployed and initialized.');
 let config;try{config=decodeVaultConfig(account.data);}catch{throw new HttpError(503,'Vault configuration does not match this release.');}
 if(config.authority.toBase58()!==OWNER_AUTHORITY)throw new HttpError(503,'Vault owner authority does not match the approved HAUS wallet.');
 if(config.paused)throw new HttpError(503,'HAUS vaults are paused. New launches are temporarily disabled.');
 return {program,config};
}
