import {NextRequest,NextResponse} from 'next/server';
export function middleware(request:NextRequest){
 const host=request.headers.get('host')?.split(':')[0].toLowerCase();
 const path=host==='docs.haus.fun'?'/docs':host==='app.haus.fun'||host==='apps.haus.fun'?'/app':null;
 if(path&&request.nextUrl.pathname==='/'){
  const url=request.nextUrl.clone();url.pathname=path;return NextResponse.rewrite(url);
 }
 return NextResponse.next();
}
export const config={matcher:['/']};
