"use client";

import { useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import AlayaWordmark from "@/components/ui/AlayaWordmark";
import UserAvatar from "@/components/ui/UserAvatar";
import { useAuth } from "@/lib/auth-context";

export default function AuthCard() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { user, login, register, logout } = useAuth();

  const urlMode = searchParams.get("mode") === "signup" ? "signup" : "signin";
  const [activeMode, setActiveMode] = useState(urlMode);
  const [prevUrlMode, setPrevUrlMode] = useState(urlMode);

  // Sync state if searchParams change externally (e.g. browser back/forward or external navigation)
  if (urlMode !== prevUrlMode) {
    setPrevUrlMode(urlMode);
    setActiveMode(urlMode);
  }

  const mode = activeMode;

  // Sign In Form States
  const [signInIdentifier, setSignInIdentifier] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [signInErrors, setSignInErrors] = useState({
    identifier: "",
    password: "",
    general: "",
  });
  const [isSubmittingSignIn, setIsSubmittingSignIn] = useState(false);

  // Sign Up Form States
  const [signUpFullName, setSignUpFullName] = useState("");
  const [signUpUsername, setSignUpUsername] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState("");
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showSignUpConfirmPassword, setShowSignUpConfirmPassword] = useState(false);
  const [signUpErrors, setSignUpErrors] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    general: "",
  });
  const [isSubmittingSignUp, setIsSubmittingSignUp] = useState(false);
  const [signUpSuccess, setSignUpSuccess] = useState(false);

  // Persistent banner message on Sign In
  const [bannerMessage, setBannerMessage] = useState(null);

  // Switch mode without page reload and update URL
  const handleModeChange = (newMode) => {
    setActiveMode(newMode);
    setSignInErrors((prev) => ({ ...prev, general: "" }));
    setSignUpErrors((prev) => ({ ...prev, general: "" }));
    const params = new URLSearchParams(searchParams.toString());
    params.set("mode", newMode);
    const newUrl = `${pathname}?${params.toString()}`;
    router.replace(newUrl, { scroll: false });
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", newUrl);
    }
  };

  // Email format validator
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Sign In Validation
  const validateSignIn = () => {
    const errors = { identifier: "", password: "", general: "" };
    const trimmedId = signInIdentifier.trim();

    if (!trimmedId) {
      errors.identifier = "Please enter your username.";
    }

    if (!signInPassword) {
      errors.password = "Please enter your password.";
    } else if (signInPassword.length < 4) {
      errors.password = "Password must be at least 4 characters long.";
    }

    setSignInErrors(errors);
    return !errors.identifier && !errors.password;
  };

  // Sign In Submit Handler (Connects directly to Backend API via useAuth)
  const handleSignInSubmit = async (e) => {
    e.preventDefault();
    if (isSubmittingSignIn) return;

    if (!validateSignIn()) {
      return;
    }

    setIsSubmittingSignIn(true);
    setSignInErrors((prev) => ({ ...prev, general: "" }));

    try {
      await login(signInIdentifier, signInPassword);

      // Clear sensitive password
      setSignInPassword("");
      setIsSubmittingSignIn(false);

      // Navigate to /app
      router.push("/app");
    } catch (err) {
      let message = err.detail || err.message;

      if (err.status === 404) {
        message = "User not found. Please check your username or register an account.";
      } else if (err.status === 401) {
        message = "Incorrect password. Please try again.";
      } else if (!message) {
        message = "Authentication failed. Please verify your credentials.";
      }

      setIsSubmittingSignIn(false);
      setSignInErrors((prev) => ({ ...prev, general: message }));
    }
  };

  // Sign Up Validation
  const validateSignUp = () => {
    const errors = {
      fullName: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      general: "",
    };

    const trimmedFullName = signUpFullName.trim();
    const trimmedUsername = signUpUsername.trim();
    const trimmedEmail = signUpEmail.trim();

    if (!trimmedFullName) {
      errors.fullName = "Please enter your full name.";
    }

    if (!trimmedUsername) {
      errors.username = "Please enter a username.";
    }

    if (!trimmedEmail) {
      errors.email = "Please enter your email address.";
    } else if (!validateEmail(trimmedEmail)) {
      errors.email = "Please enter a valid email address (e.g., name@example.com).";
    }

    if (!signUpPassword) {
      errors.password = "Please enter a password.";
    } else if (signUpPassword.length < 4) {
      errors.password = "Password must be at least 4 characters long.";
    }

    if (!signUpConfirmPassword) {
      errors.confirmPassword = "Please confirm your password.";
    } else if (signUpConfirmPassword !== signUpPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }

    setSignUpErrors(errors);
    return !Object.values(errors).some((err) => !!err);
  };

  // Sign Up Submit Handler (Connects directly to Backend API via useAuth)
  const handleSignUpSubmit = async (e) => {
    e.preventDefault();
    if (isSubmittingSignUp) return;

    if (!validateSignUp()) {
      return;
    }

    setIsSubmittingSignUp(true);
    setSignUpErrors((prev) => ({ ...prev, general: "" }));

    try {
      const newUser = await register({
        name: signUpFullName,
        username: signUpUsername,
        password: signUpPassword,
      });

      // Clear sensitive fields
      setSignUpPassword("");
      setSignUpConfirmPassword("");

      // Prepopulate Sign In username
      setSignInIdentifier(newUser?.username || signUpUsername.trim());
      setSignInErrors({ identifier: "", password: "", general: "" });

      // Trigger success state and banner
      setSignUpSuccess(true);
      setBannerMessage({
        title: "Account created successfully",
        subtext: "Your account has been created. Please sign in to continue.",
      });

      setIsSubmittingSignUp(false);
    } catch (err) {
      const message =
        err.detail ||
        err.message ||
        "Registration failed. Username may already be in use.";

      setIsSubmittingSignUp(false);
      setSignUpErrors((prev) => ({ ...prev, general: message }));
    }
  };

  // Action to transition from SignUp success to SignIn
  const handleGoToSignIn = () => {
    setSignUpSuccess(false);
    setActiveMode("signin");
    setSignInErrors((prev) => ({ ...prev, general: "" }));
    setSignUpErrors((prev) => ({ ...prev, general: "" }));
    const params = new URLSearchParams(searchParams.toString());
    params.set("mode", "signin");
    const newUrl = `${pathname}?${params.toString()}`;
    router.replace(newUrl, { scroll: false });
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", newUrl);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Brand Header */}
      <div className="text-center mb-6">
        <Link
          href="/"
          className="inline-flex items-center group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary rounded-lg py-1 px-2"
          aria-label="Alaya Home"
        >
          <AlayaWordmark className="text-2xl sm:text-3xl font-black tracking-[0.25em] select-none" />
        </Link>
      </div>

      {/* Main Authentication Panel */}
      <div className="relative rounded-2xl border border-border-strong bg-surface-primary/95 p-6 sm:p-8 backdrop-blur-md shadow-[0_12px_40px_rgba(0,0,0,0.6)]">
        {/* Subtle Accent Glow Line at Top */}
        <div
          className="pointer-events-none absolute -top-px left-8 right-8 h-px bg-gradient-to-r from-transparent via-accent-sky/50 to-transparent"
          aria-hidden="true"
        />

        {user?.isAuthenticated ? (
          <div className="py-4 text-center animate-fadeIn space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-accent-sky/40 bg-accent-sky/10 text-accent-sky shadow-[0_0_24px_rgba(56,189,248,0.25)]">
              <UserAvatar name={user.name} size="md" />
            </div>

            <div>
              <h2 className="text-xl font-bold tracking-tight text-text-primary">
                Already Signed In
              </h2>
              <p className="mt-1.5 text-xs sm:text-sm text-text-secondary leading-relaxed">
                You are currently signed in as <span className="font-semibold text-accent-sky">{user.name}</span> (@{user.username}).
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <Link
                href="/app"
                className="btn-primary w-full h-11 text-xs sm:text-sm font-semibold uppercase tracking-wider inline-flex items-center justify-center gap-2 shadow-[0_0_16px_rgba(56,189,248,0.25)] hover:shadow-[0_0_24px_rgba(56,189,248,0.4)]"
              >
                <span>Continue to Workspace</span>
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Link>
              <button
                type="button"
                onClick={async () => {
                  await logout();
                  handleModeChange("signin");
                }}
                className="w-full text-center py-2 text-xs font-medium text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
              >
                Sign out of this account
              </button>
            </div>
          </div>
        ) : (
          <>
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
            className={`flex-1 rounded-lg py-2 text-xs font-semibold tracking-wide transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky cursor-pointer ${
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
            onClick={() => {
              setSignUpSuccess(false);
              handleModeChange("signup");
            }}
            className={`flex-1 rounded-lg py-2 text-xs font-semibold tracking-wide transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky cursor-pointer ${
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
            {/* Success Banner if redirected from Sign Up */}
            {bannerMessage && (
              <div
                className="mb-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-emerald-400 flex items-start gap-3 shadow-sm animate-fadeIn"
                role="status"
              >
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 mt-0.5">
                  <svg
                    className="h-3.5 w-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div className="flex-1 text-xs leading-normal">
                  <p className="font-semibold text-emerald-300">
                    {bannerMessage.title}
                  </p>
                  <p className="text-emerald-400/90 text-[11px] mt-0.5">
                    {bannerMessage.subtext}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setBannerMessage(null)}
                  className="text-emerald-400/70 hover:text-emerald-200 text-xs p-1 rounded cursor-pointer"
                  aria-label="Dismiss success message"
                >
                  ✕
                </button>
              </div>
            )}

            {/* General Error Alert from API */}
            {signInErrors.general && (
              <div
                className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400 font-mono flex items-start gap-2 animate-fadeIn"
                role="alert"
              >
                <span className="shrink-0 text-rose-400 mt-0.5">⚠</span>
                <span>{signInErrors.general}</span>
              </div>
            )}

            <form onSubmit={handleSignInSubmit} noValidate className="space-y-4">
              <div>
                <label
                  htmlFor="signin-username"
                  className="block text-xs font-medium text-text-secondary mb-1.5"
                >
                  Username
                </label>
                <input
                  id="signin-username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  value={signInIdentifier}
                  onChange={(e) => {
                    setSignInIdentifier(e.target.value);
                    if (signInErrors.identifier) {
                      setSignInErrors((prev) => ({ ...prev, identifier: "" }));
                    }
                  }}
                  placeholder="@username"
                  className={`input-field w-full text-xs sm:text-sm ${
                    signInErrors.identifier
                      ? "border-rose-500/70 focus:border-rose-500 focus:ring-rose-500"
                      : ""
                  }`}
                  aria-invalid={!!signInErrors.identifier}
                  aria-describedby={
                    signInErrors.identifier ? "signin-identifier-error" : undefined
                  }
                />
                {signInErrors.identifier && (
                  <p
                    id="signin-identifier-error"
                    className="mt-1 text-[11px] text-rose-400 font-mono flex items-center gap-1"
                    role="alert"
                  >
                    <span>⚠</span> {signInErrors.identifier}
                  </p>
                )}
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
                    value={signInPassword}
                    onChange={(e) => {
                      setSignInPassword(e.target.value);
                      if (signInErrors.password) {
                        setSignInErrors((prev) => ({ ...prev, password: "" }));
                      }
                    }}
                    placeholder="••••••••"
                    className={`input-field w-full pr-10 text-xs sm:text-sm ${
                      signInErrors.password
                        ? "border-rose-500/70 focus:border-rose-500 focus:ring-rose-500"
                        : ""
                    }`}
                    aria-invalid={!!signInErrors.password}
                    aria-describedby={
                      signInErrors.password ? "signin-password-error" : undefined
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignInPassword(!showSignInPassword)}
                    aria-label={showSignInPassword ? "Hide password" : "Show password"}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-accent-sky focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-sky rounded cursor-pointer"
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
                {signInErrors.password && (
                  <p
                    id="signin-password-error"
                    className="mt-1 text-[11px] text-rose-400 font-mono flex items-center gap-1"
                    role="alert"
                  >
                    <span>⚠</span> {signInErrors.password}
                  </p>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmittingSignIn}
                  className="btn-primary w-full h-10 text-xs sm:text-sm font-semibold uppercase tracking-wider shadow-[0_0_16px_rgba(56,189,248,0.25)] hover:shadow-[0_0_24px_rgba(56,189,248,0.4)] disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isSubmittingSignIn ? (
                    <span className="inline-flex items-center justify-center gap-2">
                      <svg
                        className="h-4 w-4 animate-spin text-bg-primary"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden="true"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      <span>Signing In...</span>
                    </span>
                  ) : (
                    <span>Sign In</span>
                  )}
                </button>
              </div>
            </form>

            {/* Switch to Sign Up Prompt */}
            <div className="mt-5 text-center text-xs text-text-secondary border-t border-border-subtle pt-4">
              <span>Don&apos;t have an account? </span>
              <button
                type="button"
                onClick={() => {
                  setSignUpSuccess(false);
                  handleModeChange("signup");
                }}
                className="font-semibold text-accent-sky hover:text-accent-sky-light hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-sky rounded px-1 cursor-pointer"
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
            {signUpSuccess ? (
              /* Success State with Green Check Icon and required messages */
              <div className="py-4 text-center animate-fadeIn" role="status">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 shadow-[0_0_24px_rgba(34,197,94,0.25)]">
                  <svg
                    className="h-7 w-7"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>

                <h2 className="mt-4 text-xl font-bold tracking-tight text-text-primary">
                  Account created successfully
                </h2>

                <p className="mt-2 text-xs sm:text-sm text-text-secondary leading-relaxed max-w-xs mx-auto">
                  Your account has been created. Please sign in to continue.
                </p>

                <div className="mt-6">
                  <button
                    type="button"
                    onClick={handleGoToSignIn}
                    className="btn-primary w-full h-11 text-xs sm:text-sm font-semibold uppercase tracking-wider shadow-[0_0_16px_rgba(56,189,248,0.25)] hover:shadow-[0_0_24px_rgba(56,189,248,0.4)] cursor-pointer inline-flex items-center justify-center gap-2"
                  >
                    <span>Continue to Sign In</span>
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
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSignUpSubmit} noValidate className="space-y-3.5">
                {/* General Error Alert from Register API */}
                {signUpErrors.general && (
                  <div
                    className="mb-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400 font-mono flex items-start gap-2 animate-fadeIn"
                    role="alert"
                  >
                    <span className="shrink-0 text-rose-400 mt-0.5">⚠</span>
                    <span>{signUpErrors.general}</span>
                  </div>
                )}

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
                      value={signUpFullName}
                      onChange={(e) => {
                        setSignUpFullName(e.target.value);
                        if (signUpErrors.fullName) {
                          setSignUpErrors((prev) => ({ ...prev, fullName: "" }));
                        }
                      }}
                      placeholder="Your Name"
                      className={`input-field w-full text-xs sm:text-sm ${
                        signUpErrors.fullName
                          ? "border-rose-500/70 focus:border-rose-500 focus:ring-rose-500"
                          : ""
                      }`}
                      aria-invalid={!!signUpErrors.fullName}
                      aria-describedby={
                        signUpErrors.fullName ? "signup-fullname-error" : undefined
                      }
                    />
                    {signUpErrors.fullName && (
                      <p
                        id="signup-fullname-error"
                        className="mt-1 text-[11px] text-rose-400 font-mono flex items-center gap-1"
                        role="alert"
                      >
                        <span>⚠</span> {signUpErrors.fullName}
                      </p>
                    )}
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
                      value={signUpUsername}
                      onChange={(e) => {
                        setSignUpUsername(e.target.value);
                        if (signUpErrors.username) {
                          setSignUpErrors((prev) => ({ ...prev, username: "" }));
                        }
                      }}
                      placeholder="@username"
                      className={`input-field w-full text-xs sm:text-sm ${
                        signUpErrors.username
                          ? "border-rose-500/70 focus:border-rose-500 focus:ring-rose-500"
                          : ""
                      }`}
                      aria-invalid={!!signUpErrors.username}
                      aria-describedby={
                        signUpErrors.username ? "signup-username-error" : undefined
                      }
                    />
                    {signUpErrors.username && (
                      <p
                        id="signup-username-error"
                        className="mt-1 text-[11px] text-rose-400 font-mono flex items-center gap-1"
                        role="alert"
                      >
                        <span>⚠</span> {signUpErrors.username}
                      </p>
                    )}
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
                    value={signUpEmail}
                    onChange={(e) => {
                      setSignUpEmail(e.target.value);
                      if (signUpErrors.email) {
                        setSignUpErrors((prev) => ({ ...prev, email: "" }));
                      }
                    }}
                    placeholder="name@example.com"
                    className={`input-field w-full text-xs sm:text-sm ${
                      signUpErrors.email
                        ? "border-rose-500/70 focus:border-rose-500 focus:ring-rose-500"
                        : ""
                    }`}
                    aria-invalid={!!signUpErrors.email}
                    aria-describedby={
                      signUpErrors.email ? "signup-email-error" : undefined
                    }
                  />
                  {signUpErrors.email && (
                    <p
                      id="signup-email-error"
                      className="mt-1 text-[11px] text-rose-400 font-mono flex items-center gap-1"
                      role="alert"
                    >
                      <span>⚠</span> {signUpErrors.email}
                    </p>
                  )}
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
                      value={signUpPassword}
                      onChange={(e) => {
                        setSignUpPassword(e.target.value);
                        if (signUpErrors.password) {
                          setSignUpErrors((prev) => ({ ...prev, password: "" }));
                        }
                      }}
                      placeholder="••••••••"
                      className={`input-field w-full pr-10 text-xs sm:text-sm ${
                        signUpErrors.password
                          ? "border-rose-500/70 focus:border-rose-500 focus:ring-rose-500"
                          : ""
                      }`}
                      aria-invalid={!!signUpErrors.password}
                      aria-describedby={
                        signUpErrors.password ? "signup-password-error" : undefined
                      }
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                      aria-label={showSignUpPassword ? "Hide password" : "Show password"}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-accent-sky focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-sky rounded cursor-pointer"
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
                  {signUpErrors.password ? (
                    <p
                      id="signup-password-error"
                      className="mt-1 text-[11px] text-rose-400 font-mono flex items-center gap-1"
                      role="alert"
                    >
                      <span>⚠</span> {signUpErrors.password}
                    </p>
                  ) : (
                    <p className="mt-1 text-[10px] text-text-muted">
                      Must be at least 4 characters
                    </p>
                  )}
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
                      value={signUpConfirmPassword}
                      onChange={(e) => {
                        setSignUpConfirmPassword(e.target.value);
                        if (signUpErrors.confirmPassword) {
                          setSignUpErrors((prev) => ({ ...prev, confirmPassword: "" }));
                        }
                      }}
                      placeholder="••••••••"
                      className={`input-field w-full pr-10 text-xs sm:text-sm ${
                        signUpErrors.confirmPassword
                          ? "border-rose-500/70 focus:border-rose-500 focus:ring-rose-500"
                          : ""
                      }`}
                      aria-invalid={!!signUpErrors.confirmPassword}
                      aria-describedby={
                        signUpErrors.confirmPassword
                          ? "signup-confirm-password-error"
                          : undefined
                      }
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
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-accent-sky focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-sky rounded cursor-pointer"
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
                  {signUpErrors.confirmPassword && (
                    <p
                      id="signup-confirm-password-error"
                      className="mt-1 text-[11px] text-rose-400 font-mono flex items-center gap-1"
                      role="alert"
                    >
                      <span>⚠</span> {signUpErrors.confirmPassword}
                    </p>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmittingSignUp}
                    className="btn-primary w-full h-10 text-xs sm:text-sm font-semibold uppercase tracking-wider shadow-[0_0_16px_rgba(56,189,248,0.25)] hover:shadow-[0_0_24px_rgba(56,189,248,0.4)] disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isSubmittingSignUp ? (
                      <span className="inline-flex items-center justify-center gap-2">
                        <svg
                          className="h-4 w-4 animate-spin text-bg-primary"
                          viewBox="0 0 24 24"
                          fill="none"
                          aria-hidden="true"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        <span>Creating Account...</span>
                      </span>
                    ) : (
                      <span>Create Account</span>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Switch to Sign In Prompt */}
            {!signUpSuccess && (
              <div className="mt-5 text-center text-xs text-text-secondary border-t border-border-subtle pt-4">
                <span>Already have an account? </span>
                <button
                  type="button"
                  onClick={() => handleModeChange("signin")}
                  className="font-semibold text-accent-sky hover:text-accent-sky-light hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-sky rounded px-1 cursor-pointer"
                >
                  Sign in
                </button>
              </div>
            )}
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
}
