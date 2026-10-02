import {NextRequest,NextResponse} from 'next/server';
export function middleware(request:NextRequest){
 const host=request.headers.get('host')?.split(':')[0].toLowerCase();
 if(['haus.fun','www.haus.fun','app.haus.fun','apps.haus.fun','docs.haus.fun'].includes(host||'')&&['/app','/docs'].includes(request.nextUrl.pathname)){
  const url=request.nextUrl.clone();url.protocol='https:';url.host=request.nextUrl.pathname==='/app'?'apps.haus.fun':'docs.haus.fun';url.port='';url.pathname='/';return NextResponse.redirect(url);
 }
 const path=host==='docs.haus.fun'?'/docs':host==='app.haus.fun'||host==='apps.haus.fun'?'/app':null;
 if(path&&request.nextUrl.pathname==='/'){
  const url=request.nextUrl.clone();url.pathname=path;return NextResponse.rewrite(url);
 }
 return NextResponse.next();
}
export const config={matcher:['/','/app','/docs']};
