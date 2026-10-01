export type ReadinessCheck={id:string;ready:boolean;message:string};
export function launchConfigurationChecks(env:Record<string,string|undefined>):ReadinessCheck[]{
 const key=env.LAUNCH_ENCRYPTION_KEY?Buffer.from(env.LAUNCH_ENCRYPTION_KEY,'base64'):null;
 const url=(value:string|undefined,protocols:string[])=>{try{return protocols.includes(new URL(value!).protocol);}catch{return false;}};
 return [
  {id:'enabled',ready:env.NEXT_PUBLIC_DEMO_MODE==='false'&&env.LAUNCHES_ENABLED==='true',message:'Live launching must be explicitly enabled.'},
  {id:'network',ready:env.NEXT_PUBLIC_SOLANA_NETWORK==='mainnet-beta',message:'Wallet network must be Solana mainnet.'},
  {id:'rpc',ready:url(env.SOLANA_RPC_URL,['https:','http:']),message:'A working Solana mainnet RPC is required.'},
  {id:'redis',ready:url(env.REDIS_URL,['redis:','rediss:']),message:'Persistent Redis is required for launch records and recovery.'},
  {id:'origin',ready:url(env.APP_ORIGIN,['https:','http:']),message:'The application origin must be configured.'},
  {id:'encryption',ready:key?.length===32,message:'A 32-byte launch encryption key is required.'},
  {id:'metadata',ready:env.METADATA_PROVIDER==='pump'||(env.METADATA_PROVIDER==='pinata'&&!!env.PINATA_JWT),message:'Configure Pump metadata uploads or Pinata storage.'},
 ];
}
