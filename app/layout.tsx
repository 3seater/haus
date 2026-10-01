import type { Metadata } from 'next';
import { Providers } from '@/components/providers';
import './globals.css';
import './site-preview.css';
import './studio.css';
import '@/components/docs.css';
import './shape.css';
import './entry.css';
import './theme.css';
import './wordmark.css';
import {cookies} from 'next/headers';
import {accessCookie,validAccess} from '@/lib/site-access';
import {SiteEntry} from '@/components/site-entry';
import {ThemeSync} from '@/components/theme-toggle';
export const metadata:Metadata={title:'HAUS — We are the devs.',description:'A home for every coin. A team in every holder. The community-built Solana launchpad.',icons:{icon:{url:'/favicon.png',type:'image/png'}}};
export default async function RootLayout({children}:{children:React.ReactNode}) { const unlocked=validAccess((await cookies()).get(accessCookie)?.value);return <html lang="en" suppressHydrationWarning><body><script dangerouslySetInnerHTML={{__html:"try{document.documentElement.dataset.theme=localStorage.getItem('haus-theme')==='dark'?'dark':'light'}catch{document.documentElement.dataset.theme='light'}"}}/><ThemeSync/>{unlocked?<Providers>{children}</Providers>:<SiteEntry/>}</body></html>; }
