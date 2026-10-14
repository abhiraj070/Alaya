"use client";

import { useRef } from "react";
import Link from "next/link";
import AlayaWordmark from "@/components/ui/AlayaWordmark";
import SidebarItem from "@/components/app/SidebarItem";
import UserAvatar from "@/components/ui/UserAvatar";
import ChatItem from "@/components/app/ChatItem";

export default function Sidebar({
  isCollapsed = false,
  onToggleCollapse,
  sidebarWidth = 260,
  isResizing = false,
  onStartResize,
  onResetWidth,
  activeTab = "chat",
  onSelectTab,
  chats = [],
  activeChatId,
  onNewChat,
  isCreatingChat = false,
  onSelectChat,
  onUpdateChatTitle,
  onDeleteChat,
  user,
  isLoadingChats = false,
  deletingChatId = null,
}) {
  const chatListRef = useRef(null);
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
      aria-hidden={isCollapsed}
      style={{
        width: isCollapsed ? 0 : sidebarWidth,
        transition: isResizing
          ? "none"
          : "width 280ms cubic-bezier(0.4, 0, 0.2, 1), opacity 200ms ease",
      }}
      className={`relative hidden md:flex flex-col shrink-0 h-screen border-r border-border-subtle bg-bg-secondary select-none z-30 overflow-hidden ${
        isCollapsed ? "opacity-0 pointer-events-none border-r-0" : "opacity-100"
      }`}
    >
      {/* Inner container with fixed width matching sidebarWidth to prevent content squishing during collapse */}
      <div
        className="flex flex-col h-full overflow-hidden"
        style={{ width: sidebarWidth, minWidth: sidebarWidth }}
      >
        {/* Top Header of Sidebar: ALAYA Brand & Collapse Sidebar Button */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-border-subtle px-3 sm:px-3.5">
          <Link
            href="/"
            className="flex items-center group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky rounded-lg py-1 px-1.5 transition-opacity hover:opacity-85"
            aria-label="Alaya Homepage"
            title="Alaya - Go to homepage"
          >
            <AlayaWordmark className="text-lg sm:text-xl font-extrabold tracking-[0.22em] select-none" />
          </Link>

          <button
            type="button"
            onClick={onToggleCollapse}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-secondary transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky"
            aria-label="Close sidebar"
            title="Close sidebar"
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
              <path d="m14 9-3 3 3 3" />
            </svg>
          </button>
        </div>

        {/* Top Navigation & Chats Section */}
        <div
          className="flex-1 overflow-hidden p-2 sm:p-3 flex flex-col min-h-0"
          onWheel={(e) => {
            if (chatListRef.current && !chatListRef.current.contains(e.target)) {
              chatListRef.current.scrollTop += e.deltaY;
            }
          }}
        >
          {/* New Chat Button */}
          <div className="mb-2 shrink-0">
            <button
              type="button"
              onClick={onNewChat}
              disabled={isCreatingChat}
              className="group flex h-10 w-full items-center gap-3 px-3 py-2 rounded-xl border border-dashed border-border-strong hover:border-accent-sky/50 bg-surface-secondary/70 hover:bg-surface-secondary text-text-primary hover:text-accent-sky transition-all duration-200 cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky disabled:opacity-60"
              aria-label="New chat"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-accent-sky/15 text-accent-sky group-hover:bg-accent-sky group-hover:text-bg-primary transition-all">
                {isCreatingChat ? (
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-accent-sky border-t-transparent" />
                ) : (
                  plusIcon
                )}
              </span>
              <span className="truncate text-xs sm:text-sm font-semibold tracking-wide">
                {isCreatingChat ? "Creating..." : "New chat"}
              </span>
            </button>
          </div>

          {/* Core Nav Items: Ask and Knowledge Base */}
          <nav className="space-y-1.5 shrink-0" aria-label="Main Sections">
            <SidebarItem
              id="chat"
              label="Ask"
              icon={askIcon}
              isActive={activeTab === "chat"}
              isCollapsed={false}
              onClick={() => onSelectTab("chat")}
            />

            <SidebarItem
              id="knowledge"
              label="Knowledge Base"
              icon={knowledgeIcon}
              isActive={activeTab === "knowledge"}
              isCollapsed={false}
              onClick={() => onSelectTab("knowledge")}
            />
          </nav>

          {/* Horizontal Line Below Knowledge Base */}
          <div className="my-3 mx-1 border-t border-border-subtle shrink-0" role="separator" />

        {/* All Chats Container */}
        <div
          className="flex-1 flex flex-col min-h-0 rounded-xl border border-border-strong/40 bg-surface-secondary/70 p-2 shadow-xs"
          onWheel={(e) => {
            if (chatListRef.current && !chatListRef.current.contains(e.target)) {
              chatListRef.current.scrollTop += e.deltaY;
            }
          }}
        >
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
          <div
            ref={chatListRef}
            className="flex-1 min-h-0 overflow-y-auto chat-scrollbar space-y-1 pr-0.5"
            style={{ touchAction: "pan-y" }}
          >
            {isLoadingChats ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2 text-text-muted">
                <div
                  className="h-5 w-5 animate-spin rounded-full border-2 border-accent-sky border-t-transparent"
                  role="status"
                  aria-label="Loading chats..."
                />
                <span className="text-[11px] text-text-muted font-medium tracking-wide">
                  Loading chats...
                </span>
              </div>
            ) : chats.length === 0 ? (
              <div className="px-2 py-3 text-center text-xs text-text-muted italic">
                No chats yet
              </div>
            ) : (
              chats.map((chat) => (
                <ChatItem
                  key={chat.id}
                  chat={chat}
                  isCurrent={activeChatId === chat.id && activeTab === "chat"}
                  isDeleting={deletingChatId === chat.id}
                  onSelect={() => {
                    onSelectChat(chat.id);
                    onSelectTab("chat");
                  }}
                  onUpdateTitle={onUpdateChatTitle}
                  onDelete={onDeleteChat}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* User Identity Section - Anchored at the bottom */}
      <div className="border-t border-border-subtle p-2 sm:p-2.5 shrink-0">
        <Link
          href="/profile"
          className="group flex items-center gap-3 p-2.5 rounded-xl transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky hover:bg-surface-secondary/70"
          aria-label={`View profile for ${userName}`}
        >
          {/* Dynamic Avatar */}
          <UserAvatar name={userName} size="md" />

          {/* User Details */}
          <div className="flex-1 min-w-0">
            <span className="block text-xs font-semibold text-text-primary group-hover:text-accent-sky transition-colors truncate">
              {userName}
            </span>
            <span className="block text-[11px] text-text-muted truncate">
              {userUsername}
            </span>
          </div>

          {/* Subtle profile indicator arrow */}
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
        </Link>
      </div>
    </div>

    {/* Draggable Resize Handle on Right Border */}
    {!isCollapsed && (
      <div
        onMouseDown={onStartResize}
        onDoubleClick={onResetWidth}
        title="Drag to resize sidebar (double-click to reset)"
        className="absolute top-0 -right-1.5 w-3 h-full cursor-col-resize z-40 group flex items-center justify-center select-none"
      >
        <div
          className={`w-[2px] h-full transition-colors duration-150 ${
            isResizing
              ? "bg-accent-sky"
              : "bg-transparent group-hover:bg-accent-sky/70"
          }`}
        />
      </div>
    )}
  </aside>
  );
}
