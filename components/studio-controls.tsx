'use client';
import {useRef,useState} from 'react';
import type {SiteDesign} from '@/lib/haus-data';
import {fonts,fontChoices,templates,socialPlatforms,socialUrl,MAX_MEMES,MAX_MEME_LENGTH} from '@/lib/site-design';

async function prepareMeme(file:File){
 if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw new Error(`${file.name}: choose a PNG, JPG or WebP image.`);
 if(file.size>10*1024*1024)throw new Error(`${file.name}: the file must be under 10 MB.`);
 const bitmap=await createImageBitmap(file);
 try{
  if(bitmap.width*bitmap.height>40000000)throw new Error(`${file.name}: image dimensions are too large.`);
  const canvas=document.createElement('canvas');const scale=Math.min(1,1000/Math.max(bitmap.width,bitmap.height));canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
  const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Image processing is unavailable.');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
  for(const quality of [.85,.65,.45,.25]){const src=canvas.toDataURL('image/jpeg',quality);if(src.length<=MAX_MEME_LENGTH)return {id:crypto.randomUUID(),src,caption:''};}
  throw new Error(`${file.name}: this image is too detailed. Try a smaller image.`);
 }finally{bitmap.close();}
}
export function StudioControls({design,setDesign,enabled,gate}:{design:SiteDesign;setDesign:React.Dispatch<React.SetStateAction<SiteDesign>>;enabled:boolean;gate:(action:()=>void)=>void}){
 const [filter,setFilter]=useState(''),[uploading,setUploading]=useState(false),[error,setError]=useState('');const busy=useRef(false);
 const [section,setSection]=useState<'design'|'identity'|'socials'|'gallery'>('design');
 const memes=design.memes||[];
 async function upload(files:File[]){
  if(busy.current||!enabled)return;
  if(files.length+memes.length>MAX_MEMES){setError(`Keep up to ${MAX_MEMES} memes per website. Remove one before adding more.`);return;}
  busy.current=true;setUploading(true);setError('');
  try{const added:NonNullable<SiteDesign['memes']>=[];for(const file of files)added.push(await prepareMeme(file));setDesign(d=>({...d,memes:[...(d.memes||[]),...added].slice(0,MAX_MEMES)}));}catch(e){setError(e instanceof Error?e.message:'Could not read these images.');}finally{busy.current=false;setUploading(false);}
 }
 function move(index:number,offset:number){setDesign(d=>{const next=[...(d.memes||[])];[next[index],next[index+offset]]=[next[index+offset],next[index]];return {...d,memes:next};});}
 async function uploadIdentity(file:File){
  if(busy.current||!enabled)return;busy.current=true;setUploading(true);setError('');
  try{const image=await prepareMeme(file);setDesign(d=>({...d,heroImage:{src:image.src,alt:'',fit:'cover'}}));}catch(e){setError(e instanceof Error?e.message:'Could not read this image.');}finally{busy.current=false;setUploading(false);}
 }
 return <div className="haus-site-controls studio-controls">
  <nav className="studio-section-tabs" aria-label="Website settings">{(['design','identity','socials','gallery'] as const).map(id=><button type="button" key={id} aria-pressed={section===id} onClick={()=>{setSection(id);setError('');}}>{id}</button>)}</nav>
  {section==='design'&&<>
  <input aria-label="Search templates" placeholder="Find your vibe…" value={filter} onChange={e=>setFilter(e.target.value)}/>
  <div className="studio-template-grid">{templates.filter(t=>(t.label+' '+t.description).toLowerCase().includes(filter.toLowerCase())).map((t)=><button type="button" key={t.id} aria-pressed={design.theme===t.id} className={design.theme===t.id?'selected':''} onClick={()=>gate(()=>setDesign(d=>({...d,theme:t.id})))}><span className={`template-swatch swatch-${t.id}`} style={{background:t.color,color:t.ink}}><b style={{fontFamily:fonts[t.font].family}}>YOUR<br/>PEOPLE.</b><i>✳</i><em>MADE OF COMMUNITY ↗</em></span><strong>{t.label}<span>{design.theme===t.id?'●':'↗'}</span></strong></button>)}</div>
  {!templates.some(t=>(t.label+' '+t.description).toLowerCase().includes(filter.toLowerCase()))&&<p>No templates match. Try another style.</p>}
  <fieldset disabled={!enabled}>
   <label className="field-label">TYPEFACE<select value={design.font||''} onChange={e=>setDesign(d=>({...d,font:(e.target.value||undefined) as SiteDesign['font']}))}><option value="">Curated template pairing</option>{fontChoices.map(id=><option key={id} value={id}>{fonts[id].label}</option>)}</select></label>
   <div className="studio-font-specimen" style={{fontFamily:fonts[design.font||templates.find(t=>t.id===design.theme)!.font].family}}>Good type.<br/>Great company.<small>ABCDEFGHIJKLMNOPQRSTUVWXYZ<br/>abcdefghijklmnopqrstuvwxyz 0123456789</small></div>
  </fieldset></>}
  {section==='identity'&&<fieldset disabled={!enabled}>
   <div className="studio-identity-image">{design.heroImage?<img src={design.heroImage.src} alt={design.heroImage.alt||'Selected website artwork'}/>:<span>↗<small>Your image goes here</small></span>}</div>
   <label className="studio-upload">{uploading?'Preparing image…':design.heroImage?'Replace site image':'＋ Upload site image'}<input aria-label="Upload site image" type="file" accept="image/png,image/jpeg,image/webp" disabled={uploading} onChange={e=>{const file=e.target.files?.[0];e.target.value='';if(file)void uploadIdentity(file);}}/><small>PNG, JPG or WebP · up to 10 MB</small></label>
   {design.heroImage&&<><label className="field-label">IMAGE DESCRIPTION<input aria-label="Site image description" maxLength={120} value={design.heroImage.alt} onChange={e=>setDesign(d=>({...d,heroImage:d.heroImage?{...d.heroImage,alt:e.target.value}:undefined}))}/></label><label className="field-label">IMAGE FIT<select value={design.heroImage.fit||'cover'} onChange={e=>setDesign(d=>({...d,heroImage:d.heroImage?{...d.heroImage,fit:e.target.value as 'cover'|'contain'}:undefined}))}><option value="cover">Fill the frame</option><option value="contain">Show the whole image</option></select></label><button type="button" className="text-button" onClick={()=>setDesign(d=>({...d,heroImage:undefined}))}>Remove site image</button></>}
   <label className="field-label">HEADLINE<textarea maxLength={100} rows={2} value={design.title} onChange={e=>setDesign(d=>({...d,title:e.target.value}))}/></label>
   <label className="field-label">TAGLINE<input maxLength={100} value={design.tagline} onChange={e=>setDesign(d=>({...d,tagline:e.target.value}))}/></label>
   <label className="field-label">STORY<textarea maxLength={500} rows={3} value={design.description} onChange={e=>setDesign(d=>({...d,description:e.target.value}))}/></label>
  </fieldset>}
  {section==='socials'&&<fieldset disabled={!enabled}>
   {socialPlatforms.map(platform=>{const value=design.socials?.[platform.id]||'',invalid=!!value.trim()&&!socialUrl(platform.id,value);return <label className="field-label studio-social-field" key={platform.id}>{platform.label}<span className="studio-link-state">{!value.trim()?'Hidden':invalid?'Check link':'Visible ↗'}</span><input type="url" aria-label={`${platform.label} link`} aria-invalid={invalid} maxLength={500} placeholder={platform.placeholder} value={value} onChange={e=>setDesign(d=>({...d,socials:{...d.socials,[platform.id]:e.target.value}}))}/>{invalid&&<small>Use a full https:// link for {platform.label}.</small>}</label>;})}
  </fieldset>}
  {section==='gallery'&&<fieldset disabled={!enabled}>
   <label className="studio-toggle"><input type="checkbox" checked={design.showGallery!==false} onChange={e=>setDesign(d=>({...d,showGallery:e.target.checked}))}/> Show gallery on site</label>
   <label className="field-label">GALLERY TITLE<input maxLength={80} value={design.galleryTitle??'The meme wall.'} onChange={e=>setDesign(d=>({...d,galleryTitle:e.target.value}))}/></label>
   <label className="field-label">GALLERY LAYOUT<select value={design.galleryLayout||'grid'} onChange={e=>setDesign(d=>({...d,galleryLayout:e.target.value as 'grid'|'masonry'}))}><option value="grid">Square grid</option><option value="masonry">Natural heights</option></select></label>
   <label className="studio-upload">{uploading?'Preparing images…':'＋ Upload memes'}<input aria-label="Upload memes" type="file" accept="image/png,image/jpeg,image/webp" multiple disabled={uploading||memes.length>=MAX_MEMES} onChange={e=>{const files=Array.from(e.target.files||[]);e.target.value='';void upload(files);}}/><small>JPG, PNG or WebP · 10 MB each</small></label>
   <div className="studio-meme-list">{memes.map((m,i)=><div className="studio-meme" key={m.id}><img src={m.src} alt={m.caption||`Meme ${i+1}`}/><label><span className="field-label">CAPTION {i+1}</span><input aria-label={`Caption for meme ${i+1}`} maxLength={100} placeholder="Add a caption…" value={m.caption} onChange={e=>setDesign(d=>({...d,memes:d.memes?.map(item=>item.id===m.id?{...item,caption:e.target.value}:item)}))}/></label><div><button type="button" aria-label={`Move meme ${i+1} earlier`} disabled={i===0} onClick={()=>move(i,-1)}>↑</button><button type="button" aria-label={`Move meme ${i+1} later`} disabled={i===memes.length-1} onClick={()=>move(i,1)}>↓</button><button type="button" onClick={()=>setDesign(d=>({...d,memes:d.memes?.filter(item=>item.id!==m.id)}))}>Remove</button></div></div>)}</div>
  </fieldset>}
  {error&&<p role="alert" className="studio-error">{error}</p>}
  {!enabled&&<button className="text-button" onClick={()=>gate(()=>{})}>Verify holdings to customize →</button>}
 </div>;
}
