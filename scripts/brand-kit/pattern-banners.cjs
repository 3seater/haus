const fs=require('node:fs/promises'),path=require('node:path');
const sharp=require('../../node_modules/.pnpm/sharp@0.35.4_@types+node@22.20.4/node_modules/sharp');
const out=path.resolve(__dirname,'../../public/brand-kit/patterns');
const designs=[];
const g=(id,colors)=>`<linearGradient id="${id}" x1="0" y1="0" x2=".85" y2="1">${colors.map((c,i)=>`<stop offset="${i/(colors.length-1)}" stop-color="${c}"/>`).join('')}</linearGradient>`;
const defs=g('rose',['#fff4f8','#f2a8cd','#ac5f88'])+g('pearl',['#fffaf8','#f8d4e5','#d892b6'])+g('plum',['#9c6887','#543447','#241c23'])+g('blush',['#f8d4e5','#f2a8cd','#cf87ab'])+g('dark',['#342630','#191719'])+`<radialGradient id="aura"><stop stop-color="#f2a8cd" stop-opacity=".48"/><stop offset="1" stop-color="#f2a8cd" stop-opacity="0"/></radialGradient><radialGradient id="wash"><stop stop-color="#fff4f8" stop-opacity=".26"/><stop offset="1" stop-color="#f2a8cd" stop-opacity="0"/></radialGradient><filter id="glow" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="9"/></filter>`;
const rect=(x,y,w,h,f,extra='')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}" ${extra}/>`;
const p=(d,f,extra='')=>`<path d="${d}" fill="${f}" ${extra}/>`;
const stroke=(d,c,w)=>p(d,'none',`stroke="${c}" stroke-width="${w}"`);
const fills=['url(#rose)','url(#pearl)','url(#blush)','url(#plum)'];
function add(slug,name,desc,body,dark=false,glow=false){designs.push({slug,name,desc,svg:`<svg xmlns="http://www.w3.org/2000/svg" width="1500" height="500" viewBox="0 0 1500 500" role="img" aria-labelledby="title desc"><title id="title">${name}</title><desc id="desc">${desc}</desc><defs>${defs}</defs>${rect(0,0,1500,500,dark?'url(#dark)':'#f8d4e5')}${glow?`<g opacity=".5" filter="url(#glow)">${body}</g>`:''}${body}<ellipse cx="750" cy="200" rx="850" ry="420" fill="url(#${dark?'aura':'wash'})"/></svg>`});}
let b='';
// Arches nested tightly in a staggered full-bleed field.
for(let row=-1;row<5;row++)for(let col=-1;col<9;col++){
 const x=col*200+(row%2)*100,y=row*145;
 b+=rect(x,y,200,145,(row+col)%3===0?'url(#blush)':'url(#pearl)');
 for(let k=0;k<4;k++){const r=96-k*23;b+=stroke(`M${x+100-r} ${y+145}V${y+111}A${r} ${r} 0 0 1 ${x+100+r} ${y+111}V${y+145}`,k%2?'url(#rose)':'url(#pearl)',19);}
}
add('01-arch-static','Arch static','An uninterrupted field of nested rose arches.',b);

b='';
for(let r=-1;r<6;r++)for(let c=-1;c<16;c++){
 const x=c*108+(r%2)*54,y=r*104,f=fills[((c*7+r*11)%4+4)%4];
 b+=rect(x+3,y+3,102,98,f)+stroke(`M${x+5} ${y+99}V${y+5}H${x+102}`,'#fff5f838',1);
}
add('02-soft-machinery','Soft machinery','Offset blocks of pearl, pink, and plum with softly illuminated edges.',b,true);

b='';
for(let r=-1;r<5;r++)for(let c=-1;c<13;c++){
 const x=c*130,y=r*130,rot=((c*3+r*7)%4+4)%4*90;
 b+=`<g transform="translate(${x} ${y}) rotate(${rot} 65 65)">${rect(0,0,130,130,'url(#plum)')}`;
 for(let k=0;k<4;k++){let rad=22+k*34;b+=stroke(`M${rad} 0A${rad} ${rad} 0 0 1 0 ${rad}`,'url(#rose)',18)+stroke(`M${130-rad} 130A${rad} ${rad} 0 0 1 130 ${130-rad}`,'url(#pearl)',11);}
 b+='</g>';
}
add('03-rose-circuit','Rose circuit','Rotating quarter-circle tiles create a strange continuous maze.',b,true);

b='';
const point=(c,r)=>[c*78+18*Math.sin(r*.8+c*.45),r*67+21*Math.sin(c*.55+r*.4)];
for(let r=-2;r<10;r++)for(let c=-2;c<22;c++){
 const v=[point(c,r),point(c+1,r),point(c+1,r+1),point(c,r+1)];
 b+=p(`M${v.map(a=>a.join(' ')).join('L')}Z`,(c+r)%2===0?'url(#rose)':'url(#pearl)','stroke="#a5648338" stroke-width="1"');
}
add('04-liquid-checker','Liquid checker','A warped checkerboard flows across the entire banner.',b);

b='';
for(let r=-2;r<7;r++)for(let c=-2;c<14;c++){
 const x=c*144+(r%2)*72,y=r*83;
 b+=p(`M${x} ${y}l72 -42 72 42 -72 42Z`,'url(#pearl)')+p(`M${x} ${y}l72 42v83l-72 -42Z`,'url(#rose)')+p(`M${x+72} ${y+42}l72 -42v83l-72 42Z`,'url(#plum)');
}
add('05-impossible-blocks','Impossible blocks','An endless tessellation of dimensional blocks, with alternating light and shadow.',b,true);

