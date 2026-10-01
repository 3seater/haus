import {z} from 'zod';
export const templateIds=['editorial','terminal','playful','midnight','poster','scrapbook','minimal','arcade','magazine','gallery'] as const;
export const templates=[
 {id:'editorial',label:'Common ground',color:'#e9e8df',ink:'#202721',description:'Oversized type. Architectural split.',font:'grotesk'},
 {id:'terminal',label:'Signal',color:'#c6f36a',ink:'#17231d',description:'Acid green. A graphic control room.',font:'wide'},
 {id:'playful',label:'Soft club',color:'#cfc5ef',ink:'#332743',description:'Rounded forms. Offbeat composition.',font:'geometric'},
 {id:'midnight',label:'After hours',color:'#151824',ink:'#d5dcf5',description:'Cinematic art. Electric blue accents.',font:'humanist'},
 {id:'poster',label:'Manifesto',color:'#f15335',ink:'#201e1b',description:'Full-bleed type. Unapologetic scale.',font:'display'},
 {id:'scrapbook',label:'Studio supply',color:'#f3ead8',ink:'#292923',description:'A creative studio. Modular art board.',font:'grotesk'},
 {id:'minimal',label:'Less, better',color:'#f6f5f1',ink:'#222222',description:'Considered spacing. Quiet confidence.',font:'humanist'},
 {id:'arcade',label:'Frequency',color:'#262351',ink:'#efff97',description:'Sports typography. High-contrast stripes.',font:'condensed'},
 {id:'magazine',label:'The issue',color:'#f0b8d0',ink:'#252124',description:'A cover story. A radical masthead.',font:'condensed'},
 {id:'gallery',label:'Object study',color:'#20211f',ink:'#e8e5d9',description:'Art takes the lead. Museum-like framing.',font:'wide'},
] as const;
export const fonts={
 grotesk:{label:'Space Grotesk',family:'"Space Grotesk", Arial, sans-serif'},
 display:{label:'Anton',family:'"Anton", Impact, sans-serif'},
 geometric:{label:'Outfit',family:'"Outfit", Arial, sans-serif'},
 wide:{label:'Syne',family:'"Syne", Arial, sans-serif'},
 humanist:{label:'Manrope',family:'"Manrope", Arial, sans-serif'},
 condensed:{label:'Barlow Condensed',family:'"Barlow Condensed", Impact, sans-serif'},
 serif:{label:'Space Grotesk',family:'"Space Grotesk", Arial, sans-serif'},
 sans:{label:'Manrope',family:'"Manrope", Arial, sans-serif'},
 mono:{label:'Space Grotesk',family:'"Space Grotesk", Arial, sans-serif'},
 rounded:{label:'Outfit',family:'"Outfit", Arial, sans-serif'},
};
export const fontChoices=['grotesk','display','geometric','wide','humanist','condensed'] as const;
export const socialPlatforms=[
 {id:'twitter',label:'X / Twitter',placeholder:'https://x.com/yourcommunity',hosts:['x.com','twitter.com']},
 {id:'telegram',label:'Telegram',placeholder:'https://t.me/yourcommunity',hosts:['t.me','telegram.me']},
 {id:'pumpfun',label:'Pump.fun',placeholder:'https://pump.fun/coin/…',hosts:['pump.fun']},
 {id:'instagram',label:'Instagram',placeholder:'https://instagram.com/yourcommunity',hosts:['instagram.com']},
 {id:'discord',label:'Discord',placeholder:'https://discord.gg/yourcommunity',hosts:['discord.gg','discord.com']},
 {id:'youtube',label:'YouTube',placeholder:'https://youtube.com/@yourcommunity',hosts:['youtube.com','youtu.be']},
 {id:'tiktok',label:'TikTok',placeholder:'https://tiktok.com/@yourcommunity',hosts:['tiktok.com']},
 {id:'website',label:'Website',placeholder:'https://yourcommunity.com',hosts:[]},
] as const;
export type SocialId=typeof socialPlatforms[number]['id'];
export function socialUrl(id:SocialId,value:string|undefined){
 if(!value?.trim())return '';
 try{const url=new URL(value.trim());const platform=socialPlatforms.find(p=>p.id===id)!;
  if(url.protocol!=='https:'||url.username||url.password||!url.hostname.includes('.'))return '';
  if(platform.hosts.length&&!platform.hosts.some(host=>url.hostname===host||url.hostname.endsWith('.'+host)))return '';
  return url.href;
 }catch{return '';}
}
export const MAX_MEMES=8,MAX_MEME_LENGTH=180000;
const imageSource=z.string().max(MAX_MEME_LENGTH).regex(/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/);
export const memeSchema=z.object({id:z.string().max(80),src:imageSource,caption:z.string().max(100)});
export const heroImageSchema=z.object({src:imageSource,alt:z.string().max(120),fit:z.enum(['cover','contain']).optional()});
const socialsSchema=z.object(Object.fromEntries(socialPlatforms.map(p=>[p.id,z.string().max(500).refine(v=>v.trim()===''||!!socialUrl(p.id,v),'Enter a valid HTTPS link for this platform.').optional()])) as Record<SocialId,z.ZodOptional<z.ZodEffects<z.ZodString,string,string>>>);
export const siteDesignSchema=z.object({title:z.string().trim().min(1).max(100),tagline:z.string().max(100),description:z.string().max(500),theme:z.enum(templateIds),font:z.enum(['grotesk','display','geometric','wide','humanist','condensed','serif','sans','mono','rounded']).optional(),heroImage:heroImageSchema.optional(),socials:socialsSchema.optional(),memes:z.array(memeSchema).max(MAX_MEMES).optional(),galleryTitle:z.string().max(80).optional(),galleryLayout:z.enum(['grid','masonry']).optional(),showGallery:z.boolean().optional()});
