"use client";

import Link from "next/link";
import AlayaWordmark from "@/components/ui/AlayaWordmark";
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
          className="flex items-center gap-2 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky rounded-lg p-1"
          aria-label="Alaya Application Home"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-border-strong bg-surface-secondary shadow-sm transition-transform duration-200 group-hover:scale-105">
            <svg
              className="h-3.5 w-3.5 text-accent-sky"
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
          <AlayaWordmark className="text-sm sm:text-base font-bold tracking-[0.25em]" />
        </Link>
      </div>

      {/* Right side: User avatar button navigating to /profile */}
      <div className="flex items-center gap-3">
        <Link
          href="/profile"
          aria-label={`View profile for ${userName}`}
          title="View Profile"
          className="group flex items-center justify-center rounded-full p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky cursor-pointer transition-transform duration-200 hover:scale-105"
        >
          <UserAvatar name={userName} size="sm" />
        </Link>
      </div>
    </header>
  );
}
