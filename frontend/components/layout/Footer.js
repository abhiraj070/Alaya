import Link from "next/link";
import AlayaWordmark from "@/components/ui/AlayaWordmark";

export default function Footer() {
  return (
    <footer className="border-t border-border-subtle bg-bg-secondary py-8 text-xs text-text-muted">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Brand Wordmark & Tagline */}
          <div className="flex items-center gap-3">
            <AlayaWordmark className="text-base sm:text-lg font-bold tracking-[0.22em] text-text-primary select-none" />
            <span className="text-text-muted text-xs">— Personal Knowledge Platform</span>
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
      </div>
    </footer>
  );
}
