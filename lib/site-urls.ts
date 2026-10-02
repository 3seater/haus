export function siteUrls(host:string){
 const hostname=host.split(':')[0].toLowerCase();
 if(['haus.fun','www.haus.fun','app.haus.fun','apps.haus.fun','docs.haus.fun'].includes(hostname))return {app:'https://apps.haus.fun/',home:'https://www.haus.fun/',docs:'https://docs.haus.fun/'};
 return {app:'/app',home:'/',docs:'/docs'};
}
