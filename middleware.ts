import {NextRequest,NextResponse} from 'next/server';
export function middleware(request:NextRequest){
 if(request.headers.get('host')?.split(':')[0].toLowerCase()==='app.haus.fun'&&request.nextUrl.pathname==='/'){
  const url=request.nextUrl.clone();url.pathname='/app';return NextResponse.rewrite(url);
 }
 return NextResponse.next();
}
export const config={matcher:['/']};
