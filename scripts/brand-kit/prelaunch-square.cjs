const fs=require('fs'),path=require('path');
const sharp=require('../../node_modules/.pnpm/sharp@0.35.4_@types+node@22.20.4/node_modules/sharp');
const out=path.resolve(__dirname,'../../public/brand-kit/prelaunch-square');
fs.mkdirSync(out,{recursive:true});
const mark='M22 31 195 0 150 141H302L250 282H165L178 181H136L103 282H0Z';
const palette=['#f2a8cd','#191919','#f8d4e5','#f4f0e9'];
const colors=[[2,0,3,1,0],[0,3,1,2,0],[1,2,0,3,1],[3,0,2,1,2],[0,1,3,0,2],[2,3,0,2,1]];
let content='<rect width="1600" height="1600" fill="#ffffff"/>';
for(let row=0;row<6;row++)for(let col=0;col<5;col++){
 const x=-155+col*365+(row%2?180:0),y=-205+row*340;
 content+=`<g transform="translate(${x} ${y}) scale(.89)"><path d="${mark}" fill="${palette[colors[row][col]]}"/></g>`;
}
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1600" viewBox="0 0 1600 1600"><title>HAUS — built by us</title><desc>Original HAUS monograms in brand pink, pale pink, warm paper and ink, repeated in staggered rows on white.</desc>${content}</svg>`;
fs.writeFileSync(path.join(out,'haus-h-pattern.svg'),svg);
fs.writeFileSync(path.join(out,'index.html'),`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>HAUS / prelaunch square</title><style>*{box-sizing:border-box}body{margin:0;background:#eeeae5;color:#191919;font:14px Arial;padding:32px}main{max-width:850px;margin:auto}nav{display:flex;gap:24px;align-items:center;margin-bottom:24px}nav strong{margin-right:auto}a{color:inherit}svg{display:block;width:100%;height:auto}p{color:#666}</style><main><nav><strong>HAUS / PRELAUNCH</strong><a href="haus-h-pattern.png" download>Download PNG</a><a href="haus-h-pattern.svg" download>Editable SVG</a></nav>${svg}<p>1600 × 1600 · Original HAUS mark · Brand palette</p></main></html>`);
sharp(Buffer.from(svg)).png().toFile(path.join(out,'haus-h-pattern.png')).then(()=>console.log(out));