b='';
for(let r=-1;r<5;r++)for(let c=-1;c<13;c++){
 const x=c*136+(r%2)*68,y=r*145;
 for(let k=0;k<3;k++){
 const rx=62-k*18,ry=69-k*19;
 b+=`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="none" stroke="url(#${k%2?'pearl':'rose'})" stroke-width="12"/>`;
 }
}
add('06-orbital-wallpaper','Orbital wallpaper','Overlapping oval portals make a dense luminous pattern.',b,true,true);

b='';
for(let r=-1;r<7;r++)for(let c=-1;c<15;c++){
 const x=c*116,y=r*96,flip=(r+c)%2===0;
 b+=`<g transform="translate(${x} ${y})">${rect(0,0,116,96,flip?'url(#rose)':'url(#plum)')}`;
 b+=p(flip?'M0 0H116V28H87V51H58V74H29V96H0Z':'M116 96H0V68H29V45H58V22H87V0H116Z','url(#pearl)')+'</g>';
}
add('07-staircase-noise','Staircase noise','Interlocking stepped shapes turn building blocks into an optical rhythm.',b);

b='';
for(let i=-3;i<26;i++){
 const x=i*74;
 b+=p(`M${x-130} -50C${x+220} 115 ${x-190} 325 ${x+180} 550L${x+215} 550C${x-155} 325 ${x+255} 115 ${x-95} -50Z`,i%3===0?'url(#pearl)':'url(#rose)');
}
add('08-pink-interference','Pink interference','Tightly packed flowing ribbons create a luminous interference field.',b,true,true);

b='';
for(let r=-1;r<5;r++)for(let c=-1;c<11;c++){
 const x=c*164,y=r*164;
 b+=rect(x,y,164,164,(c+r)%2?'url(#rose)':'url(#pearl)');
 b+=`<g transform="translate(${x+82} ${y+82}) rotate(${(r+c)%2?45:0})">`;
 for(let k=0;k<4;k++){const z=112-k*24;b+=rect(-z/2,-z/2,z,z,k%2?'url(#pearl)':'url(#plum)','rx="9"');}
 b+='</g>';
}
add('09-nested-worlds','Nested worlds','Square wells and rotated diamonds pack the frame with small dimensional worlds.',b);

b='';
for(let r=-1;r<7;r++)for(let c=-1;c<19;c++){
 const x=c*88+(r%2)*44,y=r*95,n=((c*13+r*19)%7+7)%7;
 b+=rect(x+2,y+2,84,91,n<2?'url(#plum)':n<5?'url(#rose)':'url(#pearl)','rx="3"');
 if(n===2||n===4)b+=stroke(`M${x+44} ${y+18}V${y+76}`,'#fff4f877',2);
 if(n===1)b+=rect(x+24,y+24,40,44,'url(#rose)','rx="20"');
 if(n===6)b+=p(`M${x+12} ${y+72}L${x+72} ${y+12}V${y+72}Z`,'url(#blush)');
}
add('10-community-pixels','Community pixels','A full wall of varied blocks, each different but part of one shared fabric.',b,true);

async function main(){
 await fs.mkdir(out,{recursive:true});
 for(const d of designs){await fs.writeFile(path.join(out,d.slug+'.svg'),d.svg);await sharp(Buffer.from(d.svg)).png().toFile(path.join(out,d.slug+'.png'));}
 await fs.writeFile(path.join(out,'index.html'),`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>HAUS / Full-bleed patterns</title><style>*{box-sizing:border-box}body{margin:0;background:#f4f0e9;color:#191919;font-family:Arial,sans-serif}main{max-width:1440px;margin:auto;padding:40px 24px}header{padding-bottom:35px}h1{font-size:40px;letter-spacing:-1.8px;margin:12px 0}small{letter-spacing:3px}p{font-size:13px;line-height:1.5}article{margin-bottom:36px}img{display:block;width:100%;aspect-ratio:3}.meta{display:flex;align-items:center;gap:12px;padding:16px 0;border-bottom:1px solid #19191925}.meta div{flex:1}h2{font-size:17px;margin:0}.meta p{margin:7px 0 0}a{color:inherit;text-decoration:none;white-space:nowrap;border:1px solid #19191940;padding:10px;font-size:12px}a:hover{background:#f2a8cd}@media(max-width:600px){.meta{flex-wrap:wrap}.meta div{flex-basis:100%}}</style><main><header><small>HAUS / PATTERN STUDIES</small><h1>Every piece belongs.</h1><p>Ten edge-to-edge patterns. Pink, pearl, plum, soft gradients, and rose light. 1500 × 500 editable SVGs.</p></header>${designs.map(d=>`<article><img src="${d.slug}.svg" alt="${d.desc}"><div class="meta"><div><h2>${d.slug.slice(0,2)} / ${d.name}</h2><p>${d.desc}</p></div><a href="${d.slug}.svg" download>SVG ↓</a><a href="${d.slug}.png" download>PNG ↓</a></div></article>`).join('')}</main></html>`);
 const layers=[];
 for(let i=0;i<designs.length;i++){
  const d=designs[i],left=25+(i%2)*775,top=25+Math.floor(i/2)*292;
  layers.push({input:await sharp(Buffer.from(d.svg)).resize(750,250).png().toBuffer(),left,top});
  layers.push({input:await sharp(Buffer.from(`<svg width="750" height="30"><text x="0" y="23" font-family="Arial" font-size="15" fill="#191919">${d.slug.slice(0,2)} / ${d.name}</text></svg>`)).png().toBuffer(),left,top:top+250});
 }
 await sharp({create:{width:1575,height:1485,channels:3,background:'#f4f0e9'}}).composite(layers).png().toFile(path.join(out,'contact-sheet.png'));
 console.log('Created 10 full-bleed SVG patterns, PNG exports, gallery, and contact sheet.');
}
main().catch(e=>{console.error(e);process.exitCode=1});
