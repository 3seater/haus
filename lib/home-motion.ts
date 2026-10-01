export function journeyPosition(sectionTop:number,sectionHeight:number,viewportHeight:number,headerHeight:number){
 const travel=Math.max(1,sectionHeight-(viewportHeight-headerHeight));
 const progress=Math.max(0,Math.min(1,(headerHeight-sectionTop)/travel));
 return {progress,step:Math.min(3,Math.floor(progress*4))};
}
