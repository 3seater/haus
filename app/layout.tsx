import type { Metadata } from 'next';
import { Providers } from '@/components/providers';
import './globals.css';
import './site-preview.css';
import '@/components/docs.css';
export const metadata:Metadata={title:'HAUS — We are the devs.',description:'A home for every coin. A team in every holder. The community-built Solana launchpad.',icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="en"><body><Providers>{children}</Providers></body></html>; }
