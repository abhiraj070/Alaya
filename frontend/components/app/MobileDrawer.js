"use client";

import { useEffect } from "react";
import Link from "next/link";
import AlayaWordmark from "@/components/ui/AlayaWordmark";
import UserAvatar from "@/components/ui/UserAvatar";

export default function MobileDrawer({
  isOpen = false,
  onClose,
  activeTab = "chat",
  onSelectTab,
  chats = [],
  activeChatId,
  onNewChat,
  onSelectChat,
  user,
}) {
  // Close on Escape key and lock background scroll while drawer is open
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  const userName = user?.name || "Abhiraj Sharma";
  const userUsername = user?.username ? `@${user.username.replace(/^@/, "")}` : "@abhiraj";

  const askIcon = (
    <svg
      className="h-5 w-5"
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
      className="h-5 w-5"
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

  return (
    <div
      className={`fixed inset-0 z-50 md:hidden transition-visibility duration-300 ${
        isOpen ? "visible" : "invisible pointer-events-none"
      }`}
      aria-hidden={!isOpen}
    >
      {/* Semi-transparent Backdrop */}
      <div
        className={`fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity duration-300 motion-reduce:transition-none cursor-pointer ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-out Drawer Panel */}
      <aside
        role="dialog"
        id="mobile-nav-drawer"
        aria-modal="true"
        aria-label="Navigation drawer"
        className={`relative z-10 flex h-full w-72 max-w-[85vw] flex-col justify-between border-r border-border-strong bg-bg-secondary p-4 shadow-[0_0_50px_rgba(0,0,0,0.85)] transition-transform duration-300 ease-in-out motion-reduce:transition-none select-none ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Drawer Header: Brand + Close Button */}
          <div className="flex items-center justify-between pb-4 border-b border-border-subtle shrink-0">
            <Link
              href="/app"
              onClick={onClose}
              className="flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky rounded-md py-1"
              aria-label="Alaya Application Home"
            >
              <AlayaWordmark className="text-xl font-extrabold tracking-[0.22em] select-none" />
            </Link>

            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-subtle bg-surface-secondary text-text-muted hover:text-text-primary hover:border-accent-sky/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky"
              aria-label="Close navigation drawer"
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
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* New Chat Button (Positioned above Ask) */}
          <div className="mt-3 shrink-0">
            <button
              type="button"
              onClick={() => {
                onNewChat();
                onClose();
              }}
              className="group flex h-10 w-full items-center gap-3 px-3 py-2 rounded-xl border border-dashed border-border-strong hover:border-accent-sky/50 bg-surface-secondary/70 hover:bg-surface-secondary text-text-primary hover:text-accent-sky transition-all duration-200 cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky"
              aria-label="New chat"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-accent-sky/15 text-accent-sky group-hover:bg-accent-sky group-hover:text-bg-primary transition-all">
                {plusIcon}
              </span>
              <span className="truncate text-sm font-semibold tracking-wide">
                New chat
              </span>
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="mt-2.5 space-y-1.5 shrink-0" aria-label="Mobile navigation">
            <button
              type="button"
              onClick={() => {
                onSelectTab("chat");
                onClose();
              }}
              className={`relative flex items-center gap-3 w-full rounded-xl px-3.5 py-2.5 text-left transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky ${
                activeTab === "chat"
                  ? "bg-accent-sky/10 text-accent-sky border border-accent-sky/30 font-medium shadow-[0_0_14px_rgba(56,189,248,0.08)]"
                  : "border border-transparent text-text-secondary hover:text-text-primary hover:bg-surface-secondary/70"
              }`}
            >
              {activeTab === "chat" && (
                <span
                  className="absolute left-1 top-2.5 bottom-2.5 w-1 rounded-full bg-accent-sky shadow-[0_0_8px_rgba(56,189,248,0.6)]"
                  aria-hidden="true"
                />
              )}
              <span className={activeTab === "chat" ? "text-accent-sky" : "text-text-secondary"}>
                {askIcon}
              </span>
              <span className="truncate text-sm font-medium tracking-wide">
                Ask
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                onSelectTab("knowledge");
                onClose();
              }}
              className={`relative flex items-center gap-3 w-full rounded-xl px-3.5 py-2.5 text-left transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky ${
                activeTab === "knowledge"
                  ? "bg-accent-sky/10 text-accent-sky border border-accent-sky/30 font-medium shadow-[0_0_14px_rgba(56,189,248,0.08)]"
                  : "border border-transparent text-text-secondary hover:text-text-primary hover:bg-surface-secondary/70"
              }`}
            >
              {activeTab === "knowledge" && (
                <span
                  className="absolute left-1 top-2.5 bottom-2.5 w-1 rounded-full bg-accent-sky shadow-[0_0_8px_rgba(56,189,248,0.6)]"
                  aria-hidden="true"
                />
              )}
              <span className={activeTab === "knowledge" ? "text-accent-sky" : "text-text-secondary"}>
                {knowledgeIcon}
              </span>
              <span className="truncate text-sm font-medium tracking-wide">
                Knowledge Base
              </span>
            </button>
          </nav>

          {/* Horizontal Line Below Knowledge Base */}
          <div className="my-3 mx-1 border-t border-border-subtle shrink-0" role="separator" />

          {/* All Chats Container */}
          <div className="flex-1 flex flex-col min-h-0 rounded-xl border border-border-strong/40 bg-surface-secondary/70 p-2 shadow-xs mb-2">
            <div className="flex items-center justify-between px-2 py-1 mb-1 text-[11px] font-semibold tracking-wider text-text-muted uppercase shrink-0">
              <span className="flex items-center gap-1.5">
                <svg className="h-3 w-3 text-text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                All Chats
              </span>
              <span className="text-[10px] font-mono font-normal text-text-muted/80">{chats.length}</span>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto chat-scrollbar space-y-1 pr-0.5">
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
                        onClose();
                      }}
                      className={`group flex items-center justify-between w-full px-2.5 py-2 rounded-lg text-left text-xs transition-all duration-150 cursor-pointer ${
                        isCurrent
                          ? "bg-accent-sky/15 text-accent-sky font-medium border border-accent-sky/30 shadow-xs"
                          : "text-text-secondary hover:text-text-primary hover:bg-surface-tertiary/70 border border-transparent"
                      }`}
                    >
                      <span className="truncate flex-1">{chat.title || "New chat"}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* User Identity Section at Bottom */}
        <div className="border-t border-border-subtle pt-3 shrink-0">
          <Link
            href="/profile"
            onClick={onClose}
            className="group flex items-center gap-3 rounded-xl p-2.5 transition-all duration-200 cursor-pointer hover:bg-surface-secondary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky"
            aria-label={`View profile for ${userName}`}
          >
            <UserAvatar name={userName} size="md" />
            <div className="flex-1 min-w-0">
              <span className="block text-xs font-semibold text-text-primary group-hover:text-accent-sky transition-colors truncate">
                {userName}
              </span>
              <span className="block text-[11px] text-text-muted truncate">
                {userUsername}
              </span>
            </div>
            <svg
              className="h-4 w-4 text-text-muted opacity-60 group-hover:opacity-100 group-hover:text-accent-sky transition-all shrink-0"
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
          </Link>
        </div>
      </aside>
    </div>
  );
}
