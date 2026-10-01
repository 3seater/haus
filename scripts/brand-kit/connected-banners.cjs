const fs=require('node:fs/promises'),path=require('node:path');
const sharp=require('../../node_modules/.pnpm/sharp@0.35.4_@types+node@22.20.4/node_modules/sharp');
const out=path.resolve(__dirname,'../../public/brand-kit/connected');
const designs=[];
const defs=`<linearGradient id="bg"><stop stop-color="#f4f0e9"/><stop offset=".5" stop-color="#f8d4e5"/><stop offset="1" stop-color="#f4f0e9"/></linearGradient><linearGradient id="pearl" x2=".85" y2="1"><stop stop-color="#fffaf8"/><stop offset=".52" stop-color="#f8d4e5"/><stop offset="1" stop-color="#d892b6"/></linearGradient><linearGradient id="rose" x2=".8" y2="1"><stop stop-color="#fff3f8"/><stop offset=".42" stop-color="#f2a8cd"/><stop offset="1" stop-color="#b96991"/></linearGradient><linearGradient id="ink" x2="1" y2="1"><stop stop-color="#51404c"/><stop offset="1" stop-color="#191719"/></linearGradient><linearGradient id="wire" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1500" y2="0"><stop stop-color="#ca91af" stop-opacity=".15"/><stop offset=".3" stop-color="#b96991"/><stop offset=".7" stop-color="#b96991"/><stop offset="1" stop-color="#ca91af" stop-opacity=".15"/></linearGradient><radialGradient id="aura"><stop stop-color="#fffaf8" stop-opacity=".85"/><stop offset=".6" stop-color="#f2a8cd" stop-opacity=".28"/><stop offset="1" stop-color="#f2a8cd" stop-opacity="0"/></radialGradient><filter id="shadow" x="-50%" y="-50%" width="200%" height="220%"><feDropShadow dx="0" dy="10" stdDeviation="14" flood-color="#915772" flood-opacity=".22"/></filter><filter id="glow" x="-50%" y="-100%" width="200%" height="300%"><feGaussianBlur stdDeviation="9"/></filter>`;
const H='M22 31 195 0 150 141H302L250 282H165L178 181H136L103 282H0Z';
const mark=(x,y,size)=>`<g transform="translate(${x-size/2} ${y-size*.467}) scale(${size/302})"><path d="${H}" fill="#f8d4e5"/></g>`;
const wire=(d,w=2)=>`<path d="${d}" fill="none" stroke="url(#wire)" stroke-width="${w}"/>`;
const people=(x,y,s=1,c='#80556f')=>`<g transform="translate(${x} ${y}) scale(${s})" fill="none" stroke="${c}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="-4" cy="-7" r="5"/><path d="M-15 12V7Q-15 1-9 1H1Q7 1 7 7V12M6 -12Q14 -12 14 -6Q14 -1 10 0M13 3Q20 3 20 9V12"/></g>`;
const dot=(x,y,r=7)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="url(#rose)" stroke="#fff8fa" stroke-width="1"/>`;
function tile(x,y,size=88,type='people',dark=false){return `<g filter="url(#shadow)"><rect x="${x-size/2}" y="${y-size/2}" width="${size}" height="${size}" rx="${size*.12}" fill="url(#${dark?'ink':'pearl'})" stroke="${dark?'#927185':'#fff8fa'}" stroke-width="1"/></g>${type==='mark'?mark(x,y,size*.62):type==='people'?people(x,y,size/64):dot(x,y,size*.12)}`;}
function arch(cx,cy,rx,ry,n=4,opacity=.4){let s=`<g opacity="${opacity}">`;for(let i=0;i<n;i++){const x=rx-i*55,y=ry-i*38;s+=`<path d="M${cx-x} 560V${cy}A${x} ${y} 0 0 1 ${cx+x} ${cy}V560" fill="none" stroke="url(#rose)" stroke-width="30"/>`;}return s+'</g>';}
function add(slug,name,desc,body,dark=false){designs.push({slug,name,desc,svg:`<svg xmlns="http://www.w3.org/2000/svg" width="1500" height="500" viewBox="0 0 1500 500" role="img" aria-labelledby="title desc"><title id="title">${name}</title><desc id="desc">${desc}</desc><defs>${defs}</defs><rect width="1500" height="500" fill="${dark?'url(#ink)':'url(#bg)'}"/><ellipse cx="750" cy="250" rx="680" ry="390" fill="url(#aura)" opacity="${dark?.3:.65}"/>${body}</svg>`});}
let b=arch(750,440,700,385,4,.27)+wire('M100 250H1400');
b+=tile(750,250,184,'mark',true)+tile(430,250,100)+tile(1070,250,100)+dot(210,250)+dot(1290,250);
add('01-the-shared-haus','The shared haus','The reference composition, softened into pearl community tiles linked through HAUS.',b);

b=wire('M-40 250C180 250 160 165 370 165S555 330 750 330S945 165 1130 165S1330 250 1540 250',3);
for(const [x,y] of [[80,235],[370,165],[750,330],[1130,165],[1420,235]])b+=tile(x,y,92,'people');
add('02-one-continuous-thread','One continuous thread','Equal community tiles share a single flowing connection, without a central leader.',b);

b=arch(750,360,700,300,5,.75);
for(const [x,y] of [[160,265],[395,135],[750,95],[1105,135],[1340,265]])b+=tile(x,y,78);
b+=wire('M160 265Q750 -75 1340 265',2);
// Redraw tiles above the shared path.
for(const [x,y] of [[160,265],[395,135],[750,95],[1105,135],[1340,265]])b+=tile(x,y,78);
add('03-under-the-same-arch','Under the same arch','Communities become points along one broad sheltering arch.',b);

b='';
const ring=[];for(let i=0;i<8;i++){const a=i*Math.PI/4;ring.push([750+Math.cos(a)*465,250+Math.sin(a)*176]);}
b+=`<ellipse cx="750" cy="250" rx="465" ry="176" fill="none" stroke="#cb92b1" stroke-width="2"/>`;
for(const [x,y] of ring)b+=wire(`M${x} ${y}Q750 250 750 250`);
b+=tile(750,250,126,'dot');for(const [x,y] of ring)b+=tile(x,y,68);
add('04-common-center','Common center','An equal ring of participants connects to a shared luminous space.',b);

b='';for(let i=0;i<5;i++){let y=70+i*90;b+=wire(`M80 ${y}C440 ${y} 460 ${210+i*20} 740 ${210+i*20}S1120 ${y} 1420 ${y}`,2.5);b+=tile(135,y,56)+tile(1365,y,56);}
b+=tile(750,250,144,'mark',true);
add('05-many-paths-one-place','Many paths, one place','Separate groups converge through a common place and stay connected across it.',b);

b=arch(375,340,365,265,5,.75)+arch(1125,340,365,265,5,.75)+wire('M-30 310H1530',2);
for(const x of [135,615,885,1365])b+=tile(x,310,76);
b+=tile(750,310,98,'dot');
add('06-connected-rooms','Connected rooms','Two arch-shaped rooms join through a common thread and a shared threshold.',b);

b='';const nodes=[[130,140],[300,325],[470,120],[620,290],[750,160],[880,290],[1030,120],[1200,325],[1370,140]];
for(let i=0;i<nodes.length-1;i++){let [x,y]=nodes[i],[xx,yy]=nodes[i+1];b+=wire(`M${x} ${y}L${xx} ${yy}`);if(i<nodes.length-2){let [xxx,yyy]=nodes[i+2];b+=wire(`M${x} ${y}Q${(x+xxx)/2} ${y-60} ${xxx} ${yyy}`,1);}}
for(let i=0;i<nodes.length;i++){let [x,y]=nodes[i];b+=i%2===0?tile(x,y,72):dot(x,y,12);}
add('07-quiet-constellation','Quiet constellation','Small groups and luminous points make an interconnected constellation.',b,true);

b=arch(750,590,970,660,7,.48)+wire('M-40 290C280 290 280 220 480 220S1020 220 1020 220S1240 290 1540 290',3);
for(let i=0;i<7;i++){const x=195+i*185,y=250-35*Math.sin(i*Math.PI/6);b+=`<circle cx="${x}" cy="${y}" r="47" fill="url(#pearl)" stroke="#fff8fa" filter="url(#shadow)"/>`+people(x,y,1.35);}
add('08-a-place-in-the-chain','A place in the chain','A linked row of equal community medallions sits within a soft oversized arch.',b);

async function main(){
 await fs.mkdir(out,{recursive:true});
 for(const d of designs){await fs.writeFile(path.join(out,d.slug+'.svg'),d.svg);await sharp(Buffer.from(d.svg)).png().toFile(path.join(out,d.slug+'.png'));}
 const prev=await fs.readFile(path.resolve(out,'../arches/index.html'),'utf8');
 await fs.writeFile(path.join(out,'index.html'),prev.slice(0,prev.indexOf('<main>')).replace('HAUS / Arch studies','HAUS / Connected')+`<main><header><small>HAUS / CONNECTION STUDIES</small><h1>Connected by us.</h1><p>Eight subtle community compositions. Pearl surfaces, rose light, and shared paths. 1500 × 500 editable SVGs.</p></header>${designs.map(d=>`<article><img src="${d.slug}.svg" alt="${d.desc}"><div class="meta"><div><h2>${d.slug.slice(0,2)} / ${d.name}</h2><p>${d.desc}</p></div><a href="${d.slug}.svg" download>SVG ↓</a><a href="${d.slug}.png" download>PNG ↓</a></div></article>`).join('')}</main></html>`);
 const layers=[];for(let i=0;i<designs.length;i++){const d=designs[i],left=25+i%2*775,top=25+Math.floor(i/2)*295;layers.push({input:await sharp(Buffer.from(d.svg)).resize(750,250).png().toBuffer(),left,top});layers.push({input:await sharp(Buffer.from(`<svg width="750" height="30"><text x="0" y="23" font-family="Arial" font-size="15" fill="#191919">${d.slug.slice(0,2)} / ${d.name}</text></svg>`)).png().toBuffer(),left,top:top+250});}
 await sharp({create:{width:1575,height:1205,channels:3,background:'#f4f0e9'}}).composite(layers).png().toFile(path.join(out,'contact-sheet.png'));
 console.log('Created eight connected-community SVG banners, PNG exports, and gallery.');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
