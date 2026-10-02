// Keep navigation on the working host; the optional app subdomain is not required.
export function siteUrls(host:string){
 const hostname=host.split(':')[0].toLowerCase();
 if(hostname==='docs.haus.fun')return {app:'https://www.haus.fun/app',home:'https://www.haus.fun/',docs:'/'};
 if(hostname==='app.haus.fun'||hostname==='apps.haus.fun')return {app:'/',home:'https://www.haus.fun/',docs:'/docs'};
 return {app:'/app',home:'/',docs:'/docs'};
}
