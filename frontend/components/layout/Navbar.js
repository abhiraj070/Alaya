"use client";

import { useState } from "react";
import Link from "next/link";
import AlayaWordmark from "@/components/ui/AlayaWordmark";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border-subtle bg-bg-primary/80 backdrop-blur-md transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Brand Wordmark */}
        <Link
          href="/"
          className="group flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary rounded-md"
          aria-label="Alaya Homepage"
        >
          <span className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-border-strong bg-surface-secondary">
            {/* Minimalist Geometric Diamond Core */}
            <svg
              className="h-4 w-4 text-accent-sky transition-transform duration-200 group-hover:scale-110"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polygon points="12 2 22 12 12 22 2 12" />
              <circle cx="12" cy="12" r="3" fill="currentColor" fillOpacity="0.8" />
            </svg>
          </span>
          <AlayaWordmark className="text-base font-bold tracking-[0.2em] text-text-primary" />
        </Link>

        {/* Center: Desktop Navigation Links */}
        <nav
          className="hidden md:flex items-center gap-8 text-sm font-medium text-text-secondary"
          aria-label="Primary Navigation"
        >
          <a
            href="#features"
            className="transition-colors hover:text-text-primary focus-visible:text-text-primary focus-visible:outline-none"
          >
            Features
          </a>
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
        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/auth?mode=signin"
            className="text-sm font-medium text-text-secondary transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky rounded-md px-2 py-1"
          >
            Sign In
          </Link>
          <Link
            href="/auth?mode=signup"
            className="btn-primary h-9 px-4 text-xs font-semibold tracking-wide uppercase shadow-[0_0_12px_rgba(56,189,248,0.2)] hover:shadow-[0_0_18px_rgba(56,189,248,0.35)]"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile: Hamburger Toggle Button */}
        <div className="flex md:hidden">
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
              href="#features"
              onClick={closeMobileMenu}
              className="rounded-md px-3 py-2 text-sm font-medium text-text-secondary hover:bg-surface-primary hover:text-text-primary"
            >
              Features
            </a>
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
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
