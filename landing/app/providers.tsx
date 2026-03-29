"use client";

import { useState, useEffect } from "react";
import { PrivyProvider } from "@privy-io/react-auth";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

// Privy app ID - must be explicitly set since NEXT_PUBLIC_ vars may not be available at runtime
// Vercel adds literal \n characters, so we need to remove them
const cleanEnvVar = (value: string | undefined) => {
  if (!value) return "";
  // Remove literal \n, actual newlines, carriage returns, and whitespace
  return value.replace(/\\n/g, "").replace(/[\r\n\t ]/g, "").trim();
};

const envAppId = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_PRIVY_APP_ID : undefined;
const envClientId = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID : undefined;
const cleanedEnvAppId = cleanEnvVar(envAppId);
const cleanedEnvClientId = cleanEnvVar(envClientId);
const PRIVY_APP_ID = cleanedEnvAppId || "cmieakfr201g9jo0cwewfvsgi";
const PRIVY_CLIENT_ID = cleanedEnvClientId || "client-WY6TLwqxXyDiAPyNeScsFaAszjDAVQb5SUaExWLvEQv1n";

export function Providers({ children }: { children: React.ReactNode }) {
  // Only mount PrivyProvider after client-side hydration.
  // Privy requires browser APIs and crashes during SSG prerendering.
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('[Providers] Client-side hydration complete');
    console.log('[Providers] Privy App ID:', PRIVY_APP_ID);
    console.log('[Providers] Privy App ID length:', PRIVY_APP_ID?.length);
    console.log('[Providers] Privy App ID type:', typeof PRIVY_APP_ID);
    console.log('[Providers] Privy Client ID:', PRIVY_CLIENT_ID);
    console.log('[Providers] Privy Client ID length:', PRIVY_CLIENT_ID?.length);
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
            background: "#110D07",
            border: "1px solid rgba(232,200,112,0.14)",
            color: "#F0E5CC",
          },
        }}
      />
    </TooltipProvider>
  );

  // During SSG or if no app ID, render without Privy
  if (!mounted) {
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

  if (error) {
    return (
      <div style={{ padding: '20px', color: '#F0E5CC' }}>
        <p>Error initializing Privy: {error}</p>
      </div>
    );
  }

  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      clientId={PRIVY_CLIENT_ID}
      config={{
        appearance: {
          theme: "dark",
          accentColor: "#E8C870",
          logo: "/logo.png",
        },
        loginMethods: ["email", "wallet", "google"],
        embeddedWallets: {
          ethereum: {
            createOnLogin: "users-without-wallets",
          },
        },
      }}
    >
      {content}
    </PrivyProvider>
  );
}
