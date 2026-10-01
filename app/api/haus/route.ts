import {siteDesignSchema} from '@/lib/site-design';
import {z} from 'zod';
import {registeredCoin} from '@/lib/token-registry';
import {walletSchema} from '@/lib/auth';
import {communityAccess as access,bearer} from '@/lib/community-access';
import {boundedJson} from '@/lib/request-body';
import {rateLimit} from '@/lib/redis';
import {PublicKey} from '@solana/web3.js';
import {readRoom,contribute} from '@/lib/haus-room';
import {route,json} from '@/lib/http';
import {HttpError} from '@/lib/config';
import {allowedRequestOrigin} from '@/lib/request-origin';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const mintSchema=z.string().refine(value=>{try{return new PublicKey(value).toBase58()===value;}catch{return false;}});
const design=siteDesignSchema;
const bodySchema=z.discriminatedUnion('action',[
 z.object({action:z.literal('challenge'),wallet:walletSchema,mint:mintSchema}),
 z.object({action:z.literal('verify'),wallet:walletSchema,mint:mintSchema,id:z.string().uuid(),signature:z.string().max(128)}),
 z.object({action:z.literal('message'),mint:mintSchema,text:z.string().trim().min(1).max(1000)}),
 z.object({action:z.literal('pitch'),mint:mintSchema,design}),
 z.object({action:z.literal('vote'),mint:mintSchema,pitchId:z.string().uuid()}),
]);
export const GET=route(async request=>{
 const mint=mintSchema.parse(new URL(request.url).searchParams.get('mint'));
 if(!await registeredCoin(mint))throw new HttpError(404,'Unknown token');
 return json(await readRoom(mint));
});
export const POST=route(async request=>{
 const origin=request.headers.get('origin');
 if(!allowedRequestOrigin(origin,process.env.APP_ORIGIN||'http://localhost:3100',request.headers.get('host'),process.env.NODE_ENV))throw new HttpError(403,'Invalid request origin.');
 const body=bodySchema.parse(await boundedJson(request,1800000));
 if(!await registeredCoin(body.mint))throw new HttpError(404,'Unknown token');
 if(body.action==='challenge')return json(await access.challenge(body.wallet,body.mint,origin!));
 if(body.action==='verify')return json(await access.verify(body.id,body.wallet,body.mint,body.signature));
 const session=await access.authorize(bearer(request),body.mint);
 await rateLimit('community:'+session.wallet,30,60);
 return json(await contribute(body.mint,session.wallet,body.action==='message'?{text:body.text}:body.action==='pitch'?{design:body.design}:{pitchId:body.pitchId}));
});
