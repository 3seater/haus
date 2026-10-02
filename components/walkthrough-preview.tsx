'use client';
import {walkthroughCoin,walkthroughRoom} from '@/lib/walkthrough-data';
import {LaunchModal} from './launch-modal';
import {HausWorkspace} from './haus-workspace';
import './walkthrough-preview.css';
const noop=()=>{};
export function WalkthroughPreview({scene}:{scene:string}){
 const coin=walkthroughCoin;
 return <div className={`walkthrough-preview-root walkthrough-${scene}`} inert>
  {scene==='launch'?<LaunchModal open onOpenChange={noop} preview/>:
   <HausWorkspace coin={coin} previewRoom={walkthroughRoom} initialVerifyOpen={scene==='enter'} initialTab={scene==='website'?'website':scene==='proposals'?'proposals':'overview'} onBack={noop} onSave={noop}/>}
 </div>;
}
