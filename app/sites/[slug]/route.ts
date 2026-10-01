import {registeredCoin} from '@/lib/token-registry';
import {readRoom} from '@/lib/haus-room';
import {exportSite} from '@/lib/export-site';
export const dynamic='force-dynamic';
export const runtime='nodejs';
export async function GET(_request:Request,{params}:{params:Promise<{slug:string}>}){
 const {slug}=await params;
 try{
  const coin=await registeredCoin(slug);
  if(!coin)return new Response('Unknown token',{status:404});
  const room=await readRoom(coin.mint),pitch=room.pitches.find(p=>p.id===room.publishedPitchId);
  if(!pitch)return new Response('This Haus has not published a community website yet.',{status:404});
  return new Response(exportSite(coin,pitch.design),{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"sandbox allow-popups allow-popups-to-escape-sandbox; default-src 'none'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src https: data:; base-uri 'none'; form-action 'none'; frame-ancestors 'self'",'Referrer-Policy':'no-referrer'}});
 }catch{return new Response('This website is temporarily unavailable. Please retry shortly.',{status:503});}
}
