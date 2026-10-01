'use client';
import {usePreviewCoin} from './use-preview-coin';
import {LaunchModal} from './launch-modal';
import {HausWorkspace} from './haus-workspace';
import './walkthrough-preview.css';
const noop=()=>{};
export function WalkthroughPreview({scene}:{scene:string}){
 const coin=usePreviewCoin();
 return <div className={`walkthrough-preview-root walkthrough-${scene}`} inert>
  {scene==='launch'?<LaunchModal open onOpenChange={noop} preview/>:
   coin?<HausWorkspace coin={coin} initialVerifyOpen={scene==='enter'} initialTab={scene==='website'?'website':scene==='proposals'?'proposals':'overview'} onBack={noop} onSave={noop}/>:<div className="haus-empty"><h3>YOUR HAUS STARTS HERE.</h3><p>Launch a token to open its workspace, share artwork and pitch a website.</p></div>}
 </div>;
}
