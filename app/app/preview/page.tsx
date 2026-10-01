import {WalkthroughPreview} from '@/components/walkthrough-preview';
export default async function PreviewPage({searchParams}:{searchParams:Promise<{scene?:string}>}){
 const {scene}=await searchParams;
 return <WalkthroughPreview scene={scene||'launch'}/>;
}
