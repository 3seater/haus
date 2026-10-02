const fs=require('fs'),path=require('path');
const sharp=require('../../node_modules/.pnpm/sharp@0.35.4_@types+node@22.20.4/node_modules/sharp');
const out=path.resolve(__dirname,'../../public/brand-kit/haus-architecture');fs.mkdirSync(out,{recursive:true});
const ink='#191919',pink='#f2a8cd',pale='#f8d4e5',paper='#f4f0e9';
const poly=(points,fill)=>`<polygon points="${points}" fill="${fill}"/>`;
const pathD=(d,fill)=>`<path d="${d}" fill="${fill}"/>`;
const rect=(x,y,w,h,fill)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"/>`;
// All geometry is explicit paths/shapes so Figma imports independent editable elements.
let b=rect(0,0,1600,900,'#fff');
b+='<g id="foundation">'+poly('185,700 1160,700 1420,775 445,775',paper)+poly('445,775 1420,775 1420,798 445,798',pale)+poly('185,700 445,775 445,798 185,723',pink)+'</g>';
b+='<g id="rear-left-wall">'+poly('360,355 360,190 710,265 710,430',pale)+poly('360,190 397,173 747,248 710,265',paper)+poly('710,265 747,248 747,413 710,430',pink)+'</g>';
b+='<g id="high-black-roof">'+poly('397,173 924,124 1220,262 710,300',ink)+poly('710,300 1220,262 1220,285 710,323',pink)+'</g>';
b+='<g id="right-tower">'+poly('1100,254 1190,214 1340,263 1250,303',paper)+poly('1250,303 1340,263 1340,628 1250,677',pink);
b+=pathD('M1100 254L1250 303V677L1207 663V412C1207 365 1143 344 1143 391V642L1100 628Z',pale);
b+=pathD('M1143 642V391C1143 357 1175 358 1195 380C1159 373 1161 400 1161 421V648Z',ink)+'</g>';
b+='<g id="rear-platform">'+poly('410,450 1030,403 1225,467 604,515',paper)+poly('604,515 1225,467 1225,491 604,539',pink)+'</g>';
b+='<g id="central-arch">'+poly('624,359 666,337 1068,415 1026,437',paper)+poly('1026,437 1068,415 1068,712 1026,734',ink);
b+=pathD('M624 359L1026 437V734L947 718V567C947 449 703 402 703 520V670L624 654Z',pink);
b+=pathD('M703 670V520C703 443 806 437 883 477C792 449 736 479 736 540V678Z',pale)+'</g>';
b+='<g id="left-pavilion">'+poly('228,402 281,375 530,439 477,466',pink)+poly('477,466 530,439 530,724 477,751',pale);
b+=pathD('M228 402L477 466V751L415 735V567C415 480 290 448 290 535V703L228 687Z',ink);
b+=pathD('M290 703V535C290 485 330 475 365 493C320 490 315 523 315 552V710Z',pink)+'</g>';
b+='<g id="left-stairs">';
for(let i=0;i<6;i++){let x=425+i*38,y=521+i*33;b+=poly(`${x},${y} ${x+53},${y-25} ${x+91},${y-15} ${x+38},${y+10}`,paper)+poly(`${x},${y} ${x+38},${y+10} ${x+38},${y+43} ${x},${y+33}`,ink)+poly(`${x+38},${y+10} ${x+91},${y-15} ${x+91},${y+18} ${x+38},${y+43}`,pale);}
b+='</g>';
b+='<g id="right-staircase">';
for(let i=0;i<7;i++){let x=1051+i*37,y=493+i*33;b+=poly(`${x},${y} ${x+86},${y-39} ${x+123},${y-29} ${x+37},${y+10}`,pink)+poly(`${x},${y} ${x+37},${y+10} ${x+37},${y+43} ${x},${y+33}`,ink)+poly(`${x+37},${y+10} ${x+123},${y-29} ${x+123},${y+4} ${x+37},${y+43}`,pale);}
b+='</g>';
b+='<g id="brand-mark" transform="translate(70  sixty)"></g>';
b=b.replace('<g id="brand-mark" transform="translate(70  sixty)"></g>','<g id="haus-mark" transform="translate(66 58) scale(.14)"><path d="M22 31 195 0 150 141H302L250 282H165L178 181H136L103 282H0Z" fill="#191919"/></g>');
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900"><title>HAUS — A place to build</title>${b}</svg>`;
fs.writeFileSync(path.join(out,'haus-architecture.svg'),svg);
fs.writeFileSync(path.join(out,'index.html'),`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>HAUS — Architecture</title><style>*{box-sizing:border-box}body{margin:0;padding:32px;background:#eeeae5;color:#191919;font:14px Arial}main{max-width:1280px;margin:auto}nav{display:flex;gap:24px;align-items:center;margin-bottom:24px}strong{margin-right:auto}a{color:inherit}svg{display:block;width:100%;height:auto}p{color:#666}</style><main><nav><strong>HAUS / A PLACE TO BUILD</strong><a href="haus-architecture.svg" download>Download SVG for Figma</a><a href="haus-architecture.png" download>Download PNG</a></nav>${svg}<p>1600 × 900 · Editable vector paths and named architectural groups · No embedded images</p></main></html>`);
sharp(Buffer.from(svg)).png().toFile(path.join(out,'haus-architecture.png')).then(()=>console.log(out));
