const fs=require('node:fs/promises');
const path=require('node:path');
const sharp=require('../../node_modules/.pnpm/sharp@0.35.4_@types+node@22.20.4/node_modules/sharp');
const out=path.resolve(__dirname,'../../public/brand-kit');
const H='M22 31 195 0 150 141H302L250 282H165L178 181H136L103 282H0Z';
const mark=(x,y,w,fill='none',extra='')=>`<g transform="translate(${x} ${y}) scale(${w/302})"><path d="${H}" fill="${fill}" ${extra}/></g>`;
const rect=fill=>`<rect width="1500" height="500" fill="${fill}"/>`;
const gradient=(id,colors,x2='100%',y2='0%')=>`<linearGradient id="${id}" x1="0%" y1="0%" x2="${x2}" y2="${y2}">${colors.map((c,i)=>`<stop offset="${i/(colors.length-1)*100}%" stop-color="${c}"/>`).join('')}</linearGradient>`;
const designs=[];
function add(id,name,defs,body){designs.push({id,name,svg:`<svg xmlns="http://www.w3.org/2000/svg" width="1500" height="500" viewBox="0 0 1500 500" role="img" aria-label="HAUS ${name}"><title>HAUS ${name}</title><defs>${defs}</defs>${body}</svg>`});}

add('11-quiet-outline','Quiet outline','',rect('#656168')+mark(787,-147,805,'none','stroke="#e5dde3" stroke-width=".34" opacity=".42"'));

add('12-blush-outline','Blush outline',gradient('b12-bg',['#f9e7ef','#f2b6d4','#e59abe']),rect('url(#b12-bg)')+mark(803,-95,698,'none','stroke="#fff9fc" stroke-width=".65" opacity=".7"'));

add('13-chalk','Chalk',gradient('b13-bg',['#f6f4f1','#e7e3e6']),rect('url(#b13-bg)')+mark(969,34,445,'#e4d0dc')+mark(953,21,445,'#f4f1f2')+mark(953,21,445,'none','stroke="#ffffff" stroke-width=".5" opacity=".9"'));

const grid=[];
for(let row=-1;row<5;row++)for(let col=-1;col<13;col++){
 const x=col*142+(row%2)*71,y=row*140-9;
 grid.push(mark(x,y,78,col===8&&row===1?'#e8a6c8':'none',`stroke="#d496b6" stroke-width="1" opacity="${col===8&&row===1?1:.38}"`));
}
add('14-house-repeat','House repeat','',rect('#f6ecef')+grid.join(''));

add('15-soft-signal','Soft signal',gradient('b15-bg',['#5b575e','#9b8195','#dfadca','#f5dfeb']),rect('url(#b15-bg)')+mark(1110,160,180,'none','stroke="#fffbfd" stroke-width="1.4" opacity=".86"'));

add('16-offset','Offset','',rect('#e2dfe1')+mark(491,-242,1060,'none','stroke="#fcfafb" stroke-width=".48"')+mark(463,-214,1060,'none','stroke="#b38a9f" stroke-width=".32" opacity=".65"'));

add('17-rose-haze','Rose haze',`<radialGradient id="b17-cloud" cx="75%" cy="95%" r="78%"><stop stop-color="#e799bd"/><stop offset=".46" stop-color="#f1bad4"/><stop offset="1" stop-color="#f5f0f2"/></radialGradient>`,rect('url(#b17-cloud)')+mark(906,-45,586,'#fff9fc','opacity=".16"')+mark(906,-45,586,'none','stroke="#fffafd" stroke-width=".38" opacity=".48"'));

add('18-fine-lines','Fine lines',`<pattern id="b18-lines" width="7" height="7" patternUnits="userSpaceOnUse"><path d="M1 0V7" stroke="#b5acb2" stroke-width=".45" opacity=".5"/></pattern>`,rect('#6b656c')+rect('url(#b18-lines)')+mark(934,-67,566,'#e8b6ce')+mark(934,-67,566,'none','stroke="#f8d3e5" stroke-width=".3"'));

add('19-pink-relief','Pink relief',`${gradient('b19-bg',['#efb1cf','#e8a4c5'],'100%','100%')}<filter id="b19-relief" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="-2" dy="-3" stdDeviation="2" flood-color="#ffe6f2" flood-opacity=".7"/><feDropShadow dx="4" dy="6" stdDeviation="4" flood-color="#a56086" flood-opacity=".25"/></filter>`,rect('url(#b19-bg)')+mark(1010,96,327,'#ecadcc','filter="url(#b19-relief)"'));

const blocks=[];
for(let row=-1;row<3;row++)for(let col=-1;col<6;col++)blocks.push(mark(col*360+(row%2)*180,row*326-75,350,(row+col)%2===0?'#dd9abb':'#e7a8c9'));
add('20-common-form','Common form','',rect('#f1c1d9')+blocks.join(''));

