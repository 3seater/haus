import {NextResponse} from 'next/server';
import {registeredCoins} from '@/lib/token-registry';
export const dynamic='force-dynamic';
export async function GET(){
 try{
  const coins=(await registeredCoins()).sort((a,b)=>Date.parse(b.createdAt)-Date.parse(a.createdAt)||a.mint.localeCompare(b.mint)).slice(0,3);
  return NextResponse.json({coins},{headers:{'Cache-Control':'no-store'}});
 }catch{return NextResponse.json({error:'Recent launches are temporarily unavailable.'},{status:503});}
}
