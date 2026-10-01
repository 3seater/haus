'use client';
import {useEffect,useRef} from 'react';

export function CtaField(){
 const ref=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{
  const canvas=ref.current,host=canvas?.parentElement;
  if(!canvas||!host)return;
  const ctx=canvas.getContext('2d');if(!ctx)return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let width=0,height=0,frame=0,visible=false,last=0,time=0;
  let lineColor=getComputedStyle(host).getPropertyValue('--contour-color').trim()||'rgba(108,44,79,.22)';
  const pointer={x:0,y:0,tx:0,ty:0,strength:0,target:0};
  function draw(now:number){
   frame=0;
   const dt=Math.min((now-last)/1000||0,.04);last=now;
   const ease=1-Math.exp(-dt*9);
   pointer.x+=(pointer.tx-pointer.x)*ease;pointer.y+=(pointer.ty-pointer.y)*ease;
   pointer.strength+=(pointer.target-pointer.strength)*ease;
   if(!reduced.matches)time+=dt;
   ctx!.clearRect(0,0,width,height);
   // Open, parallel arcs cover the whole panel, including behind the heading.
   const spacing=22,overscan=Math.max(180,height*.4);
   const count=Math.ceil((height+overscan*2)/spacing);
   for(let ring=0;ring<count;ring++){
    ctx!.beginPath();
    for(let i=0;i<=160;i++){
     const progress=i/160;
     let x=progress*(width+160)-80;
     let y=ring*spacing-overscan
      +Math.sin(progress*Math.PI*1.6+ring*.035+time*.12)*height*.19
      +Math.cos(progress*Math.PI*3-time*.16)*18;
     const dx=x-pointer.x,dy=y-pointer.y,distance=Math.hypot(dx,dy);
     const force=Math.exp(-distance*distance/42000)*pointer.strength;
     x+=(dx*.32-dy*.36)*force;y+=(dy*.32+dx*.36)*force;
     if(i===0)ctx!.moveTo(x,y);else ctx!.lineTo(x,y);
    }
    ctx!.strokeStyle=lineColor;ctx!.lineWidth=.8;ctx!.stroke();
   }
   if(visible&&!reduced.matches)frame=requestAnimationFrame(draw);
  }
  function schedule(){if(!frame){last=performance.now();frame=requestAnimationFrame(draw);}}
  function move(event:PointerEvent){
   if(event.pointerType==='touch'||reduced.matches)return;
   const rect=host!.getBoundingClientRect();
   pointer.tx=event.clientX-rect.left;pointer.ty=event.clientY-rect.top;
   if(!pointer.target){pointer.x=pointer.tx;pointer.y=pointer.ty;}
   pointer.target=1;
  }
  function leave(){pointer.target=0;}
  const resize=new ResizeObserver(()=>{
   width=host.clientWidth;height=host.clientHeight;
   const dpr=Math.min(devicePixelRatio||1,2);
   canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
   ctx.setTransform(dpr,0,0,dpr,0,0);schedule();
  });resize.observe(host);
  const observer=new IntersectionObserver(([entry])=>{
   visible=entry.isIntersecting;
   if(visible)schedule();else{cancelAnimationFrame(frame);frame=0;}
  });observer.observe(host);
  const themeObserver=new MutationObserver(()=>{lineColor=getComputedStyle(host).getPropertyValue('--contour-color').trim()||'rgba(108,44,79,.22)';schedule();});themeObserver.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  function motionChanged(){pointer.target=0;pointer.strength=0;schedule();}
  host.addEventListener('pointermove',move);host.addEventListener('pointerleave',leave);
  reduced.addEventListener('change',motionChanged);
  return()=>{cancelAnimationFrame(frame);resize.disconnect();observer.disconnect();themeObserver.disconnect();host.removeEventListener('pointermove',move);host.removeEventListener('pointerleave',leave);reduced.removeEventListener('change',motionChanged);};
 },[]);
 return <canvas ref={ref} className="build-fluid-field" aria-hidden="true"/>;
}
