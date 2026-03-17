"use client";

import { useState, useEffect } from "react";
import { PrivyProvider } from "@privy-io/react-auth";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID || "";

export function Providers({ children }: { children: React.ReactNode }) {
  // Only mount PrivyProvider after client-side hydration.
  // Privy requires browser APIs and crashes during SSG prerendering.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

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
  if (!mounted || !PRIVY_APP_ID) {
    return content;
  }

  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
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
