import type { Metadata } from 'next';
import { Providers } from '@/components/providers';
import './fonts.css';
import './globals.css';
import './site-preview.css';
import './studio.css';
import '@/components/docs.css';
import './shape.css';
import './entry.css';
import './theme.css';
import './wordmark.css';
import './skeleton.css';
import {cookies} from 'next/headers';
import {accessCookie,validAccess} from '@/lib/site-access';
import {SiteEntry} from '@/components/site-entry';
import {ThemeSync} from '@/components/theme-toggle';
export const metadata:Metadata={
 metadataBase:new URL('https://www.haus.fun'),
 title:'HAUS — We are the devs.',
 description:'Launch tokens run by the people who hold them.',
 openGraph:{type:'website',siteName:'HAUS',title:'HAUS — We are the devs.',description:'Launch tokens run by the people who hold them.'},
 twitter:{card:'summary_large_image',title:'HAUS — We are the devs.',description:'Launch tokens run by the people who hold them.'},
 icons:{icon:{url:'/favicon.png',type:'image/png'}}
};
export default async function RootLayout({children}:{children:React.ReactNode}) { const unlocked=validAccess((await cookies()).get(accessCookie)?.value);return <html lang="en" suppressHydrationWarning><head><link rel="preload" href="/fonts/1Ptgg87LROyAm3Kz-C8.woff2" as="font" type="font/woff2" crossOrigin="anonymous"/><link rel="preload" href="/fonts/HVSMEGS-Style1.otf" as="font" type="font/otf" crossOrigin="anonymous"/><link rel="preload" href="/fonts/rP2Yp2ywxg089UriI5-g4vlH9VoD8Cmcqbu0-K4.woff2" as="font" type="font/woff2" crossOrigin="anonymous"/></head><body><script dangerouslySetInnerHTML={{__html:"try{document.documentElement.dataset.theme=localStorage.getItem('haus-theme')==='dark'?'dark':'light'}catch{document.documentElement.dataset.theme='light'}"}}/><ThemeSync/>{unlocked?<Providers>{children}</Providers>:<SiteEntry/>}</body></html>; }
