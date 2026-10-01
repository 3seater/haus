import {json} from '@/lib/http';
import {launchConfigurationChecks} from '@/lib/launch-readiness';

import {rpc} from '@/lib/solana';
import {redis} from '@/lib/redis';
import {HttpError} from '@/lib/config';
import {launchLookupTable} from '@/lib/launch-lookup';
export const dynamic='force-dynamic';
export async function GET() {
 const checks=launchConfigurationChecks(process.env);
 if(checks.some(check=>!check.ready))return json({enabled:false,reason:checks.find(check=>!check.ready)!.message,checks});
 try{
  const [genesis]=await Promise.all([rpc().getGenesisHash(),redis().ping(),process.env.HAUS_LAUNCH_LOOKUP_TABLE?launchLookupTable():Promise.resolve()]);
  if(genesis!=='5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d')return json({enabled:false,reason:'RPC is not connected to Solana mainnet.',checks});
  return json({enabled:true,initialBuyEnabled:!!process.env.HAUS_LAUNCH_LOOKUP_TABLE,reason:'Ready for wallet review. Creator rewards go to the HAUS operator wallet.',checks});
 }catch(error){return json({enabled:false,reason:error instanceof HttpError?error.message:'Launch infrastructure is unavailable. No transaction will be created.',checks});}
}
