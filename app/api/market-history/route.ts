import {NextRequest,NextResponse} from 'next/server';
import {coins} from '@/lib/haus-data';
import {intervals,parseCandles,parseTrades,type Interval} from '@/lib/chart-data';
import {cachedFeed,gecko} from '@/lib/public-feed';
export const dynamic='force-dynamic';
export async function GET(request:NextRequest){
 const query=request.nextUrl.searchParams,mint=query.get('mint'),pool=query.get('pool'),interval=query.get('interval')||'5m',kind=query.get('kind')||'candles';
 if(!coins.some(c=>c.mint===mint)||!pool||!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(pool)||!Object.hasOwn(intervals,interval)||!['candles','trades'].includes(kind))return NextResponse.json({error:'Invalid market request'},{status:400});
 try{
  const data=await cachedFeed(`${kind}:${mint}:${pool}:${kind==='candles'?interval:''}`,60000,async()=>{
   if(kind==='trades'){const result=await gecko(`/networks/solana/pools/${pool}/trades`);return {trades:parseTrades(result.data,mint!),updatedAt:new Date().toISOString()};}
   const [unit,aggregate]=intervals[interval as Interval];const result=await gecko(`/networks/solana/pools/${pool}/ohlcv/${unit}?aggregate=${aggregate}&limit=200&currency=usd&token=${mint}`);
   return {candles:parseCandles(result.data?.attributes?.ohlcv_list),updatedAt:new Date().toISOString()};
  });
  return NextResponse.json(data,{headers:{'Cache-Control':'no-store'}});
 }catch{return NextResponse.json({error:'Market history is temporarily unavailable.'},{status:503});}
}
