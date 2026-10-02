'use client';
import { useMemo, useState, type ReactNode } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
import './wallet-adapter.css';
import {Toast} from './toast';
export function Providers({children}:{children:ReactNode}) {
  const [walletError, setWalletError] = useState(false);
  const wallets = useMemo(()=>[new PhantomWalletAdapter(),new SolflareWalletAdapter()],[]);
  return <ConnectionProvider endpoint={process.env.NEXT_PUBLIC_SOLANA_RPC_URL || (process.env.NEXT_PUBLIC_SOLANA_NETWORK==='mainnet-beta'?'https://api.mainnet-beta.solana.com':'https://api.devnet.solana.com')}><WalletProvider wallets={wallets} autoConnect onError={()=>setWalletError(true)}><WalletModalProvider>{children}<Toast error message={walletError?'Wallet connection failed or was declined. Open your wallet and try again.':''} onDismiss={()=>setWalletError(false)}/></WalletModalProvider></WalletProvider></ConnectionProvider>;
}
