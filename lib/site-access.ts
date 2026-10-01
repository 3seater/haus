import {createHmac,timingSafeEqual} from 'node:crypto';
export const accessCookie='haus-site-access';
export function accessToken(){
 const secret=process.env.SITE_ACCESS_SECRET;
 return secret?createHmac('sha256',secret).update('haus-site-access-v1').digest('hex'):null;
}
export function validAccess(value?:string){
 const expected=accessToken();
 return !!expected&&!!value&&/^[a-f0-9]{64}$/.test(value)&&timingSafeEqual(Buffer.from(value),Buffer.from(expected));
}
