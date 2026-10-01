import {NextRequest,NextResponse} from 'next/server';
import {coins} from '@/lib/haus-data';
import {cachedFeed,rpc} from '@/lib/public-feed';
import type {Holder} from '@/lib/chart-data';
export const dynamic='force-dynamic';
export async function GET(request:NextRequest){
 const mint=request.nextUrl.searchParams.get('mint');if(!coins.some(c=>c.mint===mint))return NextResponse.json({error:'Unknown token'},{status:400});
 try{
  const data=await cachedFeed(`holders:${mint}`,120000,async()=>{
   const [largest,supply]=await Promise.all([rpc('getTokenLargestAccounts',[mint,{commitment:'confirmed'}]),rpc('getTokenSupply',[mint,{commitment:'confirmed'}])]);
   const accounts=largest.value as {address:string;amount:string;decimals:number;uiAmountString:string}[];
   const owners=accounts.length?await rpc('getMultipleAccounts',[accounts.map(a=>a.address),{encoding:'jsonParsed',commitment:'confirmed'}]):{value:[]};
   const holders:Holder[]=accounts.map((a,i)=>({account:a.address,owner:owners.value[i]?.data?.parsed?.info?.owner||a.address,amount:Number(a.uiAmountString),percentage:Number(supply.value.amount)>0?100*Number(a.amount)/Number(supply.value.amount):0}));
   return {holders,updatedAt:new Date().toISOString()};
  });return NextResponse.json(data,{headers:{'Cache-Control':'no-store'}});
 }catch{return NextResponse.json({error:'Holder accounts are temporarily unavailable.'},{status:503});}
}
