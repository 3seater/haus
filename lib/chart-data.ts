export type Candle={time:number;open:number;high:number;low:number;close:number;volume:number};
export type Trade={id:string;signature:string;wallet:string;side:'buy'|'sell';amount:number;usd:number;price:number;time:string};
export type Holder={account:string;owner:string;amount:number;percentage:number};
export const intervals={'1m':['minute',1],'5m':['minute',5],'1h':['hour',1],'1d':['day',1]} as const;
export type Interval=keyof typeof intervals;
export function parseCandles(rows:unknown):Candle[]{
 if(!Array.isArray(rows))return [];
 const unique=new Map<number,Candle>();
 for(const r of rows){if(!Array.isArray(r)||r.length<6||!r.slice(0,6).every(v=>typeof v==='number'&&Number.isFinite(v))||r[0]<=0||r[3]<0||r[5]<0||r[2]<Math.max(r[1],r[4])||r[3]>Math.min(r[1],r[4]))continue;unique.set(r[0],{time:r[0],open:r[1],high:r[2],low:r[3],close:r[4],volume:r[5]});}
 return [...unique.values()].sort((a,b)=>a.time-b.time);
}
export function parseTrades(rows:unknown,mint:string):Trade[]{
 if(!Array.isArray(rows))return [];
 return rows.flatMap(row=>{const a=row?.attributes;if(!a)return [];const buying=a.to_token_address===mint,selling=a.from_token_address===mint;if(!buying&&!selling)return [];const amount=Number(buying?a.to_token_amount:a.from_token_amount),price=Number(buying?a.price_to_in_usd:a.price_from_in_usd),usd=Number(a.volume_in_usd);if(![amount,price,usd].every(v=>Number.isFinite(v)&&v>=0)||!Number.isFinite(Date.parse(a.block_timestamp))||!/^[1-9A-HJ-NP-Za-km-z]{64,90}$/.test(a.tx_hash)||!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(a.tx_from_address))return [];return [{id:String(row.id),signature:a.tx_hash,wallet:a.tx_from_address,side:buying?'buy' as const:'sell' as const,amount,usd,price,time:a.block_timestamp}];}).sort((a,b)=>Date.parse(b.time)-Date.parse(a.time));
}
export function formatPrice(value:number|null){if(value===null||!Number.isFinite(value))return '—';if(value===0)return '$0';return '$'+value.toLocaleString('en-US',{maximumSignificantDigits:5});}
export function compactAmount(value:number){return new Intl.NumberFormat('en-US',{notation:'compact',maximumFractionDigits:2}).format(value);}
