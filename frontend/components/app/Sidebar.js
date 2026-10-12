"use client";

import Link from "next/link";
import SidebarItem from "@/components/app/SidebarItem";
import UserAvatar from "@/components/ui/UserAvatar";

export default function Sidebar({
  isCollapsed = false,
  activeTab = "chat",
  onSelectTab,
  chats = [],
  activeChatId,
  onNewChat,
  onSelectChat,
  user,
}) {
  const askIcon = (
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

  const plusIcon = (
    <svg
      className="h-4.5 w-4.5"
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
      {/* Top Navigation & Chats Section */}
      <div className="flex-1 overflow-y-auto chat-scrollbar p-2 sm:p-3 flex flex-col min-h-0">
        {/* New Chat Button (Positioned above Ask) */}
        <div className="mb-2 shrink-0">
          {isCollapsed ? (
            <button
              type="button"
              onClick={onNewChat}
              title="New chat"
              aria-label="New chat"
              className="flex h-10 w-full items-center justify-center rounded-xl border border-dashed border-border-strong hover:border-accent-sky/50 bg-surface-secondary/70 hover:bg-surface-secondary text-text-secondary hover:text-accent-sky transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky"
            >
              {plusIcon}
            </button>
          ) : (
            <button
              type="button"
              onClick={onNewChat}
              className="group flex h-10 w-full items-center gap-3 px-3 py-2 rounded-xl border border-dashed border-border-strong hover:border-accent-sky/50 bg-surface-secondary/70 hover:bg-surface-secondary text-text-primary hover:text-accent-sky transition-all duration-200 cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky"
              aria-label="New chat"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-accent-sky/15 text-accent-sky group-hover:bg-accent-sky group-hover:text-bg-primary transition-all">
                {plusIcon}
              </span>
              <span className="truncate text-xs sm:text-sm font-semibold tracking-wide">
                New chat
              </span>
            </button>
          )}
        </div>

        {/* Core Nav Items: Ask and Knowledge Base */}
        <nav className="space-y-1.5 shrink-0" aria-label="Main Sections">
          <SidebarItem
            id="chat"
            label="Ask"
            icon={askIcon}
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

        {/* Horizontal Line Below Knowledge Base (Carefully spaced, professional and premium) */}
        <div className="my-3 mx-1 border-t border-border-subtle shrink-0" role="separator" />

        {/* All Chats Container with Rounded Borders and Slightly Lighter Background */}
        {isCollapsed ? (
          <div
            className="flex flex-col items-center py-2 px-1 rounded-xl bg-surface-secondary/70 border border-border-subtle"
            title={`All Chats (${chats.length})`}
          >
            <button
              type="button"
              onClick={() => onSelectTab("chat")}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:text-accent-sky hover:bg-surface-tertiary transition-colors"
              aria-label={`All Chats (${chats.length})`}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </button>
            <span className="text-[10px] font-mono text-text-muted mt-0.5">{chats.length}</span>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0 rounded-xl border border-border-strong/40 bg-surface-secondary/70 p-2 shadow-xs">
            {/* Header: All Chats */}
            <div className="flex items-center justify-between px-2 py-1 mb-1 text-[11px] font-semibold tracking-wider text-text-muted uppercase shrink-0">
              <span className="flex items-center gap-1.5">
                <svg className="h-3 w-3 text-text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                All Chats
              </span>
              <span className="text-[10px] font-mono font-normal text-text-muted/80">{chats.length}</span>
            </div>

            {/* List of Chats */}
            <div className="flex-1 overflow-y-auto chat-scrollbar space-y-1 pr-0.5 min-h-[70px]">
              {chats.length === 0 ? (
                <div className="px-2 py-3 text-center text-xs text-text-muted italic">
                  No chats yet
                </div>
              ) : (
                chats.map((chat) => {
                  const isCurrent = activeChatId === chat.id && activeTab === "chat";
                  return (
                    <button
                      key={chat.id}
                      type="button"
                      onClick={() => {
                        onSelectChat(chat.id);
                        onSelectTab("chat");
                      }}
                      className={`group flex items-center justify-between w-full px-2.5 py-2 rounded-lg text-left text-xs transition-all duration-150 cursor-pointer ${
                        isCurrent
                          ? "bg-accent-sky/15 text-accent-sky font-medium border border-accent-sky/30 shadow-xs"
                          : "text-text-secondary hover:text-text-primary hover:bg-surface-tertiary/70 border border-transparent"
                      }`}
                    >
                      <span className="truncate flex-1 pr-2">{chat.title || "New chat"}</span>
                      {isCurrent && (
                        <span className="h-1.5 w-1.5 rounded-full bg-accent-sky shrink-0 shadow-[0_0_6px_rgba(56,189,248,0.8)]" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* User Identity Section - Anchored at the bottom */}
      <div className="border-t border-border-subtle p-2 sm:p-2.5 shrink-0">
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
