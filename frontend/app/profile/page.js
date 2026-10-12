"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import AlayaWordmark from "@/components/ui/AlayaWordmark";
import UserAvatar from "@/components/ui/UserAvatar";
import { getStoredUser, subscribeUserStorage, mockUser } from "@/mock/users";

export default function ProfilePage() {
  const user = useSyncExternalStore(
    subscribeUserStorage,
    getStoredUser,
    () => mockUser
  );

  const userName = user?.name || "Abhiraj Sharma";
  const userUsername = user?.username ? `@${user.username.replace(/^@/, "")}` : "@abhiraj";

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary flex flex-col justify-between selection:bg-accent-sky/25">
      {/* Top Header */}
      <header className="w-full max-w-5xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 flex items-center justify-between">
        <Link
          href="/app"
          className="inline-flex items-center gap-2 group text-xs font-medium text-text-muted hover:text-accent-sky transition-colors cursor-pointer rounded px-2 py-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-sky"
        >
          <svg
            className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-x-0.5"
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
          <span>Back to Workspace</span>
        </Link>

        <Link href="/app" className="inline-flex items-center gap-2" aria-label="Alaya">
          <AlayaWordmark className="text-sm font-bold tracking-[0.25em]" />
        </Link>
      </header>

      {/* Main Profile Card Placeholder */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-border-strong bg-surface-primary/90 p-8 sm:p-10 backdrop-blur-md shadow-[0_12px_40px_rgba(0,0,0,0.6)] text-center relative overflow-hidden">
          {/* Subtle accent glow */}
          <div
            className="pointer-events-none absolute -top-px left-8 right-8 h-px bg-gradient-to-r from-transparent via-accent-sky/50 to-transparent"
            aria-hidden="true"
          />

          {/* Large User Avatar */}
          <div className="flex justify-center mb-5">
            <UserAvatar name={userName} size="lg" className="h-16 w-16 text-xl shadow-lg border-2 border-accent-sky/30" />
          </div>

          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary">
            {userName}
          </h1>

          <p className="mt-1 text-xs font-mono text-accent-sky">
            {userUsername}
          </p>

          <div className="mt-6 border-t border-border-subtle pt-6 space-y-3 text-left">
            <div className="flex items-center justify-between text-xs py-1.5 border-b border-border-subtle/50">
              <span className="text-text-muted">Account Status</span>
              <span className="inline-flex items-center gap-1.5 font-medium text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Active
              </span>
            </div>
            <div className="flex items-center justify-between text-xs py-1.5 border-b border-border-subtle/50">
              <span className="text-text-muted">Knowledge Space</span>
              <span className="text-text-secondary font-mono text-[11px]">Personal Isolated</span>
            </div>
          </div>

          <div className="mt-8">
            <Link
              href="/app"
              className="btn-primary w-full h-10 text-xs sm:text-sm font-semibold uppercase tracking-wider inline-flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_16px_rgba(56,189,248,0.25)] hover:shadow-[0_0_24px_rgba(56,189,248,0.4)]"
            >
              <span>Return to Workspace</span>
            </Link>
          </div>

          <p className="mt-4 text-[10px] text-text-muted">
            Profile management and security settings will be available in future phases.
          </p>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="w-full py-5 text-center text-[11px] text-text-muted border-t border-border-subtle/50">
        <p suppressHydrationWarning>
          © {new Date().getFullYear()} Alaya Inc. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
