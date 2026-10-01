const fs=require('node:fs/promises');
const path=require('node:path');
const sharp=require('../../node_modules/.pnpm/sharp@0.35.4_@types+node@22.20.4/node_modules/sharp');
const out=path.resolve(__dirname,'../../public/brand-kit/arches');
const pink='#f2a8cd',pale='#f8d4e5',paper='#f4f0e9',ink='#191919';
const designs=[];
const rect=(fill)=>`<rect width="1500" height="500" fill="${fill}"/>`;
const gradient=(id,stops,x2='100%',y2='100%')=>`<linearGradient id="${id}" x1="0%" y1="0%" x2="${x2}" y2="${y2}">${stops.map((c,i)=>`<stop offset="${i/(stops.length-1)}" stop-color="${c}"/>`).join('')}</linearGradient>`;
const halo=(id,color,opacity=.4)=>`<radialGradient id="${id}"><stop stop-color="${color}" stop-opacity="${opacity}"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient>`;
const ellipse=(cx,cy,rx,ry,fill,extra='')=>`<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" ${extra}/>`;
const filters=`<filter id="glow" x="-70%" y="-70%" width="240%" height="240%"><feGaussianBlur stdDeviation="15"/></filter><filter id="soft" x="-70%" y="-100%" width="240%" height="300%"><feGaussianBlur stdDeviation="7"/></filter>`;
function segments({cx=750,cy=357,r=245,inner=163,n=11,gap=.014,fill='url(#stone)',stroke='none',sw=1}={}){
 let s='';
 for(let i=0;i<n;i++){
  const a=Math.PI+i*Math.PI/n+gap,b=Math.PI+(i+1)*Math.PI/n-gap;
  const p=(t,v)=>`${(cx+Math.cos(t)*v).toFixed(3)} ${(cy+Math.sin(t)*v).toFixed(3)}`;
  s+=`<path d="M${p(a,r)}A${r} ${r} 0 0 1 ${p(b,r)}L${p(b,inner)}A${inner} ${inner} 0 0 0 ${p(a,inner)}Z" fill="${typeof fill==='function'?fill(i):fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
 }
 return s;
}
function archPath(r=245,cy=365){return `M${750-r} ${cy}V${cy-20}A${r} ${r} 0 0 1 ${750+r} ${cy-20}V${cy}`;}
function add(slug,name,desc,defs,body){designs.push({slug,name,desc,svg:`<svg xmlns="http://www.w3.org/2000/svg" width="1500" height="500" viewBox="0 0 1500 500" role="img" aria-labelledby="title desc"><title id="title">${name}</title><desc id="desc">${desc}</desc><defs>${filters}${defs}</defs>${body}</svg>`});}

let defs=gradient('bg',['#151316','#292027','#151316'],'100%','0%')+gradient('stone',[paper,pink,'#ac5f88'])+halo('aura',pink,.48)+halo('floor',pink,.42);
let s=segments({});
add('01-rose-afterglow','Rose afterglow','Individual rose-lit stones form one centered arch.',defs,rect('url(#bg)')+ellipse(750,258,470,265,'url(#aura)')+ellipse(750,380,330,45,'url(#floor)')+`<g filter="url(#glow)" opacity=".7">${s}</g>`+s);

defs=gradient('bg',[paper,'#f5e0e9',paper],'100%','0%')+gradient('stone',['#fffaf8',pale,pink,'#c982a6'])+halo('shadow','#915772',.28)+halo('light','#fffaf8',.95);
s=segments({r:242,inner:159,n:9,gap:.016,stroke:'#fff7fa',sw:.9});
add('02-porcelain-pieces','Porcelain pieces','Softly extruded pink pieces give the shared arch a sculptural weight.',defs,rect('url(#bg)')+ellipse(750,236,440,270,'url(#light)')+ellipse(750,383,295,27,'url(#shadow)')+`<g transform="translate(0 12)">${segments({r:242,inner:159,n:9,gap:.016,fill:'#ce93ae'})}</g>`+s);

defs=gradient('bg',['#191919','#30232d','#191919'],'100%','0%')+gradient('stone',[pale,pink,'#6c3f58'])+halo('aura',pink,.28);
s=segments({r:250,inner:168,n:13,gap:.02,fill:'none',stroke:'url(#stone)',sw:2.5});
add('03-lit-from-within','Lit from within','An open framework of luminous outlines suggests a structure everyone can build.',defs,rect('url(#bg)')+ellipse(750,265,400,240,'url(#aura)')+`<g filter="url(#glow)">${s}${s}</g>`+s+ellipse(750,375,235,10,'url(#aura)'));

defs=gradient('bg',[paper,pale,paper],'100%','0%')+gradient('stone',['#fffbf8',pink,'#b96991'])+halo('shadow','#ac6888',.2);
s='';
for(let i=0;i<5;i++)s+=`<path d="${archPath(245-i*30,378)}" fill="none" stroke="url(#stone)" stroke-width="17"/>`;
add('04-many-under-one','Many under one','Five nested arches turn individual contributions into a shared shelter.',defs,rect('url(#bg)')+ellipse(750,388,330,32,'url(#shadow)')+s);

defs=gradient('bg',['#191719','#33232d','#191719'],'100%','0%')+gradient('stone',[paper,pink,'#b66c95'])+halo('aura',pink,.36)+halo('floor',pink,.25);
s='';
for(let i=0;i<3;i++)s+=segments({r:251-i*31,inner:226-i*31,n:17-i*2,gap:.014,fill:(j)=>(i+j)%4===0?pale:'url(#stone)'});
add('05-collective-mosaic','Collective mosaic','Many small luminous tiles assemble into a single strong arch.',defs,rect('url(#bg)')+ellipse(750,265,440,260,'url(#aura)')+ellipse(750,380,280,33,'url(#floor)')+`<g opacity=".42" filter="url(#glow)">${s}</g>`+s);

defs=gradient('bg',[paper,'#eed9e3',paper],'100%','0%')+gradient('stone',['#fffaf7',pale,'#d892b6'])+halo('shadow','#92586f',.2)+halo('aura','#ffffff',.95);
s=segments({r:240,inner:175,n:15,gap:.027,stroke:'#fff9f9',sw:.7});
add('06-breathing-room','Breathing room','Spaced pearl-like stones share the load while keeping their own identity.',defs,rect('url(#bg)')+ellipse(750,255,380,235,'url(#aura)')+ellipse(750,383,300,24,'url(#shadow)')+`<g transform="translate(0 5)" opacity=".6">${segments({r:240,inner:175,n:15,gap:.027,fill:'#bc83a0'})}</g>`+s);

defs=gradient('bg',['#181518','#2e222a','#181518'],'100%','0%')+gradient('stone',['#fff5f8',pink,'#9c547b'])+halo('aura',pink,.55)+halo('floor',pink,.3);
s=segments({r:239,inner:157,n:9,gap:.011});
add('07-open-door','Open door','A shared arch frames a warm opening, welcoming the next community member.',defs,rect('url(#bg)')+ellipse(750,298,275,245,'url(#aura)')+ellipse(750,390,490,63,'url(#floor)')+`<g opacity=".35" filter="url(#glow)">${s}</g>`+s+`<path d="M593 357A157 157 0 0 1 907 357" fill="none" stroke="${pale}" stroke-width="2" opacity=".75"/>`);

defs=gradient('bg',[paper,pale,paper],'100%','0%')+gradient('stone',[paper,pink,'#ab5d85'])+halo('shadow','#a56385',.22)+halo('aura','#fffaf7',.7);
s='';
for(const cx of [450,750,1050])s+=segments({cx,cy:325,r:142,inner:93,n:7,gap:.017});
add('08-connected-rooms','Connected rooms','Three equal arches repeat across the banner, making a neighborhood from shared foundations.',defs,rect('url(#bg)')+ellipse(750,230,610,230,'url(#aura)')+ellipse(750,344,560,28,'url(#shadow)')+s);

async function main(){
 await fs.mkdir(out,{recursive:true});
 for(const d of designs){await fs.writeFile(path.join(out,d.slug+'.svg'),d.svg);await sharp(Buffer.from(d.svg)).png().toFile(path.join(out,d.slug+'.png'));}
 const html=`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>HAUS / Arch studies</title><style>*{box-sizing:border-box}body{margin:0;background:${paper};color:${ink};font-family:Arial,sans-serif}main{max-width:1320px;margin:auto;padding:45px 28px}header{padding-bottom:35px}h1{font-size:42px;letter-spacing:-2px;margin:12px 0}p{font-size:13px;line-height:1.5}small{letter-spacing:3px}article{margin-bottom:40px}img{display:block;width:100%;aspect-ratio:3}.meta{display:flex;align-items:center;gap:14px;padding:18px 0;border-bottom:1px solid #19191925}.meta div{flex:1}h2{font-size:17px;margin:0}.meta p{margin:7px 0 0}a{color:inherit;font-size:12px;white-space:nowrap;text-decoration:none;border:1px solid #19191940;padding:10px}a:hover{background:${pink}}@media(max-width:600px){main{padding:24px 14px}.meta{flex-wrap:wrap}.meta div{flex-basis:100%}}</style><main><header><small>HAUS / ARCH STUDIES</small><h1>Held together.</h1><p>Eight centered variations. Rose light, pearl surfaces, soft shadows, and individual pieces making one shared structure.</p><p>1500 × 500 · Editable SVG + PNG</p></header>${designs.map(d=>`<article><img src="${d.slug}.svg" alt="${d.desc}"><div class="meta"><div><h2>${d.slug.slice(0,2)} / ${d.name}</h2><p>${d.desc}</p></div><a href="${d.slug}.svg" download>SVG ↓</a><a href="${d.slug}.png" download>PNG ↓</a></div></article>`).join('')}</main></html>`;
 await fs.writeFile(path.join(out,'index.html'),html);
 const layers=[];
 for(let i=0;i<designs.length;i++){
  const d=designs[i],left=25+i%2*775,top=25+Math.floor(i/2)*295;
  layers.push({input:await sharp(Buffer.from(d.svg)).resize(750,250).png().toBuffer(),left,top});
  layers.push({input:await sharp(Buffer.from(`<svg width="750" height="30"><text x="0" y="23" font-family="Arial" font-size="15" fill="${ink}">${d.slug.slice(0,2)} / ${d.name}</text></svg>`)).png().toBuffer(),left,top:top+250});
 }
 await sharp({create:{width:1575,height:1205,channels:3,background:paper}}).composite(layers).png().toFile(path.join(out,'contact-sheet.png'));
 console.log('Created 8 centered arch variations, SVGs, PNGs, gallery and contact sheet.');
}
main().catch(e=>{console.error(e);process.exitCode=1});
