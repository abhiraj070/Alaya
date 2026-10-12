import Link from "next/link";
import AlayaWordmark from "@/components/ui/AlayaWordmark";

export default function Footer() {
  return (
    <footer className="border-t border-border-subtle bg-bg-secondary py-12 text-xs text-text-muted">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Brand Wordmark & Tagline */}
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-border-strong bg-surface-primary">
              <svg
                className="h-3.5 w-3.5 text-accent-sky"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="12 2 22 12 12 22 2 12" />
                <circle cx="12" cy="12" r="3" fill="currentColor" fillOpacity="0.8" />
              </svg>
            </span>
            <AlayaWordmark className="font-bold tracking-widest text-text-primary" />
            <span className="text-text-muted">— Personal Knowledge Platform</span>
          </div>

          {/* Navigation Links */}
          <div className="flex flex-wrap items-center gap-6 text-text-secondary">
            <a href="#how-it-works" className="hover:text-accent-sky transition-colors">
              How It Works
            </a>
            <a href="#faq" className="hover:text-accent-sky transition-colors">
              FAQ
            </a>
            <Link href="/auth?mode=signin" className="hover:text-accent-sky transition-colors">
              Sign In
            </Link>
            <Link href="/auth?mode=signup" className="hover:text-accent-sky transition-colors">
              Get Started
            </Link>
          </div>
        </div>

        <div className="mt-8 border-t border-border-subtle pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
          <p suppressHydrationWarning>© {new Date().getFullYear()} Alaya Inc. All rights reserved.</p>
          <div className="flex items-center gap-4 text-text-muted">
            <span className="text-emerald-400 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
