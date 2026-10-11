import { Suspense } from "react";
import Link from "next/link";
import AuthCard from "@/components/auth/AuthCard";
import AuthBackground from "@/components/auth/AuthBackground";

function AuthCardFallback() {
  return (
    <div className="w-full max-w-md mx-auto animate-pulse">
      <div className="h-9 w-32 bg-surface-secondary rounded-lg mx-auto mb-6" />
      <div className="h-[430px] rounded-2xl border border-border-strong bg-surface-primary/95 p-6 sm:p-8" />
    </div>
  );
}

export const metadata = {
  title: "Authentication | Alaya",
  description: "Sign in or create an account on Alaya, your AI-powered personal knowledge platform.",
};

export default function AuthPage() {
  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-bg-primary text-text-primary selection:bg-accent-sky/25 overflow-x-hidden">
      {/* Code-Generated Minimalist Background */}
      <AuthBackground />

      {/* Top Utility Header */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-medium text-text-muted hover:text-accent-sky transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-sky rounded px-2 py-1"
        >
          <svg
            className="h-3.5 w-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          <span>Back to Home</span>
        </Link>
      </header>

      {/* Centered Main Form Area */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8 sm:py-12 w-full">
        <Suspense fallback={<AuthCardFallback />}>
          <AuthCard />
        </Suspense>
      </main>

      {/* Minimal Footer */}
      <footer className="relative z-10 w-full py-5 text-center text-[11px] text-text-muted border-t border-border-subtle/50">
        <p suppressHydrationWarning>
          © {new Date().getFullYear()} Alaya Inc. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
