'use client';

import { useState, useEffect } from 'react';
import { PrivyProvider } from '@privy-io/react-auth';
import { usePathname } from 'next/navigation';
import { Toaster } from 'sonner';
import { TooltipProvider } from '@/components/ui/tooltip';

// Privy app ID - must be explicitly set since NEXT_PUBLIC_ vars may not be available at runtime
// Vercel adds literal \n characters, so we need to remove them
const cleanEnvVar = (value: string | undefined) => {
  if (!value) return '';
  // Remove literal \n, actual newlines, carriage returns, and whitespace
  return value
    .replace(/\\n/g, '')
    .replace(/[\r\n\t ]/g, '')
    .trim();
};

const envAppId = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_PRIVY_APP_ID : undefined;
const envClientId =
  typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID : undefined;
const cleanedEnvAppId = cleanEnvVar(envAppId);
const cleanedEnvClientId = cleanEnvVar(envClientId);
const PRIVY_APP_ID = cleanedEnvAppId || 'cmieakfr201g9jo0cwewfvsgi';
const PRIVY_CLIENT_ID =
  cleanedEnvClientId || 'client-WY6TLwqxXyDiAPyNeScsFaAszjDAVQb5SUaExWLvEQv1n';

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const needsPrivy = pathname.startsWith('/auth') || pathname.startsWith('/dashboard');

  // Only mount PrivyProvider after client-side hydration.
  // Privy requires browser APIs and crashes during SSG prerendering.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const content = (
    <TooltipProvider>
      {children}
      <Toaster
        theme="dark"
        position="top-right"
        toastOptions={{
          style: {
            background: '#11140F',
            border: '1px solid rgba(216,179,93,0.14)',
            color: '#F4EEDC',
          },
        }}
      />
    </TooltipProvider>
  );

  // Public storytelling and simulation routes do not need an authentication iframe.
  // During SSG, render the same provider-free tree to keep hydration stable.
  if (!mounted || !needsPrivy) {
    return content;
  }

  if (!PRIVY_APP_ID) {
    return (
      <div style={{ padding: '20px', color: '#F0E5CC' }}>
        <p>Error: Privy App ID not configured</p>
        <p>PRIVY_APP_ID: {PRIVY_APP_ID}</p>
      </div>
    );
  }

  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      clientId={PRIVY_CLIENT_ID}
      config={{
        appearance: {
          theme: 'dark',
          accentColor: '#D8B35D',
          logo: '/logo.png',
        },
        loginMethods: ['email', 'wallet', 'google'],
        embeddedWallets: {
          ethereum: {
            createOnLogin: 'users-without-wallets',
          },
        },
      }}
    >
      {content}
    </PrivyProvider>
  );
}
