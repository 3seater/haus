const fs=require('node:fs/promises');
const path=require('node:path');
const sharp=require('../../node_modules/.pnpm/sharp@0.35.4_@types+node@22.20.4/node_modules/sharp');
const out=path.resolve(__dirname,'../../public/brand-kit');
const H='M22 31 195 0 150 141H302L250 282H165L178 181H136L103 282H0Z';
const mark=(x,y,w,fill,extra='')=>`<g transform="translate(${x} ${y}) scale(${w/302})"><path d="${H}" fill="${fill}" ${extra}/></g>`;
const rect=(fill)=>`<path d="M0 0H1500V500H0Z" fill="${fill}"/>`;
const svg=(name,defs,body)=>`<svg xmlns="http://www.w3.org/2000/svg" width="1500" height="500" viewBox="0 0 1500 500" role="img" aria-label="${name}"><title>${name}</title><defs>${defs}</defs>${body}</svg>`;
const designs=[];

designs.push({id:'06-pink-current',name:'Pink current',svg:svg('HAUS — Pink current',`
 <linearGradient id="current-bg" x2="1" y2="1"><stop stop-color="#dedcde"/><stop offset="1" stop-color="#8e878e"/></linearGradient>
 <linearGradient id="current-pink" x1="0" y1="0" x2=".4" y2="1"><stop stop-color="#fbe3ee"/><stop offset=".36" stop-color="#f1a1c7"/><stop offset=".75" stop-color="#d98db2"/><stop offset="1" stop-color="#9d6687"/></linearGradient>
 <linearGradient id="current-white" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#fffdfa"/><stop offset=".65" stop-color="#eee5ed"/><stop offset="1" stop-color="#b8a7b6"/></linearGradient>
 <filter id="current-shadow" x="-30%" y="-50%" width="160%" height="200%"><feDropShadow dx="0" dy="17" stdDeviation="17" flood-color="#41323e" flood-opacity=".28"/></filter>`,
 rect('url(#current-bg)')+`<g filter="url(#current-shadow)"><path d="M-110-95C340-195 365 350 826 344S1300-20 1620 135L1630 430C1190 236 1210 575 768 537S239 125-120 220Z" fill="url(#current-pink)"/><path d="M-95 166C265-4 494-84 877 17S1261 256 1586 130L1590 264C1240 427 1110 196 857 144S305 85-72 321Z" fill="url(#current-white)"/><path d="M-100 471C219 246 330 198 615 283S1086 558 1580 415L1600 635H-100Z" fill="url(#current-pink)"/></g><path d="M-95 165C265-5 494-85 877 16S1261 255 1586 129" fill="none" stroke="#fffafc" stroke-width="2" opacity=".8"/>`+mark(1022,133,216,'#fffaf7',`filter="url(#current-shadow)"`))});

const echoMarks=Array.from({length:27},(_,i)=>{
 const w=210+i*77;return mark(920-w*.49,235-w*.46,w,'none',`stroke="${i%6===0?'#efadd0':'#a19aa3'}" stroke-width="${i%6===0?'.9':'.38'}" opacity="${.8-i*.015}"`);
}).reverse().join('');
designs.push({id:'07-resonance',name:'Resonance',svg:svg('HAUS — Resonance',`
 <radialGradient id="echo-bg" cx="64%" cy="45%" r="90%"><stop stop-color="#656069"/><stop offset=".6" stop-color="#39363c"/><stop offset="1" stop-color="#27252b"/></radialGradient>
 <linearGradient id="echo-core" x2=".6" y2="1"><stop stop-color="#fff0f7"/><stop offset=".6" stop-color="#f0abd0"/><stop offset="1" stop-color="#b6789e"/></linearGradient>`,
 rect('url(#echo-bg)')+echoMarks+mark(815,138,210,'url(#echo-core)'))});

const tiles=[];
for(let row=-1;row<4;row++)for(let col=-1;col<10;col++){
 const x=col*185+(row%2)*92,y=row*184-8;
 const palette=['#f4b0d2','#f9f6f1','#706b72','#d1ccd1','#e693bd'];
 const color=palette[((col+row*3)%5+5)%5];
 tiles.push(mark(x,y,176,color));
}
designs.push({id:'08-common-ground',name:'Common ground',svg:svg('HAUS — Common ground',`
 <pattern id="common-paper" width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".5" fill="#ffffff" opacity=".18"/></pattern>`,
 rect('#363238')+`<g transform="translate(-4 -10) rotate(-8 750 250)">${tiles.join('')}</g>`+rect('url(#common-paper)'))});

