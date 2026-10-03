'use client';
import {useState} from 'react';
import {Skeleton} from './skeleton';
export function LoadingImage({src,alt}:{src:string;alt:string}){
 const [finished,setFinished]=useState('');
 return <div className="asset-image-frame" aria-busy={finished!==src}>{finished!==src&&<Skeleton height="100%"/>}<img src={src} alt={alt} loading="lazy" ref={el=>{if(el?.complete&&el.naturalWidth)setFinished(src);}} onLoad={()=>setFinished(src)} onError={()=>setFinished(src)}/></div>;
}
