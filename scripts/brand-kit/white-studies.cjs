const fs=require('node:fs/promises'),path=require('node:path');
const sharp=require('../../node_modules/.pnpm/sharp@0.35.4_@types+node@22.20.4/node_modules/sharp');
const inlineSvg=require('./inline-svg.cjs'),type=require('./refined-lettering.json');
const out=path.resolve(__dirname,'../../public/brand-kit/white-studies');
const P='#f2a8cd',L='#f8d4e5',K='#191919',W='#ffffff';
const circle=(x,y,r,c,stroke='none',sw=1)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" stroke="${stroke}" stroke-width="${sw}"/>`;
const line=(d,c=K,sw=1.5,opacity=1)=>`<path d="${d}" fill="none" stroke="${c}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" opacity="${opacity}"/>`;
const shape=(d,c,stroke='none',sw=1)=>`<path d="${d}" fill="${c}" stroke="${stroke}" stroke-width="${sw}"/>`;
const group=(body,x,y,angle=0)=>`<g transform="translate(${x} ${y}) rotate(${angle})">${body}</g>`;
const opacity=(body,o)=>`<g opacity="${o}">${body}</g>`;
function word(t,x,y,w,h,fill=K,f='scribble',stroke='none',sw=0){let a=type[f+':'+t],b=a.bounds,s=Math.min(w/(b[2]-b[0]),h/(b[3]-b[1]));return `<g transform="translate(${x+(w-(b[2]-b[0])*s)/2} ${y+(h-(b[3]-b[1])*s)/2}) scale(${s}) translate(${-b[0]} ${-b[1]})"><path d="${a.d}" fill="${fill}" stroke="${stroke}" stroke-width="${sw/s}" stroke-linejoin="round"/></g>`;}
function person(x,y,s,c=K){return group(circle(0,-17*s,8*s,c)+shape(`M${-15*s} ${20*s}V0Q0 ${-16*s} ${15*s} 0V${20*s}Z`,c),x,y);}
const designs=[];
const defs=`<defs><linearGradient id="pink"><stop stop-color="${P}"/><stop offset="1" stop-color="${L}"/></linearGradient></defs>`;
function add(name,desc,body,kind){let slug=String(designs.length+1).padStart(2,'0')+'-'+name.toLowerCase().replaceAll(' ','-');designs.push({name,desc,slug,kind,svg:`<svg xmlns="http://www.w3.org/2000/svg" width="1500" height="500" viewBox="0 0 1500 500"><title>Haus / ${name}</title><desc>${desc}</desc>${defs}<rect width="1500" height="500" fill="${W}"/>${body}</svg>`});}
// 01–08: typographic studies. Exact original font paths, never raster text.
add('Pink Undertone','An ink signature with one restrained pink contour.',word('Haus',104,49,1280,390,'none','scribble',P,2)+word('Haus',88,41,1280,390,K),'Type');
add('Build Your Haus','A two-line handwritten invitation with a large pink Haus.',word('build your',75,34,1030,186,K)+word('Haus',530,208,850,253,P),'Type');
add('Made Personal','Bold architectural type paired with the handwritten Haus.',word('BUILD YOUR',110,157,685,195,K,'bold')+group(word('Haus',0,0,640,320,P),770,78,-7),'Type');
let b='';for(let r=0;r<3;r++)for(let c=-1;c<4;c++)b+=opacity(word('Haus',c*480+(r%2)*230,r*167-8,445,149,r===1&&c===1?P:'none','scribble',r===1&&c===1?'none':K,1.2),r===1&&c===1?1:.24);add('One Of Us','A field of outlined signatures, with one holder in pink.',b,'Type');
add('We Are The Devs','An expansive handwritten statement and small pink Haus signature.',word('we are',85,27,1020,193,K)+word('the devs.',210,255,1190,211,K)+word('Haus',1155,81,280,107,P),'Type');
add('Your Coin Our Haus','Two handwritten voices meet across the white page.',word('your coin.',50,54,900,154,K)+word('our Haus.',538,244,902,209,P),'Type');
b=word('Haus',178,28,1120,370,'none','scribble',K,1.8)+word('built by us.',940,383,485,72,P);add('Signed By Everyone','Airy ink contours and a small pink handwritten signature.',b,'Type');
b=circle(785,240,176,L)+word('together.',78,123,1344,264,K);add('Common Feeling','One soft pink disk grounds a broad handwritten together.',b,'Type + form');
// 09: clustered bubble map, no dashboard labels.
const nodes=[[750,246,73,P],[615,152,48,W],[585,290,56,W],[910,153,60,W],[926,328,53,L],[434,205,34,W],[439,342,44,W],[1077,226,41,W],[1104,362,32,W],[305,133,27,L],[274,300,37,W],[1205,127,29,W],[1280,295,36,L],[770,77,25,W],[749,419,28,W]];
b='';for(const [a,z] of [[0,1],[0,2],[0,3],[0,4],[1,5],[2,6],[3,7],[4,8],[5,9],[6,10],[7,11],[8,12],[1,13],[4,14],[5,10],[7,12]])b+=line(`M${nodes[a][0]} ${nodes[a][1]}L${nodes[z][0]} ${nodes[z][1]}`,K,1.2,.45);
nodes.forEach(([x,y,r,c],i)=>{b+=circle(x,y,r,c,K,1.5);if(i%3===0)b+=circle(x,y,r*.64,'none',i===0?K:P,1);});
add('Holder Atlas','A loose bubble map gathers independent holders around a shared center.',b,'Graphic');
// 10: winding network of people, woven rather than a rigid org chart.
const people=[[190,182],[335,335],[472,145],[602,300],[768,102],[833,362],[974,215],[1152,120],[1284,320]];
b='';for(const [i,j] of [[0,1],[0,2],[1,3],[2,3],[2,4],[3,5],[3,6],[4,6],[4,7],[5,6],[5,8],[6,7],[6,8],[7,8]]){let a=people[i],z=people[j];b+=line(`M${a[0]} ${a[1]}C${a[0]+100} ${a[1]-70} ${z[0]-100} ${z[1]+70} ${z[0]} ${z[1]}`,i%3===0?P:K,i%3===0?2.5:1.2,.72);}
people.forEach(([x,y],i)=>{b+=circle(x,y,39,W)+person(x,y,1.15,i===3||i===6?P:K);});add('The People Are The Network','People form the nodes of an open, softly curving network.',b,'Graphic');
// 11: distributed points gather into a house-shaped constellation.
b='';for(let row=0;row<10;row++)for(let col=0;col<35;col++){let x=87+col*39,y=50+row*44;const home=x>485&&x<1015&&y>80+Math.abs(x-750)*.48&&y<451;const door=x>714&&x<786&&y>296;let r=home&&!door?8:2.4;b+=circle(x,y,r,home&&!door?(col%5===0?P:K):L);}
add('A Home Made Of Holders','Many individual points resolve into one shared home.',b,'Graphic');
// 12: many strands converge into an open threshold.
b='';for(let i=0;i<21;i++){let y=22+i*23;b+=line(`M70 ${y}C310 ${y} 370 ${134+i*11} 612 ${134+i*11}H887C1105 ${134+i*11} 1200 ${y} 1430 ${y}`,i%5===0?P:K,i%5===0?2.6:1.2,.86);}
add('Common Thread','Twenty-one independent strands gather into a shared passage.',b,'Graphic');
// 13: an organic fingerprint composed of nonidentical oval contours.
b='';for(let i=0;i<23;i++){let rx=560-i*20,ry=201-i*7.5;b+=`<ellipse cx="${750+Math.sin(i*.23)*21}" cy="${250+Math.cos(i*.3)*7}" rx="${rx}" ry="${ry}" transform="rotate(${i*.19-4} 750 250)" fill="none" stroke="${i%6===0?P:K}" stroke-width="${i%6===0?2.2:1.1}"/>`;}
add('Collective Fingerprint','A shared identity takes shape through concentric ink and pink contours.',b,'Graphic');
// 14: quiet architectural assembly with one pink door.
b='';for(let i=0;i<9;i++){let x=149+i*130,y=112+Math.abs(i-4)*19,h=310-Math.abs(i-4)*19;b+=shape(`M${x} ${y+h}V${y+53}Q${x+53} ${y-20} ${x+106} ${y+53}V${y+h}Z`,i===4?P:'none',i===4?'none':K,1.5);}
add('Room For Everyone','Nine open rooms make one shared architectural rhythm.',b,'Graphic');
// 15: orbiting paper-thin circles create a flower / communal center.
b='';for(let i=0;i<18;i++){const a=i*20;b+=`<ellipse cx="865" cy="250" rx="300" ry="87" fill="none" stroke="${i%6===0?P:K}" stroke-width="${i%6===0?2.4:1.1}" transform="translate(750 250) scale(1 .52) rotate(${a}) translate(-750 -250)"/>`;}
b+=circle(750,250,22,P);add('Around The Same Idea','Eighteen intersecting orbits hold one pink center.',b,'Graphic');
// 16: interlocking chain, separated by white knockouts to read as over / under.
b='';for(let i=0;i<6;i++){let x=135+i*215;b+=`<ellipse cx="${x+95}" cy="250" rx="139" ry="98" fill="none" stroke="${i===3?P:K}" stroke-width="13" transform="rotate(${i%2?22:-22} ${x+95} 250)"/>`;}
add('Stronger In Common','Oversized interlocking ink loops with one pink link.',b,'Graphic');
// 17: a woven fabric, gentle vertical and horizontal bends.
b='';for(let i=0;i<16;i++){let y=92+i*21;b+=line(`M145 ${y}C510 ${y-64} 875 ${y+68} 1355 ${y}`,K,1.2,.8);}for(let i=0;i<32;i++){let x=170+i*37;b+=line(`M${x} 68C${x+80} 188 ${x-82} 310 ${x+15} 438`,i>12&&i<20?P:K,i>12&&i<20?2.4:1,.8);}
add('Social Fabric','Pink threads weave through an open ink fabric.',b,'Graphic');
// 18: collective typographic architecture, crowd built from tiny people.
b='';for(let row=0;row<5;row++)for(let col=0;col<24;col++){let x=140+col*53,y=87+row*79,rad=Math.hypot((x-750)/1.5,y-250);if(rad<385)b+=person(x,y,.68,(row+col)%11===0?P:K);}add('No Spectators','A dense, gently rounded gathering of people, each an active part of the whole.',b,'Graphic');
// 19: broad arch pathways joining separate foundations.
b='';for(let i=0;i<12;i++){let dx=i*17;b+=line(`M${219+dx} 450V244C${219+dx} ${35+i*9} ${1281-dx} ${35+i*9} ${1281-dx} 244V450`,i===5||i===6?P:K,i===5||i===6?3:1.3);}b+=circle(750,311,32,P);add('Under One Roof','Separate paths become one protective arch over a shared pink center.',b,'Graphic');
// 20: organic communal bubbles with a wordmark occupying the central clearing.
b='';for(let i=0;i<16;i++){let a=i*Math.PI*2/16,x=750+590*Math.cos(a),y=250+170*Math.sin(a),r=20+(i%4)*10;b+=circle(x,y,r,i%5===0?P:'none',i%5===0?'none':K,1.3);const na=(i+1)*Math.PI*2/16;b+=line(`M${x+Math.cos(na)*r} ${y}Q750 250 ${750+590*Math.cos(na)} ${250+170*Math.sin(na)}`,K,.75,.24);}
b+=word('Haus',422,124,656,250,K);add('The Gathering','A handwritten Haus sits inside an organic circle of connected holders.',b,'Type + graphic');

