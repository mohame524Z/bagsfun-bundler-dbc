'use client';

import { FC, ReactNode, useEffect, useState } from 'react';
import { WalletProvider } from './WalletProvider';

/**
 * Client-only wrapper for WalletProvider to prevent hydration errors
 * Only renders after client-side mount
 */
export const ClientWalletProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  return <WalletProvider>{children}</WalletProvider>;
};
