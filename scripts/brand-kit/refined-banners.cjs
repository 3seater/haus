const inlineSvg=require('./inline-svg.cjs');
const fs=require('node:fs/promises'),path=require('node:path');
const sharp=require('../../node_modules/.pnpm/sharp@0.35.4_@types+node@22.20.4/node_modules/sharp');
const type=require('./refined-lettering.json');
const out=path.resolve(__dirname,'../../public/brand-kit/refined-type');
const P='#f2a8cd',L='#f8d4e5',W='#f4f0e9',K='#191919';
const rect=c=>`<rect width="1500" height="500" fill="${c}"/>`;
function word(f,t,x,y,w,h,fill,stroke='none',sw=0,opacity=1){const a=type[f+':'+t],b=a.bounds,s=Math.min(w/(b[2]-b[0]),h/(b[3]-b[1]));return `<g opacity="${opacity}" transform="translate(${x+(w-(b[2]-b[0])*s)/2} ${y+(h-(b[3]-b[1])*s)/2}) scale(${s}) translate(${-b[0]} ${-b[1]})"><path d="${a.d}" fill="${fill}" stroke="${stroke}" stroke-width="${sw/s}" stroke-linejoin="round"/></g>`;}
const defs=`<defs><linearGradient id="rose"><stop stop-color="${P}"/><stop offset="1" stop-color="${L}"/></linearGradient><linearGradient id="paper"><stop stop-color="${W}"/><stop offset="1" stop-color="${L}"/></linearGradient></defs>`;
const designs=[];
function add(name,font,desc,body){const slug=String(designs.length+1).padStart(2,'0')+'-'+name.toLowerCase().replaceAll(' ','-');designs.push({slug,name,desc,font,svg:`<svg xmlns="http://www.w3.org/2000/svg" width="1500" height="500" viewBox="0 0 1500 500"><title>Haus / ${name}</title><desc>${desc}. ${font}, outlined from the original font.</desc>${defs}${body}</svg>`});}
let b=rect(K)+word('scribble','Haus',140,53,1220,395,'none',P,1.25,.32)+word('scribble','Haus',114,43,1220,395,'url(#rose)');
add('Quiet Echo','HV SMEGS Style 1','One faint outline echo behind soft pink lettering',b);
b=rect(W);for(let r=0;r<3;r++)for(let c=-1;c<4;c++)b+=word('scribble','Haus',c*465+(r%2)*205,r*169-9,440,145,r===1?P:'none',r===1?'none':K,1,r===1?1:.25);
add('In Good Company','HV SMEGS Style 1','A quiet repeating pattern with one pink row',b);
b=rect(W)+word('scribble','we are',65,35,1040,188,K)+word('scribble','the devs.',185,250,1240,205,K)+word('scribble','Haus',1138,80,300,116,P);
add('The Community','HV SMEGS Style 1','The handwritten manifesto, stripped down to type alone',b);
b=rect('url(#paper)')+word('scribble','Haus',100,44,1300,397,K);
add('Warm Signature','HV SMEGS Style 1','An ink signature on a very soft paper-to-blush gradient',b);
b=rect(K)+word('scribble','Haus',110,43,1280,363,'none',P,1.6,.78)+word('scribble','built by us.',900,403,480,55,L);
add('Soft Outline','HV SMEGS Style 1','A single fine pink outline with a small handwritten signature',b);
b=rect(P)+word('bold','Haus',120,52,1260,388,K);
add('Pink Standard','Anton','Solid Anton lettering on flat brand pink',b);
b=rect(K)+word('bold','Haus',133,60,1260,380,'none',P,1,.28)+word('bold','Haus',116,48,1260,380,'url(#rose)');
add('Low Echo','Anton','One restrained offset contour behind a soft pink wordmark',b);
b=rect(W);for(let r=0;r<3;r++)for(let c=-1;c<5;c++)b+=word('bold','Haus',c*365+(r%2)*182,r*174-15,337,151,r===1?P:'none',r===1?'none':K,1,r===1?1:.20);
add('Together In Type','Anton','An orderly repeat with a pink center row and pale outlines',b);
b=rect(K)+word('bold','WE ARE',72,43,1000,174,W)+word('bold','THE DEVS.',195,260,1220,198,P)+word('bold','Haus',1155,95,235,104,W);
add('We Are The Devs','Anton','A two-line bold manifesto in warm paper and pink',b);
b=rect('url(#paper)')+word('bold','Haus',105,43,1290,352,'none',K,1.5,.8)+word('bold','BUILT BY US.',975,420,375,37,K);
add('Paper Outline','Anton','Fine ink contours on a subtle paper-to-pink field',b);

async function main(){await fs.mkdir(out,{recursive:true});const layers=[];for(let i=0;i<designs.length;i++){const d=designs[i];await fs.writeFile(path.join(out,d.slug+'.svg'),d.svg);await sharp(Buffer.from(d.svg)).png().toFile(path.join(out,d.slug+'.png'));const x=24+(i%2)*774,y=70+Math.floor(i/2)*292;layers.push({input:await sharp(Buffer.from(d.svg)).resize(750,250).png().toBuffer(),left:x,top:y});layers.push({input:Buffer.from(`<svg width="750" height="24"><text x="0" y="18" font-family="Arial" font-size="14" fill="${W}">${String(i+1).padStart(2,'0')} / ${d.name}</text></svg>`),left:x,top:y+256});}layers.push({input:Buffer.from(`<svg width="1500" height="40"><text x="0" y="27" font-family="Arial" font-size="23" fill="${P}">HAUS / TYPE ONLY</text></svg>`),left:24,top:16});await sharp({create:{width:1572,height:1540,channels:3,background:K}}).composite(layers).png().toFile(path.join(out,'contact-sheet.png'));await fs.writeFile(path.join(out,'index.html'),`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Haus / Type only</title><style>*{box-sizing:border-box}body{margin:0;background:${K};color:${W};font:15px Arial,sans-serif}main{max-width:1548px;margin:auto;padding:40px 24px}h1{font-size:42px;letter-spacing:-2px;margin:10px 0}header{margin-bottom:35px}header p{color:${P}}article{margin:0 0 40px}article>svg{display:block;width:100%;height:auto}.meta{display:flex;gap:12px;align-items:center;padding:15px 0}.meta div{flex:1}h2{font-size:18px;margin:0 0 5px}p{margin:0;font-size:13px;line-height:1.5;color:#c5bebf}a{color:${P};padding:9px 14px;border:1px solid #72646c;text-decoration:none}a:hover{background:${P};color:${K}}@media(max-width:600px){.meta{flex-wrap:wrap}.meta div{flex-basis:100%}}</style><main><header><small>HAUS / VOL. 02</small><h1>Only type.</h1><p>01–05 HV SMEGS · 06–10 Anton · 1500 × 500 · PNG + outlined SVG</p></header>${designs.map(d=>`<article>${inlineSvg(d)}<div class="meta"><div><h2>${d.slug.slice(0,2)} / ${d.name}</h2><p>${d.desc}</p></div><a download href="${d.slug}.png">PNG ↓</a><a download href="${d.slug}.svg">SVG ↓</a></div></article>`).join('')}</main></html>`);console.log('Created 10 PNGs, 10 outlined SVGs, gallery and contact sheet.');}
main().catch(e=>{console.error(e);process.exitCode=1;});
