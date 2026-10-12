"use client";

import Link from "next/link";
import SidebarItem from "@/components/app/SidebarItem";
import UserAvatar from "@/components/ui/UserAvatar";

export default function Sidebar({
  isCollapsed = false,
  activeTab = "chat",
  onSelectTab,
  user,
}) {
  const chatIcon = (
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
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );

  const knowledgeIcon = (
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
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <path d="M9 7h6" />
      <path d="M9 11h4" />
    </svg>
  );

  const userName = user?.name || "Abhiraj Sharma";
  const userUsername = user?.username ? `@${user.username.replace(/^@/, "")}` : "@abhiraj";

  return (
    <aside
      id="app-sidebar"
      aria-label="Application navigation"
      className={`relative hidden md:flex flex-col justify-between shrink-0 h-full border-r border-border-subtle bg-bg-secondary select-none transition-[width] duration-300 ease-in-out motion-reduce:transition-none z-10 ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Top Navigation Items */}
      <nav className="p-2 sm:p-3 space-y-1.5" aria-label="Main Sections">
        <SidebarItem
          id="chat"
          label="Chat"
          icon={chatIcon}
          isActive={activeTab === "chat"}
          isCollapsed={isCollapsed}
          onClick={() => onSelectTab("chat")}
        />

        <SidebarItem
          id="knowledge"
          label="Knowledge Base"
          icon={knowledgeIcon}
          isActive={activeTab === "knowledge"}
          isCollapsed={isCollapsed}
          onClick={() => onSelectTab("knowledge")}
        />
      </nav>

      {/* User Identity Section - Anchored at the bottom */}
      <div className="border-t border-border-subtle p-2 sm:p-2.5">
        <Link
          href="/profile"
          className={`group flex items-center rounded-xl transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky hover:bg-surface-secondary/70 ${
            isCollapsed
              ? "justify-center p-2"
              : "gap-3 p-2.5"
          }`}
          aria-label={`View profile for ${userName}`}
          title={isCollapsed ? `${userName} (${userUsername}) - View Profile` : undefined}
        >
          {/* Dynamic Avatar */}
          <UserAvatar name={userName} size="md" />

          {/* User Details (Hidden when collapsed) */}
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <span className="block text-xs font-semibold text-text-primary group-hover:text-accent-sky transition-colors truncate">
                {userName}
              </span>
              <span className="block text-[11px] text-text-muted truncate">
                {userUsername}
              </span>
            </div>
          )}

          {/* Subtle profile indicator arrow when expanded */}
          {!isCollapsed && (
            <svg
              className="h-3.5 w-3.5 text-text-muted opacity-60 group-hover:opacity-100 group-hover:text-accent-sky transition-all shrink-0"
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
          )}
        </Link>
      </div>
    </aside>
  );
}
