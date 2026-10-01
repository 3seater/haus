import {randomUUID} from 'node:crypto';
import {z} from 'zod';
import {route,json,origin} from '@/lib/http';
import {HttpError} from '@/lib/config';
import {registeredCoin} from '@/lib/token-registry';
import {communityAccess,bearer} from '@/lib/community-access';
import {redis,rateLimit} from '@/lib/redis';
import {boundedBody} from '@/lib/request-body';
import {assetFormat,assetName,MAX_ASSET_BYTES} from '@/lib/shared-assets';
import {readRoom,contribute} from '@/lib/haus-room';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const POST=route(async request=>{
 origin(request);
 const mint=new URL(request.url).searchParams.get('mint')||'';
 if(!await registeredCoin(mint))throw new HttpError(404,'Unknown token.');
 const session=await communityAccess.authorize(bearer(request),mint);
 await rateLimit('asset-upload:'+session.wallet,10,3600);
 const bytes=await boundedBody(request,MAX_ASSET_BYTES+16384);
 const form=await new Response(bytes,{headers:{'Content-Type':request.headers.get('content-type')||''}}).formData();
 const file=form.get('file');if(!(file instanceof File))throw new HttpError(400,'Choose an image to share.');
 const content=new Uint8Array(await file.arrayBuffer()),format=assetFormat(content);
 const asset={id:randomUUID(),wallet:session.wallet,name:assetName(file.name,format.extension),type:format.type,size:content.length,createdAt:new Date().toISOString()};
 const key='room:asset:'+mint+':'+asset.id;
 // Pending uploads expire. A crash cannot create permanent, unreferenced blobs.
 await redis().set(key,Buffer.from(content),'EX',86400);
 return json(await contribute(mint,session.wallet,{asset}),201);
});
export const GET=route(async request=>{
 const url=new URL(request.url),mint=url.searchParams.get('mint')||'',id=z.string().uuid().parse(url.searchParams.get('id'));
 if(!await registeredCoin(mint))throw new HttpError(404,'Unknown token.');
 const asset=(await readRoom(mint)).assets.find(a=>a.id===id);
 if(!asset)throw new HttpError(404,'Asset not found.');
 const key='room:asset:'+mint+':'+id,bytes=await redis().getBuffer(key);
 if(!bytes)throw new HttpError(503,'Asset storage is temporarily unavailable.');
 return new Response(new Uint8Array(bytes),{headers:{'Content-Type':asset.type,'Content-Length':String(bytes.length),'Content-Disposition':(url.searchParams.has('download')?'attachment':'inline')+'; filename="'+asset.name+'"','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; sandbox",'Cache-Control':'public, max-age=3600'}});
});
