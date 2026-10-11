"use client";

import { useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import AlayaWordmark from "@/components/ui/AlayaWordmark";

export default function AuthCard() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const mode = searchParams.get("mode") === "signup" ? "signup" : "signin";

  // Form Field States
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [showSignInPassword, setShowSignInPassword] = useState(false);

  const [signUpFullName, setSignUpFullName] = useState("");
  const [signUpUsername, setSignUpUsername] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState("");
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showSignUpConfirmPassword, setShowSignUpConfirmPassword] = useState(false);

  // Switch mode without page reload and update URL
  const handleModeChange = (newMode) => {
    if (newMode === mode) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("mode", newMode);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleSignInSubmit = (e) => {
    e.preventDefault();
    // Phase 3.1 UI scope: Full submission flow will be handled in Phase 3.2
  };

  const handleSignUpSubmit = (e) => {
    e.preventDefault();
    // Phase 3.1 UI scope: Full submission flow will be handled in Phase 3.2
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Brand Header */}
      <div className="text-center mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary rounded-lg p-1"
          aria-label="Alaya Home"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-border-strong bg-surface-secondary shadow-sm transition-transform duration-200 group-hover:scale-105">
            <svg
              className="h-4.5 w-4.5 text-accent-sky"
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
          <AlayaWordmark className="text-lg font-bold tracking-[0.25em]" />
        </Link>
      </div>

      {/* Main Authentication Panel */}
      <div className="relative rounded-2xl border border-border-strong bg-surface-primary/95 p-6 sm:p-8 backdrop-blur-md shadow-[0_12px_40px_rgba(0,0,0,0.6)]">
        {/* Subtle Accent Glow Line at Top */}
        <div
          className="pointer-events-none absolute -top-px left-8 right-8 h-px bg-gradient-to-r from-transparent via-accent-sky/50 to-transparent"
          aria-hidden="true"
        />

        {/* Dynamic Heading and Supporting Text */}
        <div className="text-center">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary transition-all duration-200">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-text-secondary leading-relaxed transition-all duration-200">
            {mode === "signin"
              ? "Access your documents, personal memories, and conversations."
              : "Start organizing your documents and personal knowledge."}
          </p>
        </div>

        {/* Tab Switcher */}
        <div
          className="mt-6 flex rounded-xl border border-border-subtle bg-surface-secondary/70 p-1"
          role="tablist"
          aria-label="Authentication Mode"
        >
          <button
            type="button"
            role="tab"
            id="tab-signin"
            aria-selected={mode === "signin"}
            aria-controls="panel-signin"
            onClick={() => handleModeChange("signin")}
            className={`flex-1 rounded-lg py-2 text-xs font-semibold tracking-wide transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky ${
              mode === "signin"
                ? "bg-surface-primary text-accent-sky border border-accent-sky/40 shadow-sm"
                : "border border-transparent text-text-muted hover:text-text-primary"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            role="tab"
            id="tab-signup"
            aria-selected={mode === "signup"}
            aria-controls="panel-signup"
            onClick={() => handleModeChange("signup")}
            className={`flex-1 rounded-lg py-2 text-xs font-semibold tracking-wide transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky ${
              mode === "signup"
                ? "bg-surface-primary text-accent-sky border border-accent-sky/40 shadow-sm"
                : "border border-transparent text-text-muted hover:text-text-primary"
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Mode 1: Sign In Form */}
        {mode === "signin" && (
          <div
            id="panel-signin"
            role="tabpanel"
            aria-labelledby="tab-signin"
            className="mt-6 animate-fadeIn transition-opacity duration-200"
          >
            <form onSubmit={handleSignInSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="signin-email"
                  className="block text-xs font-medium text-text-secondary mb-1.5"
                >
                  Email address
                </label>
                <input
                  id="signin-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={signInEmail}
                  onChange={(e) => setSignInEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="input-field w-full text-xs sm:text-sm"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="signin-password"
                    className="block text-xs font-medium text-text-secondary"
                  >
                    Password
                  </label>
                </div>
                <div className="relative">
                  <input
                    id="signin-password"
                    name="password"
                    type={showSignInPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input-field w-full pr-10 text-xs sm:text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignInPassword(!showSignInPassword)}
                    aria-label={showSignInPassword ? "Hide password" : "Show password"}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-accent-sky focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-sky rounded"
                  >
                    {showSignInPassword ? (
                      <svg
                        className="h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg
                        className="h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="btn-primary w-full h-10 text-xs sm:text-sm font-semibold uppercase tracking-wider shadow-[0_0_16px_rgba(56,189,248,0.25)] hover:shadow-[0_0_24px_rgba(56,189,248,0.4)]"
                >
                  Sign In
                </button>
              </div>
            </form>

            {/* Switch to Sign Up Prompt */}
            <div className="mt-6 text-center text-xs text-text-secondary border-t border-border-subtle pt-4">
              <span>Don&apos;t have an account? </span>
              <button
                type="button"
                onClick={() => handleModeChange("signup")}
                className="font-semibold text-accent-sky hover:text-accent-sky-light hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-sky rounded px-1"
              >
                Sign up
              </button>
            </div>
          </div>
        )}

        {/* Mode 2: Sign Up Form */}
        {mode === "signup" && (
          <div
            id="panel-signup"
            role="tabpanel"
            aria-labelledby="tab-signup"
            className="mt-6 animate-fadeIn transition-opacity duration-200"
          >
            <form onSubmit={handleSignUpSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="signup-fullname"
                    className="block text-xs font-medium text-text-secondary mb-1.5"
                  >
                    Your Name
                  </label>
                  <input
                    id="signup-fullname"
                    name="fullName"
                    type="text"
                    autoComplete="name"
                    required
                    value={signUpFullName}
                    onChange={(e) => setSignUpFullName(e.target.value)}
                    placeholder="Your Name"
                    className="input-field w-full text-xs sm:text-sm"
                  />
                </div>

                <div>
                  <label
                    htmlFor="signup-username"
                    className="block text-xs font-medium text-text-secondary mb-1.5"
                  >
                    Username
                  </label>
                  <input
                    id="signup-username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    required
                    value={signUpUsername}
                    onChange={(e) => setSignUpUsername(e.target.value)}
                    placeholder="@username"
                    className="input-field w-full text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="signup-email"
                  className="block text-xs font-medium text-text-secondary mb-1.5"
                >
                  Email address
                </label>
                <input
                  id="signup-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={signUpEmail}
                  onChange={(e) => setSignUpEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="input-field w-full text-xs sm:text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="signup-password"
                  className="block text-xs font-medium text-text-secondary mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="signup-password"
                    name="password"
                    type={showSignUpPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input-field w-full pr-10 text-xs sm:text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                    aria-label={showSignUpPassword ? "Hide password" : "Show password"}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-accent-sky focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-sky rounded"
                  >
                    {showSignUpPassword ? (
                      <svg
                        className="h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg
                        className="h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="signup-confirm-password"
                  className="block text-xs font-medium text-text-secondary mb-1.5"
                >
                  Confirm password
                </label>
                <div className="relative">
                  <input
                    id="signup-confirm-password"
                    name="confirmPassword"
                    type={showSignUpConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={signUpConfirmPassword}
                    onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input-field w-full pr-10 text-xs sm:text-sm"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowSignUpConfirmPassword(!showSignUpConfirmPassword)
                    }
                    aria-label={
                      showSignUpConfirmPassword
                        ? "Hide confirm password"
                        : "Show confirm password"
                    }
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-accent-sky focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-sky rounded"
                  >
                    {showSignUpConfirmPassword ? (
                      <svg
                        className="h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg
                        className="h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="btn-primary w-full h-10 text-xs sm:text-sm font-semibold uppercase tracking-wider shadow-[0_0_16px_rgba(56,189,248,0.25)] hover:shadow-[0_0_24px_rgba(56,189,248,0.4)]"
                >
                  Create Account
                </button>
              </div>
            </form>

            {/* Switch to Sign In Prompt */}
            <div className="mt-6 text-center text-xs text-text-secondary border-t border-border-subtle pt-4">
              <span>Already have an account? </span>
              <button
                type="button"
                onClick={() => handleModeChange("signin")}
                className="font-semibold text-accent-sky hover:text-accent-sky-light hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-sky rounded px-1"
              >
                Sign in
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
