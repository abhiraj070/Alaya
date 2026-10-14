"use client";

import Link from "next/link";
import ThemeToggle from "@/components/ui/ThemeToggle";
import UserAvatar from "@/components/ui/UserAvatar";

export default function AppHeader({
  isSidebarCollapsed = false,
  isMobileDrawerOpen = false,
  onToggleSidebar,
  onNewChat,
  isCreatingChat = false,
  activeTab = "chat",
  user,
}) {
  const userName = user?.name || "Abhiraj Sharma";

  return (
    <header className="relative z-20 flex h-14 shrink-0 items-center justify-between border-b border-border-subtle bg-bg-secondary/90 px-3 sm:px-4 backdrop-blur-md select-none">
      {/* Left side: Navigation Toggle Buttons and Active Section Title */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mobile Drawer Toggle Button (Visible only on mobile) */}
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-expanded={isMobileDrawerOpen}
          aria-controls="mobile-nav-drawer"
          aria-label={
            isMobileDrawerOpen
              ? "Close navigation drawer"
              : "Open navigation drawer"
          }
          title="Toggle navigation"
          className="flex md:hidden h-9 w-9 items-center justify-center rounded-xl border border-border-subtle bg-surface-secondary/70 text-text-secondary hover:text-accent-sky hover:border-accent-sky/30 transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky"
        >
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
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        {/* Desktop Expand Sidebar & New Chat Buttons (Visible only when sidebar is collapsed) */}
        {isSidebarCollapsed && (
          <div className="hidden md:flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleSidebar}
              aria-label="Open sidebar"
              title="Open sidebar"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-border-subtle bg-surface-secondary/70 text-text-secondary hover:text-accent-sky hover:border-accent-sky/30 hover:bg-surface-secondary transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky"
            >
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
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <path d="M9 3v18" />
                <path d="m11 9 3 3-3 3" />
              </svg>
            </button>

            {onNewChat && (
              <button
                type="button"
                onClick={onNewChat}
                disabled={isCreatingChat}
                aria-label="New chat"
                title="New chat"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-border-subtle bg-surface-secondary/70 text-text-secondary hover:text-accent-sky hover:border-accent-sky/30 hover:bg-surface-secondary transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky disabled:opacity-60"
              >
                {isCreatingChat ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent-sky border-t-transparent" />
                ) : (
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                )}
              </button>
            )}
          </div>
        )}

        {/* Active Workspace / Section Indicator */}
        <div className="flex items-center gap-2 px-1">
          <span className="text-sm font-semibold tracking-wide text-text-primary">
            {activeTab === "chat" ? "Ask" : "Knowledge Base"}
          </span>
        </div>
      </div>

      {/* Right side: Theme Toggle & Profile Navigation */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        <a
          href={process.env.NEXT_PUBLIC_MEMORY_UNIVERSE_URL || "http://localhost:5173"}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-accent-sky/30 hover:border-accent-sky/60 bg-accent-sky/10 hover:bg-accent-sky/20 text-accent-sky text-xs font-semibold tracking-wide transition-all duration-200 shadow-xs group"
          title="Open 3D Memory Universe"
        >
          <svg
            className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent-sky transition-transform group-hover:rotate-45"
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
          <span className="hidden sm:inline">Memory Universe</span>
        </a>

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
