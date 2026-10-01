const sharp=require('../node_modules/.pnpm/sharp@0.35.4_@types+node@22.20.4/node_modules/sharp');
const fs=require('fs');
(async()=>{const names=fs.readdirSync('public/brand-kit').filter(n=>n.endsWith('-pfp.png')).sort();const layers=[];for(let i=0;i<names.length;i++){layers.push({input:await sharp('public/brand-kit/'+names[i]).resize(300,300).toBuffer(),left:24,top:24+i*324});layers.push({input:await sharp('public/brand-kit/'+names[i].replace('-pfp','-banner')).resize(900,300).toBuffer(),left:348,top:24+i*324});}await sharp({create:{width:1272,height:1644,channels:3,background:'#f5f3ef'}}).composite(layers).png().toFile('docs/screenshots/haus-social-contact-sheet.png');})();

