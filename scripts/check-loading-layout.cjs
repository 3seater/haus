/* Run against a local server with Playwright available (or PLAYWRIGHT_MODULE set).
   Requests are intercepted; no wallet operations or writes are performed. */
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const base=process.env.LOADING_TEST_URL||'http://localhost:3111';
const mint='34kn8U22dPorCxnRudCt4qZpaD3Gt1qiYy4UsNdRVpwP';
const coin={id:mint,mint,name:'Test',ticker:'TEST',imageUrl:'https://example.test/token.png',color:'#edc4dc',bg:'#edc4dc',art:'image',cap:3345,change:1,holders:2,members:0,progress:0,graduated:false,createdAt:'2026-10-03T21:16:51.000Z',status:'Building',story:'Test',age:'New',price:.000003345,volume:23.6,liquidity:null,pairAddress:'BTEbRKJpgDwq22pSQQbRiLwvThDfM9Lne7947i1dd28Z',marketUrl:'https://pump.fun',websites:[],socials:[],updatedAt:new Date().toISOString(),marketStatus:'current'};
const design={title:'Test. Built by us.',tagline:'A community website',description:'Test',theme:'editorial'};
const room={messages:[{id:'message1',wallet:mint,text:'Hello, Haus.',createdAt:new Date().toISOString()}],pitches:[{id:'pitch1',wallet:mint,roundId:'round1',design,createdAt:new Date().toISOString()}],assets:[{id:'asset1',wallet:mint,name:'Artwork.png',size:2048,type:'image/png',createdAt:new Date().toISOString()}],rounds:[],publishedPitchId:null};
const sizes=[{width:1440,height:1000},{width:390,height:844}];
async function boxes(page,selectors){return page.evaluate(selectors=>Object.fromEntries(selectors.map(s=>{const el=document.querySelector(s);if(!el)return [s,null];const r=el.getBoundingClientRect();return [s,[r.x,r.y,r.width,r.height]];})),selectors);}
function same(before,after,label){for(const key of Object.keys(before)){assert.ok(before[key]&&after[key],`${label}: missing ${key}`);before[key].forEach((value,i)=>assert.ok(Math.abs(value-after[key][i])<=1,`${label}: ${key}[${i}] moved ${value} -> ${after[key][i]}`));}}
(async()=>{
 const browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||"chrome"});fs.mkdirSync('test-results/loading',{recursive:true});
 try{for(const viewport of sizes){
  const context=await browser.newContext({viewport});
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://fonts.googleapis.com/**',route=>route.fulfill({contentType:'text/css',body:''}));
  let failing=false;let release;let gate=new Promise(r=>release=r);
  await page.route('**/api/**',async route=>{await gate;if(failing){await route.fulfill({status:503,json:{error:'Temporarily unavailable'}});return;}const requestUrl=new URL(route.request().url());const path=requestUrl.pathname;const requested=requestUrl.searchParams.get('mint');let body=path==='/api/markets'?{coins:[requested?{...coin,id:requested,mint:requested}:coin]}:path==='/api/launches/recent'?{coins:[coin]}:path==='/api/haus'?room:path==='/api/market-history'?{candles:[{time:1700000000,open:.000003,high:.000004,low:.000002,close:.0000035,volume:12}],trades:[{id:'trade1',side:'buy',amount:1000,usd:1,price:.000003,wallet:mint,signature:'test',time:new Date().toISOString()}]}:path==='/api/holders'?{holders:[]}:path==='/api/vault'?{enabled:false,reason:'Not configured',rounds:[]}:{};await route.fulfill({json:body});});
  await page.route(/https:\/\/(gateway\.pinata\.cloud|dweb\.link|ipfs\.io|example\.test)\//,async route=>{await gate;await route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="pink"/></svg>'});});
  for(const scenario of [
   {name:'home',path:'/',selectors:['.hero-launches','.hero-launches-list','.hero-stats','.home-hero-section']},
   {name:'explore',path:'/app',selectors:['.explore-results','.main-footer']},
   {name:'community',path:`/app?coin=${mint}&view=community`,selectors:['.haus-heading','.haus-grid','.haus-room','.haus-market-peek']},
   {name:'market',path:`/app?coin=${mint}`,selectors:['.token-header','.market-stats','.native-chart-stage','.market-tables','.trade-sidebar']},
   {name:'identity',path:'/app?coin=So11111111111111111111111111111111111111112&view=community',selectors:['.haus-heading','.haus-grid','.haus-room']},
   {name:'website',path:`/app?coin=${mint}&view=community&tab=website`,selectors:['.haus-site-editor','.haus-room','.haus-site-canvas']},
   {name:'draft',path:`/drafts/${mint}`,selectors:['.draft-viewport']},
   {name:'pitches',path:`/app?coin=${mint}&view=community&tab=proposals`,selectors:['.haus-grid','.community-results','.haus-room']},
   {name:'assets',path:`/app?coin=${mint}&view=community&tab=assets`,selectors:['.haus-assets','.community-assets-results','.haus-room']},
   {name:'vault',path:`/app?coin=${mint}&view=community&tab=vault`,selectors:['.vault-results','.haus-room']},
   {name:'failure',path:`/app?coin=${mint}&view=community`,selectors:['.haus-heading','.haus-grid','.haus-room','.haus-market-peek']},
   {name:'hauses',path:'/app?view=hauses',selectors:['.my-hauses-results','.main-footer']},
  ]){
   failing=scenario.name==='failure';gate=new Promise(r=>release=r);
   await page.addInitScript(({mint,design})=>{if(window===window.top)localStorage.setItem('haus-workspace-v1',JSON.stringify({drafts:{[mint]:design},saved:[]}));},{mint,design});
   await page.goto(base+scenario.path,{waitUntil:'domcontentloaded'});await page.evaluate(()=>document.fonts.ready);
   await page.locator(scenario.selectors[0]).waitFor();await page.waitForTimeout(350);
   assert.equal(await page.getByText('Loading this token…',{exact:true}).count(),0);
   const before=await boxes(page,scenario.selectors);
   await page.evaluate(()=>{window.__loadingShifts=[];new PerformanceObserver(list=>{for(const e of list.getEntries())if(!e.hadRecentInput)window.__loadingShifts.push({value:e.value,nodes:e.sources?.map(s=>({html:s.node?.outerHTML?.slice(0,160),before:s.previousRect,after:s.currentRect}))});}).observe({type:'layout-shift',buffered:false});});
   await page.screenshot({path:`test-results/loading/${scenario.name}-${viewport.width}-pending.png`});
   release();await page.waitForTimeout(700);
   const shifts=await page.evaluate(()=>window.__loadingShifts);assert.ok(shifts.reduce((n,s)=>n+s.value,0)<.00001,scenario.name+' unexpected shifts: '+JSON.stringify(shifts));
   const after=await boxes(page,scenario.selectors);same(before,after,`${scenario.name} ${viewport.width}`);
   await page.screenshot({path:`test-results/loading/${scenario.name}-${viewport.width}-loaded.png`});
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);assert.equal(overflow,false,`${scenario.name}: horizontal overflow`);
   console.log(`PASS ${scenario.name} ${viewport.width}: stable loading/data geometry`);
  }
  await page.goto(base+'/docs#website');await page.locator('.docs-scroll[aria-busy="false"]').waitFor();assert.equal(await page.locator('.docs-article h1').textContent(),'Website studio');
  await page.emulateMedia({reducedMotion:'reduce'});await page.goto(base+`/app?coin=${mint}&view=community`);
  await page.evaluate(()=>document.documentElement.dataset.theme='dark');
  const effect=await page.evaluate(()=>{const el=document.createElement('span');el.className='skeleton';document.body.append(el);const value=getComputedStyle(el,'::after').animationName;el.remove();return value;});assert.equal(effect,'none');
  assert.deepEqual(errors,[]);await context.close();
 }}finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
