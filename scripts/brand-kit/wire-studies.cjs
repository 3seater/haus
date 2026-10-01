const fs=require('node:fs/promises'),path=require('node:path');
const sharp=require('../../node_modules/.pnpm/sharp@0.35.4_@types+node@22.20.4/node_modules/sharp');
const out=path.resolve(__dirname,'../../public/brand-kit/wires');
const designs=[];
const pink='#f2a8cd',pearl='#f4f0e9';
const wire=(d,i=0,width=1.4,opacity=.48)=>`<path d="${d}" fill="none" stroke="url(#${i%3===0?'pearl':'pink'})" stroke-width="${width*2.35}" opacity="${Math.min(.98,opacity+.48)}" stroke-linecap="round"/>`;
const node=(x,y,r=3)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="#f2bdd9"/><circle cx="${x}" cy="${y}" r="${r+5}" fill="none" stroke="#e9bed5" stroke-width=".8" opacity=".3"/>`;
function add(slug,name,desc,body){designs.push({slug,name,desc,svg:`<svg xmlns="http://www.w3.org/2000/svg" width="1500" height="500" viewBox="0 0 1500 500" role="img" aria-labelledby="title desc"><title id="title">${name}</title><desc id="desc">${desc}</desc><defs><radialGradient id="bg" cx="52%" cy="44%" r="75%"><stop stop-color="#211e21"/><stop offset=".55" stop-color="#1b1a1b"/><stop offset="1" stop-color="#191919"/></radialGradient><linearGradient id="pink" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1500" y2="300"><stop stop-color="#eaa0c6"/><stop offset=".48" stop-color="#f8c4df"/><stop offset="1" stop-color="#eda5cc"/></linearGradient><linearGradient id="pearl" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1500" y2="300"><stop stop-color="#eee9e2"/><stop offset=".48" stop-color="#fff9f4"/><stop offset="1" stop-color="#e5dfdc"/></linearGradient></defs><rect width="1500" height="500" fill="url(#bg)"/>${body}</svg>`});}
let b='';
for(let i=0;i<9;i++){let y=58+i*48,t=194+i*14;b+=wire(`M0 ${y}C330 ${y} 390 ${t} 775 ${t}H1530`,i,1.8,.57)+`<circle cx="0" cy="${y}" r="7" fill="${i%3===0?pearl:pink}"/>`;}
b+=wire('M1140 173V327',1,.8,.35)+`<path d="M1135 173H1145M1135 327H1145" stroke="${pink}" stroke-width="2" opacity=".6"/>`;
add('01-in-common','In common','Nine independent strands find a shared direction, closest to the reference.',b);
b='';
for(let i=0;i<7;i++){let y=60+i*21;b+=wire(`M-40 ${y}C380 ${y} 1020 ${500-y} 1540 ${500-y}`,i,1.35,.46);b+=wire(`M-40 ${500-y}C380 ${500-y} 1020 ${y} 1540 ${y}`,i+1,1.35,.46);}
add('02-crossing-paths','Crossing paths','Two fine bundles cross and exchange direction in a symmetrical woven connection.',b,['#5c5760','#6b5d69','#5c5760']);
b='';
for(const dir of [-1,1])for(let i=0;i<5;i++){
 const ex=750+dir*820,ey=50+i*100,branchX=750+dir*(140+Math.abs(2-i)*65);
 b+=wire(`M750 250H${branchX-dir*100}C${branchX} 250 ${branchX} ${ey} ${branchX+dir*160} ${ey}H${ex}`,i,1.3,.43);
 b+=node(branchX+dir*160,ey,2.2);
}
b+=node(750,250,5);
add('03-shared-roots','Shared roots','Fine branching wires spread from a common point, like roots or neural pathways.',b);
b='';
const cols=[[-60,[95,290,465]],[265,[75,245,430]],[585,[130,365]],[915,[130,365]],[1235,[75,245,430]],[1560,[95,290,465]]];
for(let c=0;c<cols.length-1;c++){
 const [x,ys]=cols[c],[xx,yys]=cols[c+1];
 for(let i=0;i<ys.length;i++)for(let j=0;j<yys.length;j++){
  if(Math.abs(i-j)>1)continue;
  b+=wire(`M${x} ${ys[i]}C${x+130} ${ys[i]} ${xx-130} ${yys[j]} ${xx} ${yys[j]}`,i+j,.95,.29);
 }
}
for(const [x,ys] of cols)for(const y of ys)b+=node(x,y,3);
add('04-collective-intelligence','Collective intelligence','Sparse neural-style layers connect through soft curved paths with no dominant node.',b,['#4d4b52','#5a525e','#4d4b52']);
b='';
for(let i=0;i<6;i++){
 const o=i*11;
 b+=wire(`M-40 ${205+o}H335C495 ${205+o} 490 ${68+o} 690 ${68+o}H925C1190 ${68+o} 1200 ${425-o} 925 ${425-o}H575C300 ${425-o} 310 ${205+o} 575 ${205+o}H1540`,i,1.15,.43);
}
add('05-feedback-loop','Feedback loop','Continuous paths circulate through a shared loop and continue beyond the frame.',b,['#5a565e','#685b66','#5a565e']);

async function main(){
 await fs.mkdir(out,{recursive:true});for(const d of designs){await fs.writeFile(path.join(out,d.slug+'.svg'),d.svg);await sharp(Buffer.from(d.svg)).resize(3000,1000).png().toFile(path.join(out,d.slug+'.png'));}
 const prev=await fs.readFile(path.resolve(out,'../arches/index.html'),'utf8');
 await fs.writeFile(path.join(out,'index.html'),prev.slice(0,prev.indexOf('<main>')).replace('HAUS / Arch studies','HAUS / Shared signals')+`<main><header><small>HAUS / WIRE STUDIES</small><h1>Shared signals.</h1><p>Five ways to connect. Near-black backgrounds, brighter pink and warm-white wires, and subtle tonal gradients. Editable SVG + 3000 × 1000 PNG.</p></header>${designs.map(d=>`<article><img src="${d.slug}.svg" alt="${d.desc}"><div class="meta"><div><h2>${d.slug.slice(0,2)} / ${d.name}</h2><p>${d.desc}</p></div><a href="${d.slug}.svg" download>SVG ↓</a><a href="${d.slug}.png" download>PNG ↓</a></div></article>`).join('')}</main></html>`);
 const layers=[];for(let i=0;i<designs.length;i++){const d=designs[i],top=20+i*370;layers.push({input:await sharp(Buffer.from(d.svg)).resize(990,330).png().toBuffer(),left:20,top});layers.push({input:await sharp(Buffer.from(`<svg width="990" height="30"><text x="0" y="22" font-family="Arial" font-size="14" fill="#191919">${d.slug.slice(0,2)} / ${d.name}</text></svg>`)).png().toBuffer(),left:20,top:top+330});}
 await sharp({create:{width:1030,height:1870,channels:3,background:'#f4f0e9'}}).composite(layers).png().toFile(path.join(out,'contact-sheet.png'));console.log('Created five wire studies, SVGs, PNGs and gallery.');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
