"use client";

import Link from "next/link";
import AlayaWordmark from "@/components/ui/AlayaWordmark";
import ThemeToggle from "@/components/ui/ThemeToggle";
import UserAvatar from "@/components/ui/UserAvatar";

export default function AppHeader({
  isSidebarCollapsed = false,
  isMobileDrawerOpen = false,
  onToggleSidebar,
  user,
}) {
  const userName = user?.name || "Abhiraj Sharma";

  return (
    <header className="relative z-20 flex h-14 shrink-0 items-center justify-between border-b border-border-subtle bg-bg-secondary/90 px-3 sm:px-4 backdrop-blur-md select-none">
      {/* Left side: Toggle button and ALAYA Wordmark */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Sidebar / Mobile Drawer Toggle Button */}
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-expanded={isMobileDrawerOpen || !isSidebarCollapsed}
          aria-controls="app-sidebar mobile-nav-drawer"
          aria-label={
            isMobileDrawerOpen
              ? "Close navigation drawer"
              : isSidebarCollapsed
              ? "Expand sidebar"
              : "Collapse sidebar"
          }
          title="Toggle navigation"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-border-subtle bg-surface-secondary/70 text-text-secondary hover:text-accent-sky hover:border-accent-sky/30 transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky"
        >
          {/* Panel toggle icon */}
          <svg
            className="h-4.5 w-4.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="9" y1="3" x2="9" y2="21" />
            {isSidebarCollapsed ? (
              <polyline points="13 10 15 12 13 14" />
            ) : (
              <polyline points="15 10 13 12 15 14" />
            )}
          </svg>
        </button>

        {/* ALAYA Brand Wordmark Link */}
        <Link
          href="/app"
          className="flex items-center group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky rounded-lg py-1 px-1.5"
          aria-label="Alaya Application Home"
        >
          <AlayaWordmark className="text-lg sm:text-xl font-extrabold tracking-[0.22em] select-none" />
        </Link>
      </div>

      {/* Right side: Theme Toggle & Profile Navigation */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        <ThemeToggle />

        <Link
          href="/profile"
          className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-xl border border-border-subtle hover:border-accent-sky/40 bg-surface-secondary/70 hover:bg-surface-secondary transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky"
          title={`Profile (${userName})`}
          aria-label={`View profile for ${userName}`}
        >
          <UserAvatar name={userName} size="sm" />
          <span className="hidden sm:inline text-xs font-semibold text-text-primary group-hover:text-accent-sky transition-colors max-w-[120px] truncate">
            {userName}
          </span>
        </Link>
      </div>
    </header>
  );
}
