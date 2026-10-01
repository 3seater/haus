export function money(value:number|null):string {
 if(value===null||!Number.isFinite(value))return '—';
 const magnitude=Math.abs(value);
 const [divisor,suffix]=magnitude>=1e12?[1e12,'T']:magnitude>=1e9?[1e9,'B']:magnitude>=1e6?[1e6,'M']:magnitude>=1e3?[1e3,'K']:[1,''];
 return `${value<0?'-':''}$${(magnitude/Number(divisor)).toFixed(1).replace(/\.0$/,'')}${suffix}`;
}
export function launchAge(createdAt:string,asOf:string):string {
 const seconds=Math.max(0,Math.floor((Date.parse(asOf)-Date.parse(createdAt))/1000));
 if(!Number.isFinite(seconds))return '—';
 return seconds<5?'now':seconds<60?`${seconds}s ago`:seconds<3600?`${Math.floor(seconds/60)}m ago`:seconds<86400?`${Math.floor(seconds/3600)}h ago`:`${Math.floor(seconds/86400)}d ago`;
}
export function curveProgress(value:number|null):number|null {
 return value===null||!Number.isFinite(value)?null:Math.max(0,Math.min(100,value));
}
