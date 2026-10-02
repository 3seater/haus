const fs=require('node:fs/promises'),path=require('node:path');
const sharp=require('../../node_modules/.pnpm/sharp@0.35.4_@types+node@22.20.4/node_modules/sharp');
const inlineSvg=require('./inline-svg.cjs'),type=require('./refined-lettering.json')['scribble:Haus'];
const out=path.resolve(__dirname,'../../public/brand-kit/oversized-haus');
const P='#f2a8cd',L='#f8d4e5',K='#191919',W='#ffffff',R='#f4f0e9';
const designs=[];
const bounds=type.bounds;
function glyph(fill,stroke='none',sw=0,dx=0,dy=0){const s=1510/(bounds[2]-bounds[0]);return `<path transform="translate(${-5+dx} ${-373+dy}) scale(${s}) translate(${-bounds[0]} ${-bounds[1]})" d="${type.d}" fill="${fill}" stroke="${stroke}" stroke-width="${sw/s}" stroke-linejoin="round"/>`;}
const defs=`<defs>
<linearGradient id="pink"><stop stop-color="${P}"/><stop offset="1" stop-color="${L}"/></linearGradient>
<linearGradient id="rose" x1="0" y1="0" x2=".85" y2="1"><stop stop-color="${R}"/><stop offset=".48" stop-color="${L}"/><stop offset="1" stop-color="${P}"/></linearGradient>
<linearGradient id="ink" x1="0" y1="0" x2="1" y2=".7"><stop stop-color="${K}"/><stop offset=".58" stop-color="${K}"/><stop offset="1" stop-color="${P}"/></linearGradient>
<linearGradient id="washed"><stop stop-color="${W}"/><stop offset=".65" stop-color="${L}"/><stop offset="1" stop-color="${P}"/></linearGradient>
<linearGradient id="enamel" x1="0" y1="0" x2=".25" y2="1"><stop stop-color="${W}"/><stop offset=".36" stop-color="${L}"/><stop offset=".57" stop-color="${P}"/><stop offset=".78" stop-color="${L}"/><stop offset="1" stop-color="${P}"/></linearGradient>
<linearGradient id="edge" x1="0" y1="0" x2="0" y2="1"><stop stop-color="${W}"/><stop offset=".45" stop-color="${P}"/><stop offset="1" stop-color="${K}"/></linearGradient>
<clipPath id="letter">${glyph(K)}</clipPath>
<clipPath id="frame"><rect width="1500" height="500"/></clipPath>
</defs>`;
function add(name,desc,bg,art){let slug=String(designs.length+1).padStart(2,'0')+'-'+name.toLowerCase().replaceAll(' ','-');designs.push({name,desc,slug,svg:`<svg xmlns="http://www.w3.org/2000/svg" width="1500" height="500" viewBox="0 0 1500 500"><title>Haus / ${name}</title><desc>${desc} Original HV SMEGS Style 1 lettering, intentionally oversized and cropped.</desc>${defs}<g clip-path="url(#frame)"><rect width="1500" height="500" fill="${bg}"/>${art}</g></svg>`});}
add('Ink On White','Flat ink fills the white frame.',W,glyph(K));
add('Pink On White','Full-scale brand pink with a clean white ground.',W,glyph(P));
add('Paper On Ink','Warm paper lettering fills an ink background.',K,glyph(R));
add('Ink On Pink','An assertive flat pink and ink pairing.',P,glyph(K));
add('Rose Wash','A soft paper-to-pink gradient flows through the lettering.',W,glyph('url(#rose)'));
add('Ink To Blush','Near-black lettering drifts into pink across the right side.',W,glyph('url(#ink)'));
add('Hollow Ink','Transparent letter interiors with a crisp ink contour.',W,glyph('none',K,2.6));
add('Hollow Pink','A pink contour on ink with genuinely unfilled interiors.',K,glyph('none',P,3));
add('Contour On Blush','Transparent lettering over a soft white-to-pink field.','url(#washed)',glyph('none',K,2.3));
add('Double Impression','A single fine pink echo behind a clean ink outline.',W,glyph('none',P,2,7,5)+glyph('none',K,2));
add('Pressed Paper','A shallow inset impression formed from clipped vector edges.',R,glyph('#eee8e3')+`<g clip-path="url(#letter)">${glyph('none',K,8,4,4).replace('<path ','<path opacity=".15" ')}${glyph('none',W,7,-3,-3)}</g>`);
add('Pressed Pink','An inset pink wordmark with a dark inner lip and pale lower light.',P,glyph('url(#pink)')+`<g clip-path="url(#letter)">${glyph('none',K,9,4,4).replace('<path ','<path opacity=".26" ')}${glyph('none',L,8,-4,-4)}</g>`);
add('Porcelain Bevel','Warm paper letters with a small pink cast edge and a clean bevel.',W,glyph(P,'none',0,7,8)+glyph(R)+`<g clip-path="url(#letter)">${glyph('none',P,7,-3,-3)}${glyph('none',W,7,3,3)}</g>`);
add('Pink Enamel','A restrained tonal bevel gives the pink letters a polished surface.',K,glyph('url(#enamel)','url(#edge)',2)+`<g clip-path="url(#letter)">${glyph('none',K,7,-3,-3).replace('<path ','<path opacity=".28" ')}${glyph('none',L,6,3,3)}</g>`);
add('Ink Relief','Dark raised letters with a narrow pink sidewall and pearl bevel.',W,glyph(P,'none',0,9,8)+glyph(K)+`<g clip-path="url(#letter)">${glyph('none',L,3,1.5,1.5).replace('<path ','<path opacity=".7" ')}</g>`);

