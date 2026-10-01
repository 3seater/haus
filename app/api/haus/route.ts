import {z} from 'zod';
import {coins} from '@/lib/haus-data';
import {walletSchema} from '@/lib/auth';
import {HolderAccess,ownsTokens} from '@/lib/holder-access';
import {readRoom,contribute} from '@/lib/haus-room';
import {rpc} from '@/lib/public-feed';
import {route,json} from '@/lib/http';
import {HttpError} from '@/lib/config';
import {allowedRequestOrigin} from '@/lib/request-origin';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const mintSchema=z.string().refine(m=>coins.some(c=>c.mint===m),'Unknown token');
const access=new HolderAccess(async(wallet,mint)=>ownsTokens(await rpc('getTokenAccountsByOwner',[wallet,{mint},{encoding:'jsonParsed',commitment:'confirmed'}]),wallet,mint));
const design=z.object({title:z.string().trim().min(1).max(100),tagline:z.string().max(100),description:z.string().max(500),theme:z.enum(['editorial','terminal','playful','midnight'])});
const bodySchema=z.discriminatedUnion('action',[
 z.object({action:z.literal('challenge'),wallet:walletSchema,mint:mintSchema}),
 z.object({action:z.literal('verify'),wallet:walletSchema,mint:mintSchema,id:z.string().uuid(),signature:z.string().max(128)}),
 z.object({action:z.literal('message'),mint:mintSchema,text:z.string().trim().min(1).max(1000)}),
 z.object({action:z.literal('pitch'),mint:mintSchema,design}),
]);
export const GET=route(async request=>json(await readRoom(mintSchema.parse(new URL(request.url).searchParams.get('mint')))));
export const POST=route(async request=>{
 const origin=request.headers.get('origin');
 if(!allowedRequestOrigin(origin,process.env.APP_ORIGIN||'http://localhost:3100',request.headers.get('host'),process.env.NODE_ENV))throw new HttpError(403,'Invalid request origin.');
 const raw=await request.text();if(raw.length>10000)throw new HttpError(413,'Request too large.');
 const body=bodySchema.parse(JSON.parse(raw));
 if(body.action==='challenge')return json(access.challenge(body.wallet,body.mint,origin!));
 if(body.action==='verify')return json(await access.verify(body.id,body.wallet,body.mint,body.signature));
 const session=await access.authorize((request.headers.get('authorization')||'').replace(/^Bearer /,''),body.mint);
 return json(await contribute(body.mint,session.wallet,body.action==='message'?{text:body.text}:{design:body.design}));
});
