const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require('../../node_modules/.pnpm/sharp@0.35.4_@types+node@22.20.4/node_modules/sharp');
const out = path.resolve(__dirname, '../../public/brand-kit/symbols');
const paper = '#f4f0e9', ink = '#191919', pink = '#f2a8cd', pale = '#f8d4e5';
const designs = [];
const rect = (x,y,w,h,c,extra='') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}" ${extra}/>`;
const circle = (x,y,r,c) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`;
const line = (d,c,w=3,extra='') => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" ${extra}/>`;
function add(slug,name,desc,bg,body) {
  designs.push({slug,name,desc,svg:`<svg xmlns="http://www.w3.org/2000/svg" width="1500" height="500" viewBox="0 0 1500 500" role="img" aria-labelledby="title desc"><title id="title">${name}</title><desc id="desc">${desc}</desc>${rect(0,0,1500,500,bg)}${body}</svg>`});
}

// 01: Discrete market candles become load-bearing masonry.
let a='';
for(let i=0;i<5;i++) {
  const x=370+i*91, y=[243,207,233,171,189][i], h=[61,98,70,111,90][i];
  a+=line(`M${x+27} ${y-24}V${y+h+24}`,ink,3)+rect(x,y,54,h,i%2?pink:ink);
}
for(let row=0;row<4;row++) for(let col=0;col<5-row;col++) {
  const x=835+col*82+row*40,y=330-row*63;
  a+=rect(x,y,74,55,(col+row)%3===0?ink:pink);
}
a+=rect(1163,116,74,55,pale,'transform="rotate(12 1200 143)"');
add('01-market-makers','Market makers','Candlesticks turn into building blocks: the traders become the builders.',paper,a);

// 02: Flat, alternating over-under woven strips.
a='';
for(let i=0;i<5;i++) a+=line(`M${330+i*44} -30 C${330+i*44} 80 ${745+i*44} 20 ${745+i*44} 130 L${745+i*44} 370 C${745+i*44} 480 ${1120+i*44} 420 ${1120+i*44} 530`,pale,22);
for(let i=0;i<5;i++) a+=line(`M260 ${170+i*40} C500 ${170+i*40} 625 ${170+i*40} 815 ${170+i*40} S1165 ${110+i*40} 1515 ${110+i*40}`,ink,22);
for(let i=0;i<5;i++) for(let j=0;j<5;j++) if((i+j)%2===0) a+=rect(745+i*44-11,170+j*40-17,22,34,pale);
add('02-common-thread','Common thread','Separate strands become one woven fabric: individual contributions create collective strength.',pink,a);

// 03: Equal segments make an arch, held together by a shared keystone.
a='';
for(let i=0;i<9;i++) {
  const t1=Math.PI+i*Math.PI/9+.022,t2=Math.PI+(i+1)*Math.PI/9-.022,cx=960,cy=345,R=244,r=153;
  const p=(t,rad)=>`${cx+Math.cos(t)*rad} ${cy+Math.sin(t)*rad}`;
  a+=`<path d="M${p(t1,R)} A${R} ${R} 0 0 1 ${p(t2,R)} L${p(t2,r)} A${r} ${r} 0 0 0 ${p(t1,r)}Z" fill="${i===4?ink:i%2?pink:pale}"/>`;
}
a+=rect(716,352,91,54,pink)+rect(1113,352,91,54,pale)+line('M620 420H1300',ink,2);
add('03-held-together','Held together','An arch of equal pieces stands because every holder supports the whole.',paper,a);

// 04: Cursor silhouettes become a shared spark, with no privileged center.
a='';
for(let i=0;i<8;i++) a+=`<g transform="translate(970 250) rotate(${i*45})"><path d="M-23 -185L23 -185L23 -118L51 -118L0 -66L-51 -118L-23 -118Z" fill="${i%2?paper:pink}"/></g>`;
add('04-everyone-ships','Everyone ships','Eight cursor-like arrows converge on shared space: everyone can act and contribute.',ink,a);

// 05: A quiet, deliberately unfinished patchwork.
a='';
for(let row=0;row<4;row++) for(let col=0;col<9;col++) {
  if((col===0&&row!==1)||(col===1&&row===3)||(col===8&&row===0))continue;
  const x=530+col*78,y=94+row*78,c=(row+col)%3===0?pink:pale;
  a+=rect(x,y,70,70,c);
  if((row+col)%4===0)a+=line(`M${x+13} ${y+35}H${x+57}M${x+35} ${y+13}V${y+57}`,ink,3);
  else if((row+col)%4===1)a+=line(`M${x+15} ${y+53}L${x+53} ${y+15}`,ink,3);
  else if((row+col)%4===2)a+=circle(x+35,y+35,12,ink);
}
a+=rect(1216,65,70,70,pink,'transform="rotate(12 1251 100)"');
add('05-built-by-many','Built by many','Different marks fill a common patchwork. The open edge leaves room for the next contributor.',paper,a);

// 06: Equal people around an open table, represented by simple radial forms.
a=circle(960,250,94,paper);
for(let i=0;i<12;i++) {
  a+=`<g transform="translate(960 250) rotate(${i*30})">${circle(0,-181,17,i%3===0?paper:ink)}${rect(-13,-151,26,43,i%3===0?paper:ink,'rx="13"')}</g>`;
}
a+=circle(960,250,6,pink);
add('06-a-seat-for-everyone','A seat for everyone','An equal circle of participants surrounds a shared table, with no head of the room.',pink,a);

