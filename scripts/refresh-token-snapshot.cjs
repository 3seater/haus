// Public data only. Refresh explicitly; the UI uses a dated, reproducible snapshot.
const fs = require('node:fs/promises');
const path = require('node:path');
const mints = ['ENbC55qMrwdVBeXUhvK2qwwuEpsys2orw4PQWoc2pump','JCX5nDG99k1CWB9AttJ3U57NmjSgnCoagFaZhqfEf7Ah','Ai66LHZG9MCzg1WKdawwqduVAXpNDUuV8M3uyq5ppump','ELHJQnWNLNEx7QKpirhFd3ADximFoCREn8HxHVf3N2G7','J1mQHsCGiFhoMmzMj59rYnXtkdoCW59HBNV2Jzt4r4S9'];
async function get(url) { const r=await fetch(url,{signal:AbortSignal.timeout(20000)}); if(!r.ok) throw new Error(`${r.status}: ${url}`); return r; }
function readCoin(html,mint) {
 const chunks=[...html.matchAll(/self\.__next_f\.push\(\[1,("(?:[^"\\]|\\.)*")\]\)/g)].map(m=>JSON.parse(m[1])).join('');
 const start=chunks.indexOf(`{"mint":"${mint}"`); if(start<0) throw new Error(`Missing Pump metadata: ${mint}`);
 let depth=0,quoted=false,escaped=false;
 for(let i=start;i<chunks.length;i++) { const c=chunks[i]; if(quoted){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c==='"')quoted=false;}else if(c==='"')quoted=true;else if(c==='{')depth++;else if(c==='}'&&--depth===0)return JSON.parse(chunks.slice(start,i+1)); }
 throw new Error('Incomplete Pump metadata');
}
async function main(){
 const capturedAt=new Date().toISOString();
 const tokens=await Promise.all(mints.map(async mint=>{
  const [html,pairs]=await Promise.all([get(`https://pump.fun/coin/${mint}`).then(r=>r.text()),get(`https://api.dexscreener.com/token-pairs/v1/solana/${mint}`).then(r=>r.json())]);
  const pump=readCoin(html,mint);
  const imageProxy=html.match(/https:\/\/images\.pump\.fun\/coin-image\/[^\s"<>]+/)?.[0].replaceAll('&amp;','&');
  const pair=pairs.filter(p=>p.baseToken.address===mint).sort((a,b)=>(b.liquidity?.usd??0)-(a.liquidity?.usd??0)||b.volume.h24-a.volume.h24)[0];
  if(!pair)throw new Error(`Missing market pair: ${mint}`);
  // Same reserve-based calculation as Perks. Never infer graduation from market cap.
  const progress=pump.complete?100:typeof pump.real_token_reserves==='number'?Math.max(0,Math.min(100,100*(1-pump.real_token_reserves/793100000000000))):null;
  return {mint,name:pump.name,symbol:pump.symbol,imageUrl:pair.info?.imageUrl||imageProxy||pump.image_uri,description:pump.description||'',marketCap:pair.marketCap??null,change:pair.priceChange?.h24??null,volume:pair.volume.h24,createdAt:new Date(pump.created_timestamp).toISOString(),progress,graduated:pump.complete===true,realTokenReserves:pump.real_token_reserves??null,holders:pump.holder_count??null,pumpUpdatedAt:pump.updated_at??null,pumpUrl:`https://pump.fun/coin/${mint}`,marketUrl:pair.url};
 }));
 await fs.writeFile(path.join(__dirname,'../tests/fixtures/token-snapshot.json'),JSON.stringify({capturedAt,tokens},null,2)+'\n');
 console.log(JSON.stringify(tokens.map(({mint,name,symbol,marketCap,progress,graduated,imageUrl})=>({mint,name,symbol,marketCap,progress,graduated,imageUrl})),null,2));
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
