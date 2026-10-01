const fs=require('node:fs/promises'),path=require('node:path');
const sharp=require('../../node_modules/.pnpm/sharp@0.35.4_@types+node@22.20.4/node_modules/sharp');
const out=path.resolve(__dirname,'../../public/brand-kit/subtle');
const designs=[];
const hand='M-40 190L110 190C154 180 181 148 220 143C254 139 277 151 302 168L365 203C385 214 407 220 433 219L591 218C615 218 649 221 658 230C669 241 656 252 637 253L479 251C460 252 456 262 470 271L509 294C524 304 529 316 520 326C511 335 499 331 487 325L420 291L472 333C485 344 487 357 477 364C467 370 456 364 446 357L391 317L430 356C443 371 439 381 429 385C418 389 407 380 395 370L344 327C322 309 302 301 286 308C265 318 247 341 224 358C189 385 149 393 100 386L-40 406Z';
const defs=`<linearGradient id="bg"><stop stop-color="#f4e9eb"/><stop offset=".5" stop-color="#f2dce6"/><stop offset="1" stop-color="#f4e9eb"/></linearGradient><linearGradient id="pinkbg"><stop stop-color="#efb9d2"/><stop offset=".5" stop-color="#f2c4da"/><stop offset="1" stop-color="#efb9d2"/></linearGradient><radialGradient id="aura"><stop stop-color="#fffaf8" stop-opacity=".5"/><stop offset="1" stop-color="#fffaf8" stop-opacity="0"/></radialGradient><linearGradient id="hand"><stop stop-color="#ddaac5"/><stop offset=".6" stop-color="#f2a8cd"/><stop offset="1" stop-color="#f8d4e5"/></linearGradient><linearGradient id="dark"><stop stop-color="#292329"/><stop offset=".5" stop-color="#3a2b35"/><stop offset="1" stop-color="#292329"/></linearGradient><filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="17"/></filter><clipPath id="hands"><path d="${hand}"/><path d="${hand}" transform="translate(1500 0) scale(-1 1)"/></clipPath>`;
const rect=(x,y,w,h,c,ex='')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}" ${ex}/>`;
const dot=(x,y,r,c)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`;
function add(slug,name,desc,body,bg='bg'){designs.push({slug,name,desc,svg:`<svg xmlns="http://www.w3.org/2000/svg" width="1500" height="500" viewBox="0 0 1500 500" role="img" aria-labelledby="title desc"><title id="title">${name}</title><desc id="desc">${desc}</desc><defs>${defs}</defs>${rect(0,0,1500,500,'url(#'+bg+')')}<ellipse cx="750" cy="220" rx="850" ry="420" fill="url(#aura)" opacity="${bg==='dark'?.08:.7}"/>${body}</svg>`});}
let b='';
// Rounded squares join through a softly pinched neck, echoing the first reference.
const blob='M0 15Q0 0 15 0H46Q61 0 61 15V33Q61 49 76 49H88Q102 49 102 63V81Q102 96 87 96H68Q53 96 53 81V72Q53 58 39 58H15Q0 58 0 43Z';
for(let r=-1;r<6;r++)for(let c=-1;c<16;c++)b+=`<path d="${blob}" transform="translate(${c*108} ${r*109}) rotate(${(c+r)%2?180:0} 51 48)" fill="#cb99b4" opacity=".11"/>`;
add('01-soft-connections','Soft connections','Barely visible rounded forms meet through narrow organic bridges.',b);
b='';
for(let r=-1;r<8;r++)for(let c=-1;c<30;c++){
 const wave=(Math.cos((r-3)*.65)+1)*26,x=c*59+(r%2)*27,w=8+22*(1+Math.sin(c*.38))/2;
 b+=rect(x+wave,r*73,w,73,'#b97c9e','opacity=".095"');
}
add('02-quiet-frequency','Quiet frequency','Offset vertical bars dissolve into a low-contrast optical wave.',b);
b='';
for(let r=-1;r<5;r++)for(let c=-1;c<15;c++){
 const x=c*115+(r%2)*57,y=r*137;
 b+=`<path d="M${x} ${y+115}Q${x+12} ${y+76} ${x+48} ${y+66}T${x+95} ${y+8}" fill="none" stroke="#fff3f8" stroke-width="24" stroke-linecap="round" opacity=".16"/>`;
}
add('03-common-current','Common current','Soft, linked organic strokes emerge gently from a pink field.',b,'pinkbg');
b='';
for(let r=-1;r<6;r++)for(let c=-1;c<18;c++){
 const x=c*95,y=r*102;
 b+=rect(x,y,78,78,(r+c)%3===0?'#fff9f7':'#c898b2',`rx="18" opacity="${(r+c)%3===0?.13:.07}"`);
 if((r+c)%2===0)b+=`<path d="M${x+65} ${y+65}Q${x+90} ${y+68} ${x+103} ${y+104}" fill="none" stroke="#c898b2" stroke-width="17" opacity=".07"/>`;
}
add('04-nearly-there','Nearly there','A quiet matrix of softly connected blocks, almost the same color as the background.',b);
b='';
for(let i=-3;i<24;i++){const x=i*86;b+=`<path d="M${x-90} -20C${x+170} 170 ${x-140} 320 ${x+100} 540" fill="none" stroke="${i%2?'#fff4f8':'#c794b1'}" stroke-width="${i%2?19:9}" opacity="${i%2?.15:.08}"/>`;}
add('05-under-the-surface','Under the surface','A barely perceptible woven ripple gives the pink surface depth.',b,'pinkbg');
function dots(color,opacity){let s=`<g clip-path="url(#hands)" opacity="${opacity}">`;for(let y=126;y<410;y+=8)for(let x=0;x<1500;x+=8){const r=1.05+1.15*(.5+.5*Math.sin(x*.018+y*.025));s+=dot(x,y,r,color);}return s+'</g>';}
const details=(color,opacity)=>`<g fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" opacity="${opacity}"><path d="M180 239Q247 188 309 238M286 308Q324 262 357 262M391 317L366 292M420 291L393 276"/><path d="M180 239Q247 188 309 238M286 308Q324 262 357 262M391 317L366 292M420 291L393 276" transform="translate(1500 0) scale(-1 1)"/></g>`;
b=dots('#b9789d',.37)+details('#f4e5ec',.6)+dot(750,234,7,'#e7b6ce');
add('06-almost-touching','Almost touching','Two halftone hands reach toward a shared point, softly rendered in the brand palette.',b);
b=`<g fill="url(#hand)" opacity=".17" filter="url(#glow)"><path d="${hand}"/><path d="${hand}" transform="translate(1500 0) scale(-1 1)"/></g>`+dots('#f2a8cd',.72)+details('#30252e',.65)+`<circle cx="750" cy="234" r="35" fill="#f2a8cd" opacity=".25" filter="url(#glow)"/>`+dot(750,234,7,'#f8d4e5');
add('07-a-shared-spark','A shared spark','Rose halftone hands meet around a tiny pearl spark on warm charcoal.',b,'dark');
b=`<g fill="url(#hand)" opacity=".25"><path d="${hand}"/><path d="${hand}" transform="translate(1500 0) scale(-1 1)"/></g>`+details('#ac7292',.18)+`<path d="M638 235Q750 253 862 235" fill="none" stroke="#c88dab" stroke-width="1.5" opacity=".3"/>`;
add('08-reaching-together','Reaching together','Tone-on-tone sculptural hands share a fine thread of connection.',b);
async function main(){
 await fs.mkdir(out,{recursive:true});for(const d of designs){await fs.writeFile(path.join(out,d.slug+'.svg'),d.svg);await sharp(Buffer.from(d.svg)).png().toFile(path.join(out,d.slug+'.png'));}
 const old=await fs.readFile(path.resolve(out,'../arches/index.html'),'utf8');
 await fs.writeFile(path.join(out,'index.html'),old.slice(0,old.indexOf('<main>')).replace('HAUS / Arch studies','HAUS / Subtle studies')+`<main><header><small>HAUS / SUBTLE STUDIES</small><h1>Just beneath the surface.</h1><p>01–05: barely visible abstract connections. 06–08: hands reaching together. 1500 × 500 editable SVGs.</p></header>${designs.map(d=>`<article><img src="${d.slug}.svg" alt="${d.desc}"><div class="meta"><div><h2>${d.slug.slice(0,2)} / ${d.name}</h2><p>${d.desc}</p></div><a href="${d.slug}.svg" download>SVG ↓</a><a href="${d.slug}.png" download>PNG ↓</a></div></article>`).join('')}</main></html>`);
 const layers=[];for(let i=0;i<designs.length;i++){const d=designs[i],left=25+i%2*775,top=25+Math.floor(i/2)*295;layers.push({input:await sharp(Buffer.from(d.svg)).resize(750,250).png().toBuffer(),left,top});layers.push({input:await sharp(Buffer.from(`<svg width="750" height="30"><text x="0" y="23" font-family="Arial" font-size="15" fill="#191919">${d.slug.slice(0,2)} / ${d.name}</text></svg>`)).png().toBuffer(),left,top:top+250});}
 await sharp({create:{width:1575,height:1205,channels:3,background:'#f4f0e9'}}).composite(layers).png().toFile(path.join(out,'contact-sheet.png'));console.log('Created 5 subtle patterns and 3 hands concepts.');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
