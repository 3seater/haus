export const productionAppUrl='https://app.haus.fun';
export const productionHomeUrl='https://haus.fun';
export function siteUrls(host:string){
 const hostname=host.split(':')[0].toLowerCase();
 const production=['haus.fun','www.haus.fun','app.haus.fun'].includes(hostname);
 return {app:production?productionAppUrl:'/app',home:production?productionHomeUrl:'/'};
}