async function main(){
 await fs.mkdir(out,{recursive:true});const layers=[];
 for(let i=0;i<designs.length;i++){
  const d=designs[i];await fs.writeFile(path.join(out,d.slug+'.svg'),d.svg);await sharp(Buffer.from(d.svg)).png().toFile(path.join(out,d.slug+'.png'));
  const x=24+(i%2)*774,y=80+Math.floor(i/2)*292;
  layers.push({input:await sharp(Buffer.from(d.svg)).resize(750,250).png().toBuffer(),left:x,top:y});
  layers.push({input:Buffer.from(`<svg width="750" height="26"><text x="0" y="19" font-family="Arial" font-size="14" fill="${K}">${d.slug.slice(0,2)} / ${d.name}</text></svg>`),left:x,top:y+253});
 }
 layers.push({input:Buffer.from(`<svg width="1500" height="45"><text x="0" y="30" font-family="Arial" font-size="24" fill="${K}">HAUS / UP CLOSE — 15 OVERSIZED TYPE STUDIES</text></svg>`),left:24,top:20});
 await sharp({create:{width:1572,height:2420,channels:3,background:'#e6e2df'}}).composite(layers).png().toFile(path.join(out,'contact-sheet.png'));
 const articles=designs.map(d=>`<article id="${d.slug}" data-name="${d.slug} / ${d.name}">${inlineSvg(d)}<div class="meta"><div><h2>${d.slug.slice(0,2)} / ${d.name}</h2><p>${d.desc}</p></div><a download href="${d.slug}.svg">SVG ↓</a><a download href="${d.slug}.png">PNG ↓</a></div></article>`).join('');
 await fs.writeFile(path.join(out,'index.html'),`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Haus / Up close</title><style>*{box-sizing:border-box}body{margin:0;background:#e6e2df;color:${K};font:14px Arial,sans-serif}main{width:1548px;max-width:100%;padding:36px 24px;margin:auto}header{margin-bottom:32px}h1{font-size:44px;font-weight:500;letter-spacing:-2px;margin:10px 0}header p{line-height:1.6;color:#5a5356}article{margin-bottom:32px}article>svg{display:block;width:100%;height:auto;aspect-ratio:3/1;overflow:hidden}.meta{display:flex;align-items:center;gap:16px;padding:14px 0}.meta div{flex:1}h2{font-size:16px;margin:0 0 6px;font-weight:500}p{margin:0;line-height:1.5;font-size:13px}a{color:inherit;text-decoration:none;border-bottom:1px solid #a3969c;padding:7px 0;white-space:nowrap}body.artwork-only main{padding:0;width:1500px}body.artwork-only header,body.artwork-only .meta{display:none}body.artwork-only article{margin-bottom:24px}button{font:inherit;background:${K};color:white;border:0;padding:11px 16px;cursor:pointer;margin-top:14px}@media(max-width:650px){.meta{flex-wrap:wrap}.meta div{flex-basis:100%}h1{font-size:32px}}</style></head><body><main><header><small>HAUS / UP CLOSE</small><h1>Let the type fill the frame.</h1><p>15 oversized Haus banners · HV SMEGS Style 1 · 1500 × 500 · Inline vectors, including inset and bevel treatments</p><button onclick="document.body.classList.toggle('artwork-only')">Show artwork only for export</button></header>${articles}</main></body></html>`);
 console.log('Created 15 oversized Haus banners and inline-SVG gallery.');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