designs.push({id:'09-in-orbit',name:'In orbit',svg:svg('HAUS — In orbit',`
 <radialGradient id="orbit-bg" cx="63%" cy="44%" r="72%"><stop stop-color="#fcf3f9"/><stop offset=".42" stop-color="#ded6df"/><stop offset="1" stop-color="#aca6b1"/></radialGradient>
 <radialGradient id="orbit-globe" cx="27%" cy="20%" r="88%"><stop stop-color="#fff3fa"/><stop offset=".3" stop-color="#f4b5d8"/><stop offset=".65" stop-color="#d991ba"/><stop offset=".86" stop-color="#9b7d9b"/><stop offset="1" stop-color="#655a75"/></radialGradient>
 <linearGradient id="orbit-metal" x1="0" y1="0" x2=".75" y2="1"><stop stop-color="#fff"/><stop offset=".31" stop-color="#fffafc"/><stop offset=".52" stop-color="#b6a8bc"/><stop offset=".65" stop-color="#f2ecf4"/><stop offset="1" stop-color="#8e7a96"/></linearGradient>
 <filter id="orbit-blur"><feGaussianBlur stdDeviation="24"/></filter>
 <filter id="orbit-shadow" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="6" dy="12" stdDeviation="7" flood-color="#684566" flood-opacity=".32"/></filter>`,
 rect('url(#orbit-bg)')+`<ellipse cx="954" cy="419" rx="210" ry="31" fill="#6b5275" opacity=".18" filter="url(#orbit-blur)"/><g fill="none" stroke="#fbf7fb"><ellipse cx="914" cy="250" rx="532" ry="136" transform="rotate(-15 914 250)" opacity=".55"/><ellipse cx="914" cy="250" rx="660" ry="201" transform="rotate(-15 914 250)" opacity=".38"/><ellipse cx="914" cy="250" rx="827" ry="269" transform="rotate(-15 914 250)" opacity=".22"/></g><circle cx="921" cy="251" r="185" fill="url(#orbit-globe)"/>`+mark(820,153,213,'url(#orbit-metal)',`filter="url(#orbit-shadow)"`)+`<path d="M401 352C531 420 984 315 1419 89" stroke="#fffbfe" stroke-width="2.2" fill="none"/><circle cx="481" cy="355" r="7" fill="#f9eff5"/><circle cx="1200" cy="141" r="4" fill="#f9eff5"/>`)});

const contours=Array.from({length:39},(_,i)=>{
 const y=180+i*14;
 return `<path d="M-100 ${y+85}C210 ${y-70} 322 ${y+130} 606 ${y+37}S980 ${y-181} 1217 ${y-38}S1512 ${y+30} 1620 ${y-20}" stroke="${i%5===0?'#f9f1f6':'#fff8fc'}" stroke-width="${i%5===0?'1.2':'.65'}" opacity="${.7-i*.008}" fill="none"/>`;
}).join('');
designs.push({id:'10-daydream',name:'Daydream',svg:svg('HAUS — Daydream',`
 <linearGradient id="dream-bg" x1="0" y1="0" x2=".1" y2="1"><stop stop-color="#a2a0a9"/><stop offset=".33" stop-color="#d5becf"/><stop offset=".62" stop-color="#efb1d1"/><stop offset="1" stop-color="#d998be"/></linearGradient>
 <radialGradient id="dream-light"><stop stop-color="#fff5fb" stop-opacity=".9"/><stop offset="1" stop-color="#fff5fb" stop-opacity="0"/></radialGradient>
 <linearGradient id="dream-logo" x2=".3" y2="1"><stop stop-color="#fffdfa"/><stop offset="1" stop-color="#f6eaf4"/></linearGradient>`,
 rect('url(#dream-bg)')+`<ellipse cx="964" cy="137" rx="346" ry="233" fill="url(#dream-light)"/>`+contours+mark(840,118,258,'url(#dream-logo)')+`<circle cx="193" cy="131" r="2" fill="#fffdfa"/><path d="M193 119V143M181 131H205" stroke="#fffdfa" stroke-width=".8" opacity=".75"/>`)});

async function main(){
 for(const d of designs){
  await fs.writeFile(path.join(out,`haus-${d.id}-banner.svg`),d.svg);
  await sharp(Buffer.from(d.svg)).resize(3000,1000).png().toFile(path.join(out,`haus-${d.id}-banner.png`));
 }
 let html=await fs.readFile(path.join(out,'index.html'),'utf8');
 html=html.replace(/<!--ART-START-->[\s\S]*?<!--ART-END-->/g,'');
 const gallery=`<!--ART-START--><section id="art-banners" style="scroll-margin-top:24px;padding-top:20px"><div class="intro"><div><span class="kicker">THE ART EDITION / 06—10</span><h2 style="font-size:40px;letter-spacing:-1.8px">No words. Just haus.</h2></div><a class="download-all" href="haus-art-banners.zip" download>Download these 5 banners ↓</a></div>${designs.map(d=>`<section class="design-set" id="${d.id}"><div class="set-heading"><div class="set-name"><span class="index">${d.id.slice(0,2)}</span><h2>${d.name}</h2></div></div><div class="asset-preview banner-frame">${d.svg}</div><div class="asset-meta"><div><b>Art banner</b><span>3000 × 1000 PNG · Scalable SVG</span></div><div class="exports"><a href="haus-${d.id}-banner.svg" download>SVG ↗</a><a href="haus-${d.id}-banner.png" download>PNG ↓</a></div></div></section>`).join('')}</section><!--ART-END-->`;
 html=html.replace('<section class="design-set" id="01-pink-standard">',gallery+'<section class="design-set" id="01-pink-standard">');
 html=html.replace('5 profile pictures. 5 banners. Yours to export.','5 profile pictures. 10 banners. Yours to export.').replace('Download all 10 designs','Download all 15 designs').replace('FIVE WAYS TO BE HAUS','THE HAUS DESIGN COLLECTION');
 await fs.writeFile(path.join(out,'index.html'),html);
 await fs.appendFile(path.join(out,'README.txt'),'\nArt edition 06-10 adds five text-free banners. SVG filters and gradients are editable; PNGs preserve the complete rendered appearance in any tool.\n');
 const contact=await Promise.all(designs.map(async(d,i)=>({input:await sharp(path.join(out,`haus-${d.id}-banner.png`)).resize(1200,400).toBuffer(),left:20,top:20+i*420})));
 await sharp({create:{width:1240,height:2120,channels:3,background:'#f5f3ef'}}).composite(contact).png().toFile(path.resolve(__dirname,'../../docs/screenshots/haus-art-banners.png'));
 console.log('Created five text-free SVG + PNG banners and updated gallery.');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
