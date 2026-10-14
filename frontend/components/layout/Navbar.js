"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import AlayaWordmark from "@/components/ui/AlayaWordmark";
import ThemeToggle from "@/components/ui/ThemeToggle";
import UserAvatar from "@/components/ui/UserAvatar";
import { useAuth } from "@/lib/auth-context";

const emptySubscribe = () => () => {};

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isClient = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const { user, logout } = useAuth();

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border-subtle bg-bg-primary/80 backdrop-blur-md transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Brand Wordmark */}
        <Link
          href="/"
          className="group flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary rounded-md py-1"
          aria-label="Alaya Homepage"
        >
          <AlayaWordmark className="text-xl sm:text-2xl font-black tracking-[0.22em] select-none" />
        </Link>

        {/* Center: Desktop Navigation Links */}
        <nav
          className="hidden md:flex items-center gap-8 text-sm font-medium text-text-secondary"
          aria-label="Primary Navigation"
        >
          <a
            href="#how-it-works"
            className="transition-colors hover:text-text-primary focus-visible:text-text-primary focus-visible:outline-none"
          >
            How It Works
          </a>
          <a
            href="#faq"
            className="transition-colors hover:text-text-primary focus-visible:text-text-primary focus-visible:outline-none"
          >
            FAQ
          </a>
        </nav>

        {/* Right: Desktop Actions */}
        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />

          <a
            href={process.env.NEXT_PUBLIC_MEMORY_UNIVERSE_URL || "http://localhost:5173"}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-accent-sky/30 hover:border-accent-sky/60 bg-accent-sky/10 hover:bg-accent-sky/20 text-accent-sky text-xs font-semibold tracking-wide transition-all duration-200 shadow-xs group"
            title="Open 3D Memory Universe"
          >
            <svg
              className="h-4 w-4 text-accent-sky transition-transform group-hover:rotate-45"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="3" />
              <ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(30 12 12)" />
            </svg>
            <span>Memory Universe</span>
          </a>

          {isClient && user?.isAuthenticated ? (
            <div className="flex items-center gap-3">
              <Link
                href="/profile"
                className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-xl border border-border-subtle hover:border-accent-sky/40 bg-surface-secondary/70 transition-all group"
                title={`Logged in as ${user.name}`}
              >
                <UserAvatar name={user.name} size="sm" />
                <span className="text-xs font-semibold text-text-primary group-hover:text-accent-sky transition-colors max-w-[120px] truncate">
                  {user.name}
                </span>
              </Link>
              <Link
                href="/app"
                className="btn-primary h-9 px-4 text-xs font-semibold tracking-wide uppercase inline-flex items-center gap-1.5"
              >
                <span>Workspace</span>
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Link>
              <button
                type="button"
                onClick={async () => {
                  await logout();
                }}
                className="text-xs font-medium text-text-muted hover:text-rose-400 transition-colors px-2 py-1 rounded cursor-pointer"
                title="Sign Out"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <>
              <Link
                href="/auth?mode=signin"
                className="text-sm font-medium text-text-secondary transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky rounded-md px-2 py-1"
              >
                Sign In
              </Link>
              <Link
                href="/auth?mode=signup"
                className="btn-primary h-9 px-4 text-xs font-semibold tracking-wide uppercase"
              >
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile: Actions (Theme Toggle & Hamburger Toggle Button) */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="inline-flex items-center justify-center rounded-md p-2 text-text-secondary hover:bg-surface-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky"
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
          >
            <span className="sr-only">Toggle navigation menu</span>
            {mobileMenuOpen ? (
              <svg
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="4" y1="7" x2="20" y2="7" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="17" x2="20" y2="17" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Collapsible Menu */}
      {mobileMenuOpen && (
        <div className="border-b border-border-subtle bg-bg-secondary px-4 pt-3 pb-6 md:hidden">
          <div className="flex flex-col space-y-3">
            <a
              href="#how-it-works"
              onClick={closeMobileMenu}
              className="rounded-md px-3 py-2 text-sm font-medium text-text-secondary hover:bg-surface-primary hover:text-text-primary"
            >
              How It Works
            </a>
            <a
              href="#faq"
              onClick={closeMobileMenu}
              className="rounded-md px-3 py-2 text-sm font-medium text-text-secondary hover:bg-surface-primary hover:text-text-primary"
            >
              FAQ
            </a>
            <div className="pt-2 border-t border-border-subtle flex flex-col gap-2">
              <a
                href={process.env.NEXT_PUBLIC_MEMORY_UNIVERSE_URL || "http://localhost:5173"}
                target="_blank"
                rel="noopener noreferrer"
                onClick={closeMobileMenu}
                className="flex items-center justify-center gap-2 rounded-lg border border-accent-sky/30 bg-accent-sky/10 px-3 py-2 text-xs font-semibold text-accent-sky hover:bg-accent-sky/20 transition-colors"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3" />
                  <ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(30 12 12)" />
                </svg>
                <span>Open Memory Universe (3D)</span>
              </a>
              {isClient && user?.isAuthenticated ? (
                <>
                  <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-surface-secondary/70">
                    <UserAvatar name={user.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <span className="block text-xs font-semibold text-text-primary truncate">
                        {user.name}
                      </span>
                      <span className="block text-[10px] font-mono text-text-muted truncate">
                        @{user.username}
                      </span>
                    </div>
                  </div>
                  <Link
                    href="/app"
                    onClick={closeMobileMenu}
                    className="btn-primary w-full text-center h-10 text-xs font-semibold tracking-wide uppercase inline-flex items-center justify-center gap-2"
                  >
                    <span>Open Workspace</span>
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </Link>
                  <Link
                    href="/profile"
                    onClick={closeMobileMenu}
                    className="w-full text-center rounded-md px-3 py-2 text-xs font-medium text-text-secondary hover:bg-surface-primary hover:text-text-primary"
                  >
                    Profile Settings
                  </Link>
                  <button
                    type="button"
                    onClick={async () => {
                      closeMobileMenu();
                      await logout();
                    }}
                    className="w-full text-center rounded-md px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth?mode=signin"
                    onClick={closeMobileMenu}
                    className="w-full text-center rounded-md px-3 py-2 text-sm font-medium text-text-secondary hover:bg-surface-primary hover:text-text-primary"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth?mode=signup"
                    onClick={closeMobileMenu}
                    className="btn-primary w-full text-center h-10 text-xs font-semibold tracking-wide uppercase"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
