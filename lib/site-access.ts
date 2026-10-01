// Cosmetic preview gate only. Wallet authorization protects app actions separately.
export const accessCookie='haus-site-access';
export function accessToken(){return 'unlocked';}
export function validAccess(value?:string){return value===accessToken();}
