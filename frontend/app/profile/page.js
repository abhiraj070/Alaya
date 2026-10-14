"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AlayaWordmark from "@/components/ui/AlayaWordmark";
import UserAvatar from "@/components/ui/UserAvatar";
import { useAuth } from "@/lib/auth-context";
import { mockUser } from "@/mock/users";

export default function ProfilePage() {
  const router = useRouter();
  const { user, updateUser, logout, isLoading } = useAuth();

  // Active user data with mockUser fallbacks
  const currentName = user?.name || mockUser.name;
  const currentUsername = (user?.username || mockUser.username).replace(/^@/, "");
  const currentEmail = user?.email || mockUser.email;

  // Editing state for Full Name
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(currentName);
  const [nameError, setNameError] = useState("");

  // Editing state for Username
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [usernameDraft, setUsernameDraft] = useState(currentUsername);
  const [usernameError, setUsernameError] = useState("");

  // Subtle success notification
  const [successMessage, setSuccessMessage] = useState("");

  // Auto-dismiss success notification
  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => {
      setSuccessMessage("");
    }, 3000);
    return () => clearTimeout(timer);
  }, [successMessage]);

  // Full Name Editing Handlers
  const handleStartEditName = () => {
    setNameDraft(currentName);
    setNameError("");
    setIsEditingName(true);
  };

  const handleCancelName = () => {
    setNameDraft(currentName);
    setNameError("");
    setIsEditingName(false);
  };

  const handleSaveName = (e) => {
    if (e) e.preventDefault();
    const trimmed = nameDraft.trim();
    if (!trimmed) {
      setNameError("Full name cannot be empty.");
      return;
    }
    updateUser({ name: trimmed });
    setIsEditingName(false);
    setNameError("");
    setSuccessMessage("Name updated successfully");
  };

  const handleNameKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSaveName();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancelName();
    }
  };

  // Username Editing Handlers
  const handleStartEditUsername = () => {
    setUsernameDraft(currentUsername);
    setUsernameError("");
    setIsEditingUsername(true);
  };

  const handleCancelUsername = () => {
    setUsernameDraft(currentUsername);
    setUsernameError("");
    setIsEditingUsername(false);
  };

  const handleSaveUsername = (e) => {
    if (e) e.preventDefault();
    const trimmed = usernameDraft.trim().replace(/^@/, "");
    if (!trimmed) {
      setUsernameError("Username cannot be empty.");
      return;
    }
    updateUser({ username: trimmed });
    setIsEditingUsername(false);
    setUsernameError("");
    setSuccessMessage("Username updated successfully");
  };

  const handleUsernameKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSaveUsername();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancelUsername();
    }
  };

  // Frontend-only Logout Handler
  const handleLogout = () => {
    logout();
    router.push("/auth?mode=signin");
  };

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary flex flex-col justify-between selection:bg-accent-sky/25">
      {/* Top Header Navigation */}
      <header className="w-full max-w-4xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 flex items-center justify-between">
        <Link
          href="/app"
          className="inline-flex items-center gap-2 group text-xs font-medium text-text-muted hover:text-accent-sky transition-colors cursor-pointer rounded-lg px-2.5 py-1.5 border border-border-subtle hover:border-accent-sky/30 bg-surface-primary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky"
          aria-label="Return to Alaya workspace"
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

        <Link
          href="/app"
          className="inline-flex items-center group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky rounded px-2 py-1"
          aria-label="Alaya Application"
        >
          <AlayaWordmark className="text-lg sm:text-xl font-extrabold tracking-[0.22em] select-none" />
        </Link>
      </header>

      {/* Main Profile Layout */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 sm:py-12 w-full">
        <div className="w-full max-w-xl mx-auto space-y-6">
          {/* Subtle Success Notification Banner */}
          {successMessage && (
            <div
              role="status"
              className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-xs text-emerald-400 shadow-sm animate-fadeIn"
            >
              <div className="flex items-center gap-2">
                <svg
                  className="h-4 w-4 shrink-0 text-emerald-400"
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
                <span className="font-medium">{successMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setSuccessMessage("")}
                className="text-emerald-400/70 hover:text-emerald-200 text-xs p-1"
                aria-label="Dismiss notification"
              >
                ✕
              </button>
            </div>
          )}

          {/* Profile Header Card */}
          <section
            aria-label="User overview"
            className="relative rounded-2xl border border-border-strong bg-surface-primary/95 p-6 sm:p-8 backdrop-blur-md shadow-lg text-center overflow-hidden"
          >
            {/* Ambient accent top highlight line */}
            <div
              className="pointer-events-none absolute -top-px left-8 right-8 h-px bg-gradient-to-r from-transparent via-accent-sky/50 to-transparent"
              aria-hidden="true"
            />

            {/* Circular Avatar with Dynamically Derived Initials */}
            <div className="flex justify-center mb-4">
              <UserAvatar
                name={currentName}
                size="xl"
                className="h-20 w-20 text-2xl shadow-lg border-2 border-accent-sky/40 shadow-[0_0_24px_rgba(56,189,248,0.2)]"
              />
            </div>

            {/* User Full Name & Username */}
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary">
              {currentName}
            </h1>
            <p className="mt-1 text-xs sm:text-sm font-mono text-accent-sky">
              @{currentUsername}
            </p>
          </section>

          {/* Personal Information Section */}
          <section
            aria-labelledby="personal-info-heading"
            className="rounded-2xl border border-border-strong bg-surface-primary/95 p-6 sm:p-8 backdrop-blur-md shadow-lg space-y-5"
          >
            <div className="border-b border-border-subtle pb-3">
              <h2
                id="personal-info-heading"
                className="text-xs font-bold uppercase tracking-wider text-text-secondary font-mono"
              >
                Personal Information
              </h2>
            </div>

            {/* 1. Full Name Item */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="profile-fullname"
                  className="block text-xs font-medium text-text-secondary"
                >
                  Full Name
                </label>
                {!isEditingName && (
                  <button
                    type="button"
                    onClick={handleStartEditName}
                    className="text-xs font-semibold text-accent-sky hover:text-accent-sky-light hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-sky rounded px-1.5 py-0.5 cursor-pointer"
                    aria-label="Edit full name"
                  >
                    Edit
                  </button>
                )}
              </div>

              {isEditingName ? (
                <div className="space-y-2 pt-1 animate-fadeIn">
                  <div>
                    <input
                      id="profile-fullname"
                      type="text"
                      value={nameDraft}
                      onChange={(e) => {
                        setNameDraft(e.target.value);
                        if (nameError) setNameError("");
                      }}
                      onKeyDown={handleNameKeyDown}
                      placeholder="Your full name"
                      autoFocus
                      aria-invalid={!!nameError}
                      aria-describedby={nameError ? "name-error" : "name-hint"}
                      className={`input-field w-full text-xs sm:text-sm h-10 ${
                        nameError
                          ? "border-rose-500/70 focus:border-rose-500 focus:ring-rose-500"
                          : ""
                      }`}
                    />
                    {nameError && (
                      <p
                        id="name-error"
                        className="mt-1 text-[11px] text-rose-400 font-mono flex items-center gap-1"
                        role="alert"
                      >
                        <span>⚠</span> {nameError}
                      </p>
                    )}
                    <p id="name-hint" className="mt-1 text-[10px] text-text-muted">
                      Press <kbd className="font-mono bg-surface-secondary px-1 py-0.5 rounded border border-border-subtle text-text-secondary">Enter</kbd> to save, <kbd className="font-mono bg-surface-secondary px-1 py-0.5 rounded border border-border-subtle text-text-secondary">Esc</kbd> to cancel
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleSaveName}
                      className="btn-primary h-8 px-4 text-xs font-semibold uppercase tracking-wider cursor-pointer"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelName}
                      className="h-8 px-3 text-xs font-medium text-text-secondary hover:text-text-primary rounded-lg border border-border-subtle hover:bg-surface-secondary transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-1">
                  <p className="text-sm font-medium text-text-primary">
                    {currentName}
                  </p>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="border-t border-border-subtle/60" />

            {/* 2. Username Item */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="profile-username"
                  className="block text-xs font-medium text-text-secondary"
                >
                  Username
                </label>
                {!isEditingUsername && (
                  <button
                    type="button"
                    onClick={handleStartEditUsername}
                    className="text-xs font-semibold text-accent-sky hover:text-accent-sky-light hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-sky rounded px-1.5 py-0.5 cursor-pointer"
                    aria-label="Edit username"
                  >
                    Edit
                  </button>
                )}
              </div>

              {isEditingUsername ? (
                <div className="space-y-2 pt-1 animate-fadeIn">
                  <div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-text-muted select-none">
                        @
                      </span>
                      <input
                        id="profile-username"
                        type="text"
                        value={usernameDraft}
                        onChange={(e) => {
                          setUsernameDraft(e.target.value);
                          if (usernameError) setUsernameError("");
                        }}
                        onKeyDown={handleUsernameKeyDown}
                        placeholder="username"
                        autoFocus
                        aria-invalid={!!usernameError}
                        aria-describedby={
                          usernameError ? "username-error" : "username-hint"
                        }
                        className={`input-field w-full pl-7 text-xs sm:text-sm h-10 font-mono ${
                          usernameError
                            ? "border-rose-500/70 focus:border-rose-500 focus:ring-rose-500"
                            : ""
                        }`}
                      />
                    </div>
                    {usernameError && (
                      <p
                        id="username-error"
                        className="mt-1 text-[11px] text-rose-400 font-mono flex items-center gap-1"
                        role="alert"
                      >
                        <span>⚠</span> {usernameError}
                      </p>
                    )}
                    <p id="username-hint" className="mt-1 text-[10px] text-text-muted">
                      Press <kbd className="font-mono bg-surface-secondary px-1 py-0.5 rounded border border-border-subtle text-text-secondary">Enter</kbd> to save, <kbd className="font-mono bg-surface-secondary px-1 py-0.5 rounded border border-border-subtle text-text-secondary">Esc</kbd> to cancel
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleSaveUsername}
                      className="btn-primary h-8 px-4 text-xs font-semibold uppercase tracking-wider cursor-pointer"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelUsername}
                      className="h-8 px-3 text-xs font-medium text-text-secondary hover:text-text-primary rounded-lg border border-border-subtle hover:bg-surface-secondary transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-1">
                  <p className="text-sm font-mono text-text-primary">
                    @{currentUsername}
                  </p>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="border-t border-border-subtle/60" />

            {/* 3. Email Address Item (Read-Only) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="block text-xs font-medium text-text-secondary">
                  Email
                </span>
                <span className="rounded px-2 py-0.5 text-[10px] font-mono uppercase border border-border-subtle bg-surface-secondary text-text-muted">
                  Read-only
                </span>
              </div>
              <div className="py-1">
                <p className="text-sm font-mono text-text-secondary">
                  {currentEmail}
                </p>
              </div>
            </div>
          </section>

          {/* Log Out Action Card */}
          <section aria-label="Account actions" className="pt-2">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full h-11 rounded-xl border border-rose-500/30 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 hover:border-rose-500/50 text-xs font-semibold tracking-wider uppercase transition-all duration-200 cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 inline-flex items-center justify-center gap-2"
              aria-label="Log out of Alaya"
            >
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
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>Log Out</span>
            </button>
          </section>
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