async function main(){
 await fs.mkdir(out,{recursive:true});
 const layers=[];
 for(let i=0;i<designs.length;i++){
  const d=designs[i];await fs.writeFile(path.join(out,d.slug+'.svg'),d.svg);await sharp(Buffer.from(d.svg)).png().toFile(path.join(out,d.slug+'.png'));
  const x=24+(i%2)*774,y=82+Math.floor(i/2)*292;
  layers.push({input:await sharp(Buffer.from(d.svg)).resize(750,250).png().toBuffer(),left:x,top:y});
  layers.push({input:Buffer.from(`<svg width="750" height="26"><text x="0" y="19" font-family="Arial" font-size="14" fill="${K}">${d.slug.slice(0,2)} / ${d.name}</text></svg>`),left:x,top:y+253});
 }
 layers.push({input:Buffer.from(`<svg width="1500" height="45"><text x="0" y="30" font-family="Arial" font-size="24" fill="${K}">HAUS / WHITE STUDIES — 20 EXPRESSIONS OF COLLECTIVE OWNERSHIP</text></svg>`),left:24,top:20});
 await sharp({create:{width:1572,height:3010,channels:3,background:'#eeeae7'}}).composite(layers).png().toFile(path.join(out,'contact-sheet.png'));
 const articles=designs.map(d=>`<article id="${d.slug}" data-name="${d.slug} / ${d.name}">${inlineSvg(d)}<div class="meta"><div><h2>${d.slug.slice(0,2)} / ${d.name}</h2><p>${d.desc}</p></div><span>${d.kind}</span><a download href="${d.slug}.svg">SVG ↓</a><a download href="${d.slug}.png">PNG ↓</a></div></article>`).join('');
 await fs.writeFile(path.join(out,'index.html'),`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Haus / White studies</title><style>*{box-sizing:border-box}body{margin:0;background:#eeeae7;color:${K};font:14px Arial,sans-serif}main{width:1548px;max-width:100%;padding:36px 24px;margin:auto}header{margin-bottom:32px}h1{font-size:44px;font-weight:500;letter-spacing:-2px;margin:10px 0}header p{line-height:1.6;color:#5a5356}article{margin-bottom:32px}article>svg{display:block;width:100%;height:auto;aspect-ratio:3/1}.meta{display:flex;align-items:center;gap:16px;padding:14px 0}.meta div{flex:1}h2{font-size:16px;margin:0 0 6px;font-weight:500}p{margin:0;line-height:1.5;font-size:13px}.meta span{color:#686065;font-size:11px}a{color:inherit;text-decoration:none;border-bottom:1px solid #a3969c;padding:7px 0;white-space:nowrap}body.artwork-only{background:white}body.artwork-only main{padding:0;width:1500px}body.artwork-only header,body.artwork-only .meta{display:none}body.artwork-only article{margin-bottom:24px}button{font:inherit;background:${K};color:white;border:0;padding:11px 16px;cursor:pointer;margin-top:14px}@media(max-width:650px){.meta{flex-wrap:wrap}.meta div{flex-basis:100%}h1{font-size:32px}}</style></head><body><main><header><small>HAUS / WHITE STUDIES</small><h1>A house is made of us.</h1><p>20 white-background banner studies · 1500 × 500 · Ink + brand pink · Inline SVG artwork</p><button onclick="document.body.classList.toggle('artwork-only')">Show artwork only for export</button></header>${articles}</main></body></html>`);
 await fs.writeFile(path.join(out,'manifest.json'),JSON.stringify(designs.map(({name,desc,slug,kind})=>({name,desc,slug,kind,width:1500,height:500})),null,2));
 console.log('Created 20 vector banners, PNG exports, a contact sheet and one inline-SVG gallery.');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
