"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AlayaWordmark from "@/components/ui/AlayaWordmark";
import UserAvatar from "@/components/ui/UserAvatar";
import { useAuth } from "@/lib/auth-context";
import DeleteAccountModal from "@/components/profile/DeleteAccountModal";

export default function ProfilePage() {
  const router = useRouter();
  const { user, updateUser, logout, deleteAccount, refreshUser } = useAuth();

  // Active user data
  const currentName = user?.name || "Guest User";
  const currentUsername = (user?.username || "guest").replace(/^@/, "");
  const currentEmail = user?.email || "";

  // Editing state for Full Name
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(currentName);
  const [nameError, setNameError] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);

  // Editing state for Username
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [usernameDraft, setUsernameDraft] = useState(currentUsername);
  const [usernameError, setUsernameError] = useState("");
  const [isSavingUsername, setIsSavingUsername] = useState(false);

  // Account deletion states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteAccountError, setDeleteAccountError] = useState("");

  // Subtle success notification
  const [successMessage, setSuccessMessage] = useState("");

  // Fetch fresh user profile details on mount from backend GET /api/user/get_user/{user_id}
  useEffect(() => {
    let isMounted = true;
    if (typeof refreshUser === "function") {
      refreshUser().then((fresh) => {
        if (!isMounted || !fresh) return;
        if (!isEditingName) setNameDraft(fresh.name || "Guest User");
        if (!isEditingUsername)
          setUsernameDraft((fresh.username || "guest").replace(/^@/, ""));
      });
    }
    return () => {
      isMounted = false;
    };
  }, [refreshUser, isEditingName, isEditingUsername]);

  // Auto-dismiss success notification
  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => {
      setSuccessMessage("");
    }, 3000);
    return () => clearTimeout(timer);
  }, [successMessage]);

  // Full Name Editing Handlers (Calls PUT /api/user/update_user/{user_id})
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

  const handleSaveName = async (e) => {
    if (e) e.preventDefault();
    if (isSavingName) return;
    const trimmed = nameDraft.trim();
    if (!trimmed) {
      setNameError("Full name cannot be empty.");
      return;
    }
    if (trimmed === currentName) {
      setIsEditingName(false);
      setNameError("");
      return;
    }

    setIsSavingName(true);
    setNameError("");

    try {
      await updateUser({ name: trimmed });
      setIsEditingName(false);
      setNameError("");
      setSuccessMessage("Full name updated successfully");
    } catch (err) {
      setNameError(err.detail || err.message || "Failed to update full name.");
    } finally {
      setIsSavingName(false);
    }
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

  // Username Editing Handlers (Calls PUT /api/user/update_user/{user_id})
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

  const handleSaveUsername = async (e) => {
    if (e) e.preventDefault();
    if (isSavingUsername) return;
    const trimmed = usernameDraft.trim().replace(/^@/, "");
    if (!trimmed) {
      setUsernameError("Username cannot be empty.");
      return;
    }
    if (trimmed === currentUsername) {
      setIsEditingUsername(false);
      setUsernameError("");
      return;
    }

    setIsSavingUsername(true);
    setUsernameError("");

    try {
      await updateUser({ username: trimmed });
      setIsEditingUsername(false);
      setUsernameError("");
      setSuccessMessage("Username updated successfully");
    } catch (err) {
      const msg = err.detail || err.message || "Failed to update username.";
      setUsernameError(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setIsSavingUsername(false);
    }
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

  // Logout Handler: clears backend session, cookies, and local tokens, then navigates to signin
  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      router.push("/auth?mode=signin");
    }
  };

  // Delete Account Handler (Calls DELETE /api/user/delete_user/{user_id})
  const handleConfirmDeleteAccount = async () => {
    if (isDeletingAccount) return;
    setIsDeletingAccount(true);
    setDeleteAccountError("");

    try {
      await deleteAccount();
      router.push("/auth?mode=signup");
    } catch (err) {
      setDeleteAccountError(
        err.detail || err.message || "Failed to delete account. Please try again."
      );
      setIsDeletingAccount(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary flex flex-col justify-between selection:bg-accent-sky/25">
      {/* Top Header Navigation */}
      <header className="w-full max-w-4xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 flex items-center justify-between">
        <Link
          href="/app"
          className="inline-flex items-center gap-2 group text-xs font-medium text-text-muted hover:text-accent-sky transition-colors cursor-pointer rounded-lg px-3 py-1.5 border border-border-subtle hover:border-accent-sky/30 bg-surface-primary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky"
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
        <div className="w-full max-w-xl mx-auto">
          {/* Subtle Success Notification Toast */}
          {successMessage && (
            <div
              role="status"
              className="mb-6 flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-400 shadow-sm animate-fadeIn"
            >
              <div className="flex items-center gap-2.5">
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
                <span className="font-medium tracking-wide">{successMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setSuccessMessage("")}
                className="text-emerald-400/70 hover:text-emerald-200 text-xs p-1 cursor-pointer"
                aria-label="Dismiss notification"
              >
                ✕
              </button>
            </div>
          )}

          {/* ========================================================= */}
          {/* 1. UPPER SECTION: Distinct User Identity Header Card       */}
          {/* ========================================================= */}
          <section
            aria-label="User identity overview"
            className="relative rounded-2xl border border-border-strong bg-surface-primary/95 p-8 sm:p-10 backdrop-blur-md shadow-xl text-center overflow-hidden"
          >
            {/* Subtle atmospheric top accent glow */}
            <div
              className="pointer-events-none absolute -top-px left-12 right-12 h-px bg-gradient-to-r from-transparent via-accent-sky/60 to-transparent"
              aria-hidden="true"
            />

            {/* Circular Avatar with Generous Space (Letters will never spill out) */}
            <div className="flex justify-center mb-5">
              <UserAvatar
                name={currentName}
                size="xl"
                className="border-3 border-accent-sky/40 shadow-[0_0_32px_rgba(56,189,248,0.22)]"
              />
            </div>

            {/* User Full Name & Handle */}
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text-primary">
              {currentName}
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm font-mono text-accent-sky">
              @{currentUsername}
            </p>
          </section>

          {/* Generous Vertical Separation Between Upper and Main Section */}
          <div className="my-7 sm:my-8" aria-hidden="true" />

          {/* ========================================================= */}
          {/* 2. MAIN SECTION: Personal Information Details Box          */}
          {/* ========================================================= */}
          <section
            aria-labelledby="personal-info-heading"
            className="rounded-2xl border border-border-strong bg-surface-primary/95 p-6 sm:p-8 backdrop-blur-md shadow-xl"
          >
            {/* Details Box Header */}
            <div className="border-b border-border-subtle pb-4 mb-6 flex items-center justify-between">
              <div>
                <h2
                  id="personal-info-heading"
                  className="text-xs font-bold uppercase tracking-wider text-accent-sky font-mono"
                >
                  Personal Information
                </h2>
                <p className="text-xs text-text-muted mt-1">
                  Manage your personal details and account identity.
                </p>
              </div>
            </div>

            {/* Details Rows with Refined, Balanced Spacing */}
            <div className="space-y-6">
              {/* Row 1: Full Name */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="profile-fullname"
                    className="block text-xs font-semibold text-text-secondary uppercase tracking-wider font-mono"
                  >
                    Full Name
                  </label>
                  {!isEditingName && (
                    <button
                      type="button"
                      onClick={handleStartEditName}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-medium text-accent-sky bg-accent-sky/10 border border-accent-sky/30 hover:bg-accent-sky/20 hover:border-accent-sky/50 transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky"
                      aria-label="Edit full name"
                    >
                      <svg
                        className="h-3 w-3"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                      <span>Edit</span>
                    </button>
                  )}
                </div>

                {isEditingName ? (
                  <div className="space-y-3 pt-1 animate-fadeIn">
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
                        className={`input-field w-full text-sm sm:text-base h-11 px-4 ${
                          nameError
                            ? "border-rose-500/70 focus:border-rose-500 focus:ring-rose-500"
                            : ""
                        }`}
                      />
                      {nameError && (
                        <p
                          id="name-error"
                          className="mt-1.5 text-[11px] text-rose-400 font-mono flex items-center gap-1"
                          role="alert"
                        >
                          <span>⚠</span> {nameError}
                        </p>
                      )}
                      <p id="name-hint" className="mt-1.5 text-[10px] text-text-muted">
                        Press <kbd className="font-mono bg-surface-secondary px-1 py-0.5 rounded border border-border-subtle text-text-secondary">Enter</kbd> to save, <kbd className="font-mono bg-surface-secondary px-1 py-0.5 rounded border border-border-subtle text-text-secondary">Esc</kbd> to cancel
                      </p>
                    </div>

                    {/* Uniform Save & Cancel Buttons */}
                    <div className="flex items-center gap-3 pt-1">
                      <button
                        type="button"
                        onClick={handleSaveName}
                        disabled={isSavingName}
                        className="btn-primary h-9 min-w-[100px] text-xs font-semibold uppercase tracking-wider rounded-xl cursor-pointer inline-flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
                      >
                        {isSavingName ? (
                          <>
                            <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                            </svg>
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
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
                            <span>Save</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelName}
                        className="h-9 min-w-[100px] text-xs font-semibold uppercase tracking-wider rounded-xl border border-border-strong bg-surface-secondary hover:bg-surface-tertiary text-text-secondary hover:text-text-primary transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5"
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
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                        <span>Cancel</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-border-subtle/70 bg-surface-secondary/40 px-4 py-3">
                    <p className="text-sm sm:text-base font-medium text-text-primary">
                      {currentName}
                    </p>
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="border-t border-border-subtle/50" />

              {/* Row 2: Username */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="profile-username"
                    className="block text-xs font-semibold text-text-secondary uppercase tracking-wider font-mono"
                  >
                    Username
                  </label>
                  {!isEditingUsername && (
                    <button
                      type="button"
                      onClick={handleStartEditUsername}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-medium text-accent-sky bg-accent-sky/10 border border-accent-sky/30 hover:bg-accent-sky/20 hover:border-accent-sky/50 transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky"
                      aria-label="Edit username"
                    >
                      <svg
                        className="h-3 w-3"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                      <span>Edit</span>
                    </button>
                  )}
                </div>

                {isEditingUsername ? (
                  <div className="space-y-3 pt-1 animate-fadeIn">
                    <div>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-mono text-text-muted select-none">
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
                          className={`input-field w-full pl-8 text-sm sm:text-base h-11 font-mono ${
                            usernameError
                              ? "border-rose-500/70 focus:border-rose-500 focus:ring-rose-500"
                              : ""
                          }`}
                        />
                      </div>
                      {usernameError && (
                        <p
                          id="username-error"
                          className="mt-1.5 text-[11px] text-rose-400 font-mono flex items-center gap-1"
                          role="alert"
                        >
                          <span>⚠</span> {usernameError}
                        </p>
                      )}
                      <p id="username-hint" className="mt-1.5 text-[10px] text-text-muted">
                        Press <kbd className="font-mono bg-surface-secondary px-1 py-0.5 rounded border border-border-subtle text-text-secondary">Enter</kbd> to save, <kbd className="font-mono bg-surface-secondary px-1 py-0.5 rounded border border-border-subtle text-text-secondary">Esc</kbd> to cancel
                      </p>
                    </div>

                    {/* Uniform Save & Cancel Buttons */}
                    <div className="flex items-center gap-3 pt-1">
                      <button
                        type="button"
                        onClick={handleSaveUsername}
                        disabled={isSavingUsername}
                        className="btn-primary h-9 min-w-[100px] text-xs font-semibold uppercase tracking-wider rounded-xl cursor-pointer inline-flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
                      >
                        {isSavingUsername ? (
                          <>
                            <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                            </svg>
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
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
                            <span>Save</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelUsername}
                        className="h-9 min-w-[100px] text-xs font-semibold uppercase tracking-wider rounded-xl border border-border-strong bg-surface-secondary hover:bg-surface-tertiary text-text-secondary hover:text-text-primary transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5"
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
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                        <span>Cancel</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-border-subtle/70 bg-surface-secondary/40 px-4 py-3">
                    <p className="text-sm sm:text-base font-mono text-text-primary">
                      @{currentUsername}
                    </p>
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="border-t border-border-subtle/50" />

              {/* Row 3: Email Address (Read-Only) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="block text-xs font-semibold text-text-secondary uppercase tracking-wider font-mono">
                    Email Address
                  </span>
                  {/* Enhanced, Aligned Read-only badge */}
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-medium text-text-muted bg-surface-secondary border border-border-subtle">
                    <svg
                      className="h-3 w-3 text-text-muted"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <span>Read-only</span>
                  </span>
                </div>
                <div className="rounded-xl border border-border-subtle/70 bg-surface-secondary/40 px-4 py-3">
                  <p className="text-sm sm:text-base font-mono text-text-secondary">
                    {currentEmail}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Generous Separation Before Account Actions */}
          <div className="my-6" aria-hidden="true" />

          {/* ========================================================= */}
          {/* 3. ACCOUNT ACTIONS: Log Out & Delete Account Permanently   */}
          {/* ========================================================= */}
          <section aria-label="Account actions" className="space-y-3">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full h-12 rounded-xl border border-border-strong/70 bg-surface-secondary/40 text-text-secondary hover:text-text-primary hover:bg-surface-secondary/70 hover:border-border-strong text-xs font-semibold tracking-wider uppercase transition-all duration-200 cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky inline-flex items-center justify-center gap-2"
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

            <button
              type="button"
              onClick={() => {
                setDeleteAccountError("");
                setShowDeleteModal(true);
              }}
              className="w-full h-12 rounded-xl border border-rose-500/30 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 hover:border-rose-500/50 text-xs font-semibold tracking-wider uppercase transition-all duration-200 cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 inline-flex items-center justify-center gap-2"
              aria-label="Delete account permanently"
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
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
              <span>Delete Account Permanently</span>
            </button>
          </section>
        </div>
      </main>

      {/* Delete Account Permanently Confirmation Modal */}
      {showDeleteModal && (
        <DeleteAccountModal
          username={currentUsername}
          isDeleting={isDeletingAccount}
          error={deleteAccountError}
          onClose={() => {
            if (!isDeletingAccount) setShowDeleteModal(false);
          }}
          onConfirm={handleConfirmDeleteAccount}
        />
      )}

      {/* Minimal Footer */}
      <footer className="w-full py-5 text-center text-[11px] text-text-muted border-t border-border-subtle/50">
        <p suppressHydrationWarning>
          © {new Date().getFullYear()} Alaya Inc. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
