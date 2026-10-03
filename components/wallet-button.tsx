'use client';
import {Skeleton} from './ui/skeleton';
import { useEffect, useState } from 'react';
import { WalletMultiButton as AdapterWalletMultiButton } from '@solana/wallet-adapter-react-ui';

// Wallet adapter initializes from browser storage, which is unavailable in SSR.
// Keep the server and first client render identical before revealing wallet state.
export function useWalletUiReady() {
  const [ready, setReady] = useState(false);
  useEffect(() => { setReady(true); }, []);
  return ready;
}

export function WalletButtonPlaceholder() {
  return <button type="button" className="wallet-adapter-button wallet-adapter-button-trigger" disabled aria-busy="true" aria-label="Loading wallet"><Skeleton width="90px" height="12px"/></button>;
}

export function WalletMultiButton() {
  const ready = useWalletUiReady();
  return <span className="wallet-ui-slot">{ready ? <AdapterWalletMultiButton/> : <WalletButtonPlaceholder/>}</span>;
}
