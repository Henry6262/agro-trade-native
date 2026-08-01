"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Wheat } from "lucide-react";
import { useAuth } from "@/app/hooks/useAuth";

export default function LoginPage() {
  const { login, isAuthenticated, isLoading, error } = useAuth();
  const router = useRouter();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "radial-gradient(ellipse at center top, #1A150D 0%, #0C0904 70%)" }}
    >
      <div className="w-full max-w-md space-y-8">
        {/* Logo + Brand */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-wheat/10 border border-brand-wheat/20 mx-auto">
            <Wheat className="w-8 h-8 text-brand-wheat" />
          </div>
          <h1 className="text-3xl font-bold text-brand-cream">
            AgroTrade <span className="text-gold">Workflow Prototype</span>
          </h1>
          <p className="text-text-muted text-sm max-w-sm mx-auto">
            Demonstration interface only. It is not connected to a live AgriTek pilot and does not execute trades, payments, custody, settlement or GPS tracking.
          </p>
        </div>

        {/* Login Card */}
        <div className="glass-card rounded-xl p-8 space-y-6">
          <button
            onClick={login}
            disabled={isLoading}
            className="btn-primary w-full justify-center text-base py-4"
            style={{ clipPath: "polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)" }}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Connecting...
              </span>
            ) : (
              "Enter Prototype"
            )}
          </button>

          {error && (
            <p className="text-sm text-center" style={{ color: "var(--brand-danger)" }}>
              {error}
            </p>
          )}

          <div className="text-center">
            <p className="text-text-muted text-xs">
              Authentication is used only to view the prototype role flows.
            </p>
          </div>
        </div>

        {/* Back to landing */}
        <div className="text-center">
          <a href="/" className="text-text-muted text-sm hover:text-brand-wheat transition-colors">
            &larr; Back to homepage
          </a>
        </div>
      </div>
    </div>
  );
}
