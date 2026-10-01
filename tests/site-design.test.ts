import {coins} from './fixtures/coins';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {siteDesignSchema,templateIds,MAX_MEME_LENGTH,socialPlatforms,fonts} from '../lib/site-design';
import {exportSite} from '../lib/export-site';
import {initialDesign} from '../lib/haus-data';
const coin=coins[0];
const meme={id:'one',src:'data:image/png;base64,aGVsbG8=',caption:'<script>alert(1)</script>'};
test('old drafts and all new templates validate',()=>{for(const theme of templateIds)assert.ok(siteDesignSchema.safeParse({...initialDesign(coin),theme}).success);});
test('gallery settings and font survive validation for pitches and drafts',()=>{const design={...initialDesign(coin),font:'mono' as const,memes:[meme],showGallery:true,galleryTitle:'Our memes',galleryLayout:'masonry' as const};assert.deepEqual(siteDesignSchema.parse(design),design);});
test('rejects unsafe, oversized and excessive image payloads',()=>{for(const src of ['javascript:alert(1)','data:image/svg+xml;base64,aGVsbG8=','data:image/png;base64,'+'a'.repeat(MAX_MEME_LENGTH)])assert.equal(siteDesignSchema.safeParse({...initialDesign(coin),memes:[{...meme,src}]}).success,false);assert.equal(siteDesignSchema.safeParse({...initialDesign(coin),memes:Array(9).fill(meme)}).success,false);});
test('all exports preserve selected template, sans fonts and embedded gallery, and escape content',()=>{for(const theme of templateIds){const html=exportSite(coin,{...initialDesign(coin),theme,font:'mono',memes:[meme],galleryLayout:'masonry'});assert.ok(html.includes(`body class="${theme}"`));assert.ok(html.includes('font-family:"Space Grotesk", Arial, sans-serif'));assert.ok(html.includes(meme.src));assert.ok(html.includes('memes masonry'));assert.ok(!html.includes(meme.caption));assert.ok(html.includes('&lt;script&gt;'));}});
test('hidden and empty galleries omit gallery navigation and content',()=>{for(const design of [{...initialDesign(coin),memes:[]},{...initialDesign(coin),memes:[meme],showGallery:false}]){const html=exportSite(coin,design);assert.ok(!html.includes('id="memes"'));assert.ok(!html.includes('href="#memes"'));}});
test('every template uses only chosen site artwork and conditionally renders each social',()=>{
 const socials=Object.fromEntries(socialPlatforms.map(p=>[p.id,p.id==='website'?'https://example.com':p.placeholder.replace('…','example')]));
 for(const theme of templateIds){
  const empty=exportSite(coin,{...initialDesign(coin),theme});assert.ok(!empty.includes(coin.imageUrl));assert.ok(!empty.includes('data-social='));assert.ok(!empty.includes('id="connect"'));
  const design={...initialDesign(coin),theme,heroImage:{src:meme.src,alt:'Custom "art"'},socials};
  assert.ok(siteDesignSchema.safeParse(design).success);
  const html=exportSite(coin,design);assert.ok(html.includes(meme.src));assert.ok(html.includes('Custom &quot;art&quot;'));assert.ok(!html.includes(coin.imageUrl));
  for(const platform of socialPlatforms)assert.ok(html.includes(`data-social="${platform.id}"`));
 }
 for(const font of Object.values(fonts))assert.ok(font.family.endsWith('sans-serif'));
});
test('social links reject scripts, wrong platform hosts and credential tricks',()=>{
 for(const twitter of ['javascript:alert(1)','https://x.com.evil.com/test','https://x.com@evil.com','http://x.com/test']){
  const design={...initialDesign(coin),socials:{twitter}};assert.equal(siteDesignSchema.safeParse(design).success,false);assert.ok(!exportSite(coin,design).includes('data-social="twitter"'));
 }
});
