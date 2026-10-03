export function tokenImageSources(imageUrl:string){
 const sources=[imageUrl];
 try{
  const url=new URL(imageUrl);
  const match=url.pathname.match(/^\/ipfs\/([a-zA-Z0-9]+)(\/[^?#]*)?$/);
  if(match){
   const path=`${match[1]}${match[2]||''}`;
   sources.unshift(`https://gateway.pinata.cloud/ipfs/${path}`,`https://dweb.link/ipfs/${path}`);
  }
 }catch{}
 return [...new Set(sources)];
}
