import {NextResponse} from 'next/server';
import {accessCookie,accessToken} from '@/lib/site-access';
export async function POST(request:Request){
 const url=new URL(request.url);
 const hostname=(request.headers.get('host')||url.host).split(':')[0].toLowerCase();
 const production=['haus.fun','www.haus.fun','app.haus.fun'].includes(hostname);
 const expectedOrigin=production?`https://${hostname}`:url.origin;
 if(request.headers.get('origin')!==expectedOrigin)return NextResponse.json({error:'Unable to unlock.'},{status:403});
 const body=await request.json().catch(()=>null);
 if(body?.password!=='1337')return NextResponse.json({error:'Incorrect password'},{status:401});
 const token=accessToken();
 const response=NextResponse.json({ok:true});
 response.cookies.set(accessCookie,token,{httpOnly:true,sameSite:'lax',secure:production||url.protocol==='https:',path:'/',...(production?{domain:'.haus.fun'}:{})});
 return response;
}