// 07: Many paths coalesce into a single bundle, remaining individually visible.
a='';
for(let i=0;i<9;i++) {
  const sy=55+i*49,ey=186+i*16;
  a+=line(`M380 ${sy}C650 ${sy} 650 ${ey} 900 ${ey}H1310`,i%3===0?paper:pink,5);
  a+=circle(380,sy,8,i%3===0?paper:pink);
}
a+=line('M1120 149V350',pale,2)+rect(1106,142,28,10,pale)+rect(1106,348,28,10,pale);
add('07-shared-direction','Shared direction','Independent paths align into a common direction while every individual remains visible.',ink,a);

// 08: A bridge built from separate planks, linking two sides.
a=line('M350 190Q855 490 1360 190',ink,3)+line('M350 137Q855 437 1360 137',ink,3);
for(let i=0;i<17;i++) {
  const t=(i+.5)/17,x=350+1010*t,y=137+600*t*(1-t),angle=Math.atan((600-1200*t)/1010)*180/Math.PI;
  a+=rect(x-19,y-14,38,83,i%3===0?ink:pink,`transform="rotate(${angle} ${x} ${y})"`);
}
add('08-common-ground','Common ground','Separate planks form a continuous bridge: the community makes connection possible.',paper,a);

// 09: Repeated links, a continuous collective chain.
a='';
for(let i=0;i<7;i++) {
  const x=390+i*125,y=250+Math.sin(i*.8)*35;
  a+=`<rect x="${x}" y="${y-49}" width="180" height="98" rx="49" fill="none" stroke="${i%2?ink:paper}" stroke-width="19" transform="rotate(-19 ${x+90} ${y})"/>`;
}
add('09-skin-in-the-game','Skin in the game','Interlocking links turn individual commitments into one continuous collective.',pink,a);

// 10: A minimal common roof supported by candle-like columns.
a=line('M620 199L960 83L1300 199',pink,22,'stroke-linejoin="miter"');
for(let i=0;i<7;i++) {
  const x=695+i*80,y=[272,235,260,216,246,225,269][i];
  a+=line(`M${x+18} ${y-35}V${y+108}`,paper,3)+rect(x,y,36,67,i%2?pale:pink);
}
a+=line('M648 397H1272',paper,3);
add('10-under-one-roof','Under one roof','Market candles become the columns of a shared home: the traders support and build the house.',ink,a);

async function main(){
  await fs.mkdir(out,{recursive:true});
  for(const d of designs){
    await fs.writeFile(path.join(out,`${d.slug}.svg`),d.svg);
    await sharp(Buffer.from(d.svg)).png().toFile(path.join(out,`${d.slug}.png`));
  }
  const cards=designs.map(d=>`<article><img src="${d.slug}.svg" alt="${d.desc}"><div class="meta"><div><h2>${d.slug.slice(0,2)} / ${d.name}</h2><p>${d.desc}</p></div><a href="${d.slug}.svg" download>SVG ↓</a><a href="${d.slug}.png" download>PNG ↓</a></div></article>`).join('');
  await fs.writeFile(path.join(out,'index.html'),`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>HAUS — Built by us / 10 symbols</title><style>*{box-sizing:border-box}body{margin:0;background:${paper};color:${ink};font-family:Arial,sans-serif}main{max-width:1320px;margin:auto;padding:50px 30px}header{margin-bottom:45px}h1{font-size:42px;letter-spacing:-2px;margin:12px 0}header p{max-width:630px;line-height:1.6}small{letter-spacing:3px}article{margin:0 0 38px}img{display:block;width:100%;aspect-ratio:3}.meta{display:flex;gap:16px;align-items:center;padding:18px 0;border-bottom:1px solid #19191930}.meta>div{flex:1}h2{font-size:17px;margin:0 0 7px}p{font-size:13px;margin:0;line-height:1.5}a{color:inherit;white-space:nowrap;font-size:12px;padding:12px;border:1px solid #19191940;text-decoration:none}a:hover{background:${pink}}a:focus-visible{outline:3px solid ${ink};outline-offset:3px}.swatches{display:flex;gap:8px;margin:18px 0}.swatches i{width:26px;height:26px;border-radius:50%;border:1px solid #19191925}@media(max-width:600px){main{padding:30px 16px}h1{font-size:32px}.meta{flex-wrap:wrap}.meta>div{flex-basis:100%}}</style><main><header><small>HAUS / SYMBOL STUDIES</small><h1>Built by us.</h1><p>Ten simple visual metaphors for traders becoming builders and a community creating something together. Editable vector artwork, without headlines or logos.</p><div class="swatches">${[paper,ink,pink,pale].map(c=>`<i style="background:${c}" title="${c}"></i>`).join('')}</div><p>1500 × 500 · SVG originals + PNG exports</p></header>${cards}</main></html>`);
  const layers=[];
  for(let i=0;i<designs.length;i++){
    const d=designs[i],left=30+(i%2)*780,top=30+Math.floor(i/2)*300;
    layers.push({input:await sharp(Buffer.from(d.svg)).resize(750,250).png().toBuffer(),left,top});
    const label=`<svg width="750" height="35"><text x="0" y="25" font-family="Arial" font-size="16" fill="${ink}">${d.slug.slice(0,2)} / ${d.name}</text></svg>`;
    layers.push({input:await sharp(Buffer.from(label)).png().toBuffer(),left,top:top+250});
  }
  await sharp({create:{width:1590,height:1530,channels:3,background:paper}}).composite(layers).png().toFile(path.join(out,'contact-sheet.png'));
  console.log(`Created ${designs.length} SVGs, PNG exports, gallery and contact sheet in ${out}`);
}
main().catch(e=>{console.error(e);process.exitCode=1;});
