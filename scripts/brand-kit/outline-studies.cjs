const fs=require('node:fs/promises'),path=require('node:path');
const sharp=require('../../node_modules/.pnpm/sharp@0.35.4_@types+node@22.20.4/node_modules/sharp');
const out=path.resolve(__dirname,'../../public/brand-kit/outlines');
const designs=[];
const H='M22 31 195 0 150 141H302L250 282H165L178 181H136L103 282H0Z';
const grad=(colors)=>`<linearGradient id="bg" x2="1" y2=".45">${colors.map((c,i)=>`<stop offset="${i/(colors.length-1)}" stop-color="${c}"/>`).join('')}</linearGradient>`;
function add(slug,name,desc,colors,body){designs.push({slug,name,desc,svg:`<svg xmlns="http://www.w3.org/2000/svg" width="1500" height="500" viewBox="0 0 1500 500" role="img" aria-labelledby="title desc"><title id="title">${name}</title><desc id="desc">${desc}</desc><defs>${grad(colors)}</defs><rect width="1500" height="500" fill="url(#bg)"/>${body}</svg>`});}
add('01-silent-monogram','Silent monogram','A single enormous HAUS contour, centered and cropped into a quiet graphite field.',['#69646b','#706971','#625e66'],`<g transform="translate(173 -286) scale(3.82)"><path d="${H}" fill="none" stroke="#ead9e4" stroke-width=".18" opacity=".4"/></g>`);
let b='<g fill="none" stroke="#fff7fc" stroke-width=".8" opacity=".48">';
for(const [x,y,r,angle] of [[325,240,425,-22],[745,250,475,15],[1190,235,425,-22]])b+=`<ellipse cx="${x}" cy="${y}" rx="${r}" ry="172" transform="rotate(${angle} ${x} ${y})"/>`;
b+='</g>';
add('02-shared-orbits','Shared orbits','Three fine elliptical loops overlap across a soft blush gradient.',['#f8e7ef','#efbad5','#df9fc2'],b);
b='<g fill="none" stroke="#b786a1" stroke-width=".75" opacity=".29">';
for(let i=0;i<5;i++){const r=960-i*120,ry=580-i*78;b+=`<path d="M${750-r} 620V480A${r} ${ry} 0 0 1 ${750+r} 480V620"/>`;}
b+='</g>';
add('03-open-contours','Open contours','Wide architectural outlines stretch beyond the edges of warm pearl.',['#f4eeec','#f3e1eb','#eddce6'],b);
b='<g fill="none" stroke="#fff6fc" stroke-width=".85" opacity=".45">';
for(const [x,y,a] of [[235,215,-30],[750,275,30],[1265,215,-30]])b+=`<rect x="${x-350}" y="${y-155}" width="700" height="310" rx="115" transform="rotate(${a} ${x} ${y})"/>`;
b+='</g>';
add('04-common-links','Common links','Oversized rounded rectangular links overlap like a barely visible chain.',['#e7b0cc','#edc3d8','#e3a7c8'],b);
b='<g fill="none" stroke="#e9cedf" stroke-width=".75" opacity=".3"><path d="M-90 380L270 130L680 330L1080 95L1580 350M-90 380L680 330L1580 350M270 130L1080 95M270 130L540 -70M680 330L820 580M1080 95L1340 -80"/>';
for(const [x,y,r] of [[270,130,36],[680,330,55],[1080,95,36]])b+=`<circle cx="${x}" cy="${y}" r="${r}"/>`;
b+='</g>';
add('05-invisible-network','Invisible network','Sparse nodes and long connecting lines quietly imply a shared network.',['#706873','#827381','#685f6e'],b);
async function main(){
 await fs.mkdir(out,{recursive:true});for(const d of designs){await fs.writeFile(path.join(out,d.slug+'.svg'),d.svg);await sharp(Buffer.from(d.svg)).resize(3000,1000).png().toFile(path.join(out,d.slug+'.png'));}
 const prev=await fs.readFile(path.resolve(out,'../arches/index.html'),'utf8');
 await fs.writeFile(path.join(out,'index.html'),prev.slice(0,prev.indexOf('<main>')).replace('HAUS / Arch studies','HAUS / Quiet outlines')+`<main><header><small>HAUS / QUIET OUTLINES</small><h1>Almost a whisper.</h1><p>Five different compositions. Hairline outlines, minimal contrast, muted grey and blush. Editable SVG + 3000 × 1000 PNG.</p></header>${designs.map(d=>`<article><img src="${d.slug}.svg" alt="${d.desc}"><div class="meta"><div><h2>${d.slug.slice(0,2)} / ${d.name}</h2><p>${d.desc}</p></div><a href="${d.slug}.svg" download>SVG ↓</a><a href="${d.slug}.png" download>PNG ↓</a></div></article>`).join('')}</main></html>`);
 const layers=[];for(let i=0;i<designs.length;i++){const d=designs[i],top=20+i*370;layers.push({input:await sharp(Buffer.from(d.svg)).resize(990,330).png().toBuffer(),left:20,top});layers.push({input:await sharp(Buffer.from(`<svg width="990" height="30"><text x="0" y="22" font-family="Arial" font-size="14" fill="#191919">${d.slug.slice(0,2)} / ${d.name}</text></svg>`)).png().toBuffer(),left:20,top:top+330});}
 await sharp({create:{width:1030,height:1870,channels:3,background:'#f4f0e9'}}).composite(layers).png().toFile(path.join(out,'contact-sheet.png'));console.log('Created five outline studies, SVGs, PNGs and gallery.');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
