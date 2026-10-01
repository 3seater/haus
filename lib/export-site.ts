import type {Coin,SiteDesign} from './haus-data';
import {fonts,templates,memeSchema,heroImageSchema,socialPlatforms,socialUrl} from './site-design';
import {siteTemplateStyles} from './site-template-styles';
const escape=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export function exportSite(coin:Coin,design:SiteDesign){
 const theme=templates.find(t=>t.id===design.theme)||templates[0];
 const font=fonts[design.font||theme.font]||fonts.grotesk;
 const memes=(design.memes||[]).filter(m=>memeSchema.safeParse(m).success).slice(0,8),gallery=design.showGallery!==false&&memes.length>0;
 const uploaded=heroImageSchema.safeParse(design.heroImage);
 const image=uploaded.success?`<img src="${escape(uploaded.data.src)}" alt="${escape(uploaded.data.alt||coin.name+' artwork')}" style="object-fit:${uploaded.data.fit||'cover'}">`:`<div class="art-placeholder" aria-label="No site image selected"><span class="orbit" aria-hidden="true">✳</span><b>$${escape(coin.ticker)}</b></div>`;
 const art=`<figure class="art">${image}<figcaption><span>${escape(coin.name)}</span><span>Made of community ↗</span></figcaption></figure>`;
 const socialLinks=socialPlatforms.flatMap(p=>{const url=socialUrl(p.id,design.socials?.[p.id]);return url?[`<a data-social="${p.id}" href="${escape(url)}" target="_blank" rel="noopener noreferrer"><span>${p.label}</span><span aria-hidden="true">↗</span></a>`]:[];}).join('');
 const socials=socialLinks?`<div class="social-links">${socialLinks}</div>`:'';
 const headline=`<h1>${escape(design.title)}</h1>`;
 const intro=`<div class="intro"><span class="eyebrow">${escape(design.tagline)}</span>${headline}</div>`;
 const story=`<div class="story"><p>${escape(design.description)}</p>${socials}</div>`;
 const stamp=`<span class="stamp" aria-hidden="true">✳</span>`;
 const ticker=`<span class="ticker">$${escape(coin.ticker)}</span>`;
 const layouts:Record<SiteDesign['theme'],string>={
  editorial:`<div class="hero-heading">${intro}${stamp}</div><div class="split">${art}${story}</div>`,
  terminal:`<div class="signal-heading"><span class="eyebrow">A signal worth following</span>${ticker}</div><div class="signal-grid"><div>${intro}${story}</div><div class="signal-art">${art}<div class="signal-bar" aria-hidden="true">///// &nbsp; STAY CONNECTED &nbsp; /////</div></div></div>`,
  playful:`<div class="club-grid"><div class="club-copy">${intro}${story}</div><div class="club-art">${stamp}${art}<span class="club-tag">YOU BELONG HERE.</span></div></div>`,
  midnight:`<div class="night-stage">${art}<div class="night-title">${intro}</div>${ticker}</div><div class="night-bottom"><span class="eyebrow">The next chapter is ours.</span>${story}</div>`,
  poster:`<div class="poster-heading"><span class="eyebrow">${escape(design.tagline)}</span>${headline}</div><div class="poster-bottom">${art}<div>${stamp}${story}</div></div>`,
  scrapbook:`<div class="studio-grid"><div class="studio-title">${intro}</div><div class="studio-art">${art}</div><div class="studio-note"><span class="eyebrow">A work in progress. Together.</span>${story}</div><div class="studio-mark" aria-hidden="true">✳<span>GOOD<br>COMPANY.</span></div></div>`,
  minimal:`<div class="minimal-intro">${intro}${socials}</div><div class="minimal-image">${art}</div><div class="minimal-story"><span class="eyebrow">Our story</span><p>${escape(design.description)}</p></div>`,
  arcade:`<div class="frequency-top">${ticker}<span>ONE COMMUNITY. MANY VOICES.</span></div><div class="frequency-grid">${intro}${art}</div><div class="frequency-story">${story}${stamp}</div>`,
  magazine:`<div class="masthead">${escape(coin.name)}</div><div class="issue-rule"><span>THE COMMUNITY ISSUE</span>${ticker}<span>INDEPENDENT BY NATURE</span></div><div class="issue-grid">${art}<div>${intro}${story}</div></div>`,
  gallery:`<div class="gallery-heading"><span class="eyebrow">${escape(design.tagline)}</span>${ticker}</div><div class="object-frame">${art}<span class="object-label">A COMMUNITY<br>IN THE MAKING.</span></div><div class="object-copy">${headline}${story}</div>`,
 };
 return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(coin.name)}</title><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Anton&family=Barlow+Condensed:wght@600;700;800&family=Manrope:wght@400;500;600;700;800&family=Outfit:wght@400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&family=Syne:wght@600;700;800&display=swap" rel="stylesheet"><style>${siteTemplateStyles}
 body{--paper:${theme.color};--ink:${theme.ink};--headline:${font.family}}h1,.masthead{font-family:${font.family}}
 </style></head><body class="${theme.id}"><header class="site-header"><a class="wordmark" href="#home"><span class="brand-symbol" aria-hidden="true">✳</span>${escape(coin.name)}</a><nav aria-label="Website navigation"><a href="#home">Home</a>${gallery?'<a href="#memes">Gallery</a>':''}${socialLinks?'<a href="#connect">Connect ↗</a>':''}</nav></header><main id="home"><section class="hero">${layouts[theme.id]}</section>${gallery?`<section class="meme-section" id="memes"><div class="section-heading"><span class="eyebrow">From the community</span><h2>${escape(design.galleryTitle||'The collective.')}</h2><span>${String(memes.length).padStart(2,'0')} pieces ↙</span></div><div class="memes ${design.galleryLayout==='masonry'?'masonry':'grid'}">${memes.map((m,i)=>`<figure><img loading="lazy" src="${escape(m.src)}" alt="${escape(m.caption||'Community artwork '+(i+1))}"><figcaption><span>${String(i+1).padStart(2,'0')}</span>${escape(m.caption)}</figcaption></figure>`).join('')}</div></section>`:''}${socialLinks?`<section class="connect-section" id="connect"><span class="eyebrow">Keep good company.</span><h2>Find your people.</h2>${socials}</section>`:''}</main><footer><div><span class="footer-brand">${escape(coin.name)}</span><span>Built by holders. Made for everyone.</span></div><div class="contract"><span>SOLANA CONTRACT</span><span>${escape(coin.mint)}</span></div><a href="#home">Back to top ↑</a></footer></body></html>`;
}
