import {route,origin,json} from '@/lib/http';
import {live} from '@/lib/config';
import {launchIntent,launchChallenge} from '@/lib/launch-access';
import {rateLimit} from '@/lib/redis';
import {boundedJson} from '@/lib/request-body';
import {HttpError} from '@/lib/config';
export const POST=route(async request=>{
  const verifiedOrigin=origin(request);live('LAUNCHES_ENABLED');

  const input=launchIntent.parse(await boundedJson(request,10000));
  if(!process.env.HAUS_LAUNCH_LOOKUP_TABLE&&Number(input.initialBuySol)>0)throw new HttpError(409,'Initial buys are not enabled. Launch with 0 SOL, then buy on Pump.fun.');
  await rateLimit(`launch-proof:${input.wallet}`,10,600);
  return json(await launchChallenge(input,verifiedOrigin));
});
