const fs=require('node:fs/promises'),path=require('node:path');
const sharp=require('../../node_modules/.pnpm/sharp@0.35.4_@types+node@22.20.4/node_modules/sharp');
const type=require('./refined-lettering.json');
const out=path.resolve(__dirname,'../../public/brand-kit/domain-wordmarks');
const K='#191919',P='#f2a8cd';
const specs=[
 ['01-bold-haus-pink-fun','Bold Haus / pink script fun',['bold','HAUS',260,K],['scribble','.fun',330,P]],
 ['02-pink-script-haus','Pink script Haus / bold fun',['scribble','Haus',375,P],['bold','.fun',235,K]],
 ['03-pink-bold-haus','Pink bold Haus / ink script fun',['bold','HAUS',260,P],['scribble','.fun',330,K]],
 ['04-ink-script-haus','Ink script Haus / pink bold FUN',['scribble','Haus',375,K],['bold','.FUN',225,P]],
 ['05-title-case','Title-case bold Haus / pink script fun',['bold','Haus',255,K],['scribble','.fun',325,P]],
 ['06-ink-only','Script Haus / bold fun, all ink',['scribble','Haus',375,K],['bold','.fun',235,K]],
];
function layout(a,b){
 let cursor=0,ymin=Infinity,ymax=-Infinity,body='';
 for(const [family,text,h,color] of [a,b]){const t=type[family+':'+text],bb=t.bounds,s=h/(bb[3]-bb[1]);
  ymin=Math.min(ymin,bb[1]*s);ymax=Math.max(ymax,bb[3]*s);
  body+=`<path transform="translate(${cursor-bb[0]*s} 0) scale(${s})" d="${t.d}" fill="${color}"/>`;
  cursor+=(bb[2]-bb[0])*s+14;
 }
 const width=cursor-14,height=ymax-ymin,scale=Math.min(1350/width,390/height);
 return `<g transform="translate(${(1500-width*scale)/2} ${(500-height*scale)/2-ymin*scale}) scale(${scale})">${body}</g>`;
}
async function main(){
 await fs.mkdir(out,{recursive:true});const layers=[],articles=[];
 for(let i=0;i<specs.length;i++){const [slug,name,a,b]=specs[i];const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1500" height="500" viewBox="0 0 1500 500" role="img" aria-label="haus.fun"><title>${name}</title>${layout(a,b)}</svg>`;
  await fs.writeFile(path.join(out,slug+'.svg'),svg);await sharp(Buffer.from(svg)).flatten({background:'#fff'}).png().toFile(path.join(out,slug+'.png'));
  layers.push({input:await sharp(Buffer.from(svg)).resize(750,250).flatten({background:'#fff'}).png().toBuffer(),left:24+(i%2)*774,top:60+Math.floor(i/2)*287});
  layers.push({input:Buffer.from(`<svg width="750" height="25"><text x="0" y="18" font-family="Arial" font-size="13" fill="${K}">${slug.slice(0,2)} / ${name}</text></svg>`),left:24+(i%2)*774,top:315+Math.floor(i/2)*287});
  articles.push(`<article>${svg}<footer><span>${slug.slice(0,2)} / ${name}</span><a href="${slug}.svg" download>SVG ↓</a></footer></article>`);
 }
 await sharp({create:{width:1572,height:931,channels:3,background:'#eeeae7'}}).composite(layers).png().toFile(path.join(out,'contact-sheet.png'));
 await fs.writeFile(path.join(out,'index.html'),`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>haus.fun / Mixed type</title><style>*{box-sizing:border-box}body{margin:0;background:#eeeae7;color:${K};font:14px Arial,sans-serif}main{width:1548px;max-width:100%;padding:24px;margin:auto}header{margin-bottom:24px}h1{font-size:30px;font-weight:500}article{margin-bottom:24px}article>svg{display:block;background:white;width:100%;height:auto}footer{display:flex;justify-content:space-between;gap:20px;padding:12px 0}a{color:inherit}button{border:0;background:${K};color:white;font:inherit;padding:12px 16px;cursor:pointer}body.export{background:white}body.export main{padding:0;width:1500px}body.export header,body.export footer{display:none}</style></head><body><main><header><h1>haus.fun / Mixed type</h1><p>Six variations. Anton + HV SMEGS. Inline SVG paths, with transparent SVG downloads.</p><button onclick="document.body.classList.add('export')">Show artwork only for export</button></header>${articles.join('')}</main></body></html>`);
 console.log('Created six mixed-font domain wordmarks and inline SVG export page.');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
