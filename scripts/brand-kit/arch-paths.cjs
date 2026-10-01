const fs=require('node:fs/promises'),path=require('node:path');
const sharp=require('../../node_modules/.pnpm/sharp@0.35.4_@types+node@22.20.4/node_modules/sharp');
const out=path.resolve(__dirname,'../../public/brand-kit/arch-paths');
const designs=[];
const defs=`<linearGradient id="bg"><stop stop-color="#f4f0e9"/><stop offset=".5" stop-color="#f8d4e5"/><stop offset="1" stop-color="#f4f0e9"/></linearGradient><linearGradient id="rose" x1="0" y1="0" x2=".8" y2="1"><stop stop-color="#fffaf8"/><stop offset=".4" stop-color="#f8d4e5"/><stop offset=".7" stop-color="#f2a8cd"/><stop offset="1" stop-color="#b96991"/></linearGradient><linearGradient id="pearl" x1="0" y1="0" x2="1" y2=".85"><stop stop-color="#fffaf8"/><stop offset=".5" stop-color="#f8d4e5"/><stop offset="1" stop-color="#d892b6"/></linearGradient><radialGradient id="aura"><stop stop-color="#fffaf8" stop-opacity=".7"/><stop offset="1" stop-color="#f2a8cd" stop-opacity="0"/></radialGradient><filter id="shadow" x="-30%" y="-40%" width="160%" height="180%"><feDropShadow dx="0" dy="7" stdDeviation="9" flood-color="#915772" flood-opacity=".23"/></filter>`;
// Filled arch silhouettes: outer layers remain visible as the openings recede.
function nest(cx,cy,rx,ry,n,stepX,stepY,bottom=550){
 let s='';
 for(let k=0;k<n;k++){
  const x=rx-k*stepX,y=ry-k*stepY;
  s+=`<path d="M${cx-x} ${bottom}V${cy}A${x} ${y} 0 0 1 ${cx+x} ${cy}V${bottom}Z" fill="url(#${k%2?'pearl':'rose'})" filter="url(#shadow)"/>`;
 }
 return s;
}
function bands(cx,cy,rx,ry,n,stepX,stepY,width,bottom=550){
 let s='';
 for(let k=0;k<n;k++){
  const x=rx-k*stepX,y=ry-k*stepY;
  s+=`<path d="M${cx-x} ${bottom}V${cy}A${x} ${y} 0 0 1 ${cx+x} ${cy}V${bottom}" fill="none" stroke="url(#rose)" stroke-width="${width}" filter="url(#shadow)"/>`;
 }
 return s;
}
function add(slug,name,desc,body){designs.push({slug,name,desc,svg:`<svg xmlns="http://www.w3.org/2000/svg" width="1500" height="500" viewBox="0 0 1500 500" role="img" aria-labelledby="title desc"><title id="title">${name}</title><desc id="desc">${desc}</desc><defs>${defs}</defs><rect width="1500" height="500" fill="url(#bg)"/>${body}<ellipse cx="650" cy="135" rx="1000" ry="470" fill="url(#aura)" opacity=".33"/></svg>`});}
add('01-wide-open','Wide open','One wide, low arch with five softly receding layers.',nest(750,410,730,365,6,93,47));
add('02-low-horizon','Low horizon','Extra-shallow arches stretch beyond both sides of the banner.',nest(750,555,1140,515,8,93,45));
add('03-three-doorways','Three doorways','Three enlarged versions of the original rounded arch, filling the frame.',[250,750,1250].map(x=>nest(x,225,250,245,5,43,39)).join(''));
add('04-one-vault','One vault','A close crop of one monumental arch, with almost no empty space.',nest(750,495,1040,660,9,91,63));
add('05-broad-paths','Broad paths','Separated arch paths with a wide span and shallow rise.',bands(750,330,730,280,5,92,47,48));
add('06-double-span','Double span','Two wide, shallow openings sit side by side, cropped at the edges.',[365,1135].map(x=>nest(x,345,410,275,6,56,37)).join(''));
add('07-long-arc','Long arc','A single family of extremely broad curves sweeps across the full banner.',nest(750,930,1600,1060,9,110,89));
add('08-tall-soft-portals','Tall soft portals','Tall elliptical arches create deeper openings, tightly framed.',[0,500,1000,1500].map(x=>nest(x,385,250,440,5,44,68)).join(''));

async function main(){
 await fs.mkdir(out,{recursive:true});
 for(const d of designs){await fs.writeFile(path.join(out,d.slug+'.svg'),d.svg);await sharp(Buffer.from(d.svg)).png().toFile(path.join(out,d.slug+'.png'));}
 const previous=await fs.readFile(path.resolve(out,'../arches/index.html'),'utf8');
 const header=previous.slice(0,previous.indexOf('<main>')).replace('HAUS / Arch studies','HAUS / Arch paths');
 await fs.writeFile(path.join(out,'index.html'),header+`<main><header><small>HAUS / ARCH PATHS</small><h1>Let the arch fill the frame.</h1><p>Eight studies in width, height, depth, and crop. The same soft pink light throughout.</p><p>1500 × 500 · Editable SVG + PNG</p></header>${designs.map(d=>`<article><img src="${d.slug}.svg" alt="${d.desc}"><div class="meta"><div><h2>${d.slug.slice(0,2)} / ${d.name}</h2><p>${d.desc}</p></div><a href="${d.slug}.svg" download>SVG ↓</a><a href="${d.slug}.png" download>PNG ↓</a></div></article>`).join('')}</main></html>`);
 const layers=[];
 for(let i=0;i<designs.length;i++){
  const d=designs[i],left=25+i%2*775,top=25+Math.floor(i/2)*295;
  layers.push({input:await sharp(Buffer.from(d.svg)).resize(750,250).png().toBuffer(),left,top});
  layers.push({input:await sharp(Buffer.from(`<svg width="750" height="30"><text x="0" y="23" font-family="Arial" font-size="15" fill="#191919">${d.slug.slice(0,2)} / ${d.name}</text></svg>`)).png().toBuffer(),left,top:top+250});
 }
 await sharp({create:{width:1575,height:1205,channels:3,background:'#f4f0e9'}}).composite(layers).png().toFile(path.join(out,'contact-sheet.png'));
 console.log('Created eight arch path variations, SVGs, PNGs, gallery, and comparison sheet.');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
