import type {CSSProperties,ReactNode} from 'react';

/** Decorative only: the containing region owns its loading announcement. */
export function Skeleton({className='',width='100%',height='1em'}:{className?:string;width?:CSSProperties['width'];height?:CSSProperties['height']}){
 return <span aria-hidden="true" className={`skeleton ${className}`} style={{width,height}}/>;
}
/** Keep the final typography and line box mounted while data is pending. */
export function SkeletonValue({loading,children,width='7ch'}:{loading:boolean;children:ReactNode;width?:CSSProperties['width']}){
 return <span className="skeleton-value" aria-busy={loading} style={{width}}>{loading?<Skeleton height=".8em"/>:children}</span>;
}
export function PanelSkeleton({label='Loading content',rows=4}:{label?:string;rows?:number}){
 return <div className="panel-skeleton" role="status" aria-label={label} aria-busy="true"><Skeleton width="45%" height="1.5em"/>{Array.from({length:rows},(_,i)=><Skeleton key={i} width={i%2?'72%':'94%'}/>)}<Skeleton width="9rem" height="40px"/></div>;
}