const logo=`<svg viewBox="0 0 302 283" width="28" height="27" aria-hidden="true"><path d="${H}" fill="currentColor"/></svg>`;
async function main(){
 await fs.mkdir(out,{recursive:true});
 for(const d of designs){const base=`haus-${d.id}-banner`;await fs.writeFile(path.join(out,`${base}.svg`),d.svg);await sharp(Buffer.from(d.svg),{density:144}).resize(3000,1000).png().toFile(path.join(out,`${base}.png`));}
 const gallery=designs.map(d=>`<section id="${d.id}" class="design"><div class="artboard">${d.svg}</div><div class="meta"><h2><span>${d.id.slice(0,2)}</span>${d.name}</h2><div class="exports"><a href="haus-${d.id}-banner.svg" download>SVG</a><a href="haus-${d.id}-banner.png" download>PNG ↓</a></div></div></section>`).join('\n');
 const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>HAUS — 10 art banners</title><style>*{box-sizing:border-box}body{margin:0;background:#f4f0ee;color:#302b31;font-family:Arial,Helvetica,sans-serif}a{color:inherit;text-decoration:none}header{max-width:1500px;margin:auto;padding:26px 5%;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #d6cfd2}.brand{display:flex;gap:8px;align-items:center;font-size:28px;font-weight:800;letter-spacing:-1.6px}header>a:last-child{font-size:11px}main{max-width:1500px;margin:auto;padding:45px 5%}.intro{display:flex;justify-content:space-between;align-items:center;gap:20px;margin-bottom:36px}h1{font-size:36px;letter-spacing:-1.5px;margin:0}.intro p{font-size:11px;color:#837781;margin:10px 0 0}.zip{background:#302b31;color:#fff4f9;padding:15px 18px;font-size:12px;white-space:nowrap}.design{margin-bottom:40px}.artboard{aspect-ratio:3;overflow:hidden}.artboard svg{display:block;width:100%;height:auto}.meta{display:flex;justify-content:space-between;align-items:center;padding:14px 0;border-bottom:1px solid #d6cfd2}h2{display:flex;align-items:center;gap:15px;font-size:14px;font-weight:500;margin:0}h2 span{font-size:10px;font-family:monospace;color:#887b85}.exports{display:flex;gap:7px}.exports a{padding:9px 13px;border:1px solid #d2c8cf;font-size:10px}.exports a:hover{background:#f2a8cd}.zip:hover{background:#6c5263}a:focus-visible{outline:2px solid #ac5181;outline-offset:4px}footer{border-top:1px solid #d6cfd2;padding:23px 5%;font-size:10px;color:#837781;text-align:center}@media(max-width:650px){header{padding:22px 20px}main{padding:28px 20px}.intro{align-items:flex-start;flex-direction:column}h1{font-size:30px}.design{margin-bottom:26px}h2{font-size:12px;gap:8px}.exports a{padding:8px 10px}}</style></head><body><header><a class="brand" href="index.html">${logo}haus</a><a href="index.html">All designs ↗</a></header><main><div class="intro"><div><h1>10 more ways to haus.</h1><p>3000 × 1000 PNG · Editable SVG · No text</p></div><a class="zip" href="haus-minimal-banners-10.zip" download>Download all 10 ↓</a></div>${gallery}</main><footer>HAUS · Pink / grey / white</footer></body></html>`;
 await fs.writeFile(path.join(out,'minimal-banners.html'),html);
 let index=await fs.readFile(path.join(out,'index.html'),'utf8');
 if(!index.includes('id="minimal-banner-link"'))index=index.replace('<main id="top">','<main id="top"><div id="minimal-banner-link" style="padding:20px;margin-bottom:32px;background:#f2c5dc;display:flex;justify-content:space-between;align-items:center;gap:15px"><b>10 new text-free banners</b><a class="download-all" href="minimal-banners.html">View collection ↗</a></div>');
 await fs.writeFile(path.join(out,'index.html'),index);
 const layers=[];
 for(let i=0;i<designs.length;i++){
  const d=designs[i],left=20+(i%2)*770,top=20+Math.floor(i/2)*285;
  layers.push({input:await sharp(Buffer.from(d.svg)).resize(750,250).png().toBuffer(),left,top});
  const label=`<svg width="750" height="25"><text x="0" y="18" font-size="13" font-family="Arial" fill="#675d66">${d.id.slice(0,2)} / ${d.name}</text></svg>`;
  layers.push({input:await sharp(Buffer.from(label)).png().toBuffer(),left,top:top+250});
 }
 await sharp({create:{width:1560,height:1445,channels:3,background:'#f4f0ee'}}).composite(layers).png().toFile(path.join(out,'haus-minimal-contact-sheet.png'));
 console.log('Created 10 SVGs, 10 PNGs, gallery and contact sheet.');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
