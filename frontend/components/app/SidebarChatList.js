"use client";

import ChatItem from "@/components/app/ChatItem";

export default function SidebarChatList({ listRef, mobile = false, chats, pinnedChatIds, activeChatId, activeTab, deletingChatId, isLoadingChats, onSelectChat, onSelectTab, onUpdateChatTitle, onDeleteChat, onTogglePinChat, onNavigate }) {
  const pinnedChats = chats.filter((chat) => pinnedChatIds.includes(chat.id));
  const unpinnedChats = chats.filter((chat) => !pinnedChatIds.includes(chat.id));
  return (
<div
            ref={listRef}
            className={`flex-1 min-h-0 overflow-y-auto chat-scrollbar flex flex-col space-y-2.5 pr-0.5 ${mobile ? "mb-2" : ""}`}
            style={{ touchAction: "pan-y" }}
          >
            {/* Pinned Chats Section (Displayed above and out of All Chats box) */}
            {pinnedChats.length > 0 && (
              <div className="flex flex-col shrink-0 rounded-xl border border-border-strong/40 bg-surface-secondary/70 p-2 shadow-xs">
                {/* Header: Pinned Chats with Pin Icon */}
                <div className="flex items-center justify-between px-2 py-1 mb-1 text-[11px] font-semibold tracking-wider text-accent-sky uppercase shrink-0">
                  <span className="flex items-center gap-1.5">
                    <svg
                      className="h-3 w-3 text-accent-sky"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <line x1="12" y1="17" x2="12" y2="22" />
                      <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
                    </svg>
                    Pinned Chats
                  </span>
                  <span className="text-[10px] font-mono font-normal text-accent-sky/80">
                    {pinnedChats.length}
                  </span>
                </div>

                {/* List of Pinned Chats */}
                <div className="space-y-0.5">
                  {pinnedChats.map((chat) => (
                    <ChatItem
                      key={`pinned-${chat.id}`}
                      chat={chat}
                      isPinned={true}
                      isCurrent={activeChatId === chat.id && activeTab === "chat"}
                      isDeleting={deletingChatId === chat.id}
                      onSelect={() => {
                        onSelectChat(chat.id);
                        onSelectTab("chat");
                        onNavigate?.();
                      }}
                      onUpdateTitle={onUpdateChatTitle}
                      onDelete={onDeleteChat}
                      onTogglePin={onTogglePinChat}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* All Chats Container */}
            <div
              className={`flex flex-col grow shrink-0 ${
                pinnedChats.length === 0 ? "min-h-full" : "min-h-0"
              } rounded-xl border border-border-strong/40 bg-surface-secondary/70 p-2 shadow-xs`}
            >
              {/* Header: All Chats */}
              <div className="flex items-center justify-between px-2 py-1 mb-1 text-[11px] font-semibold tracking-wider text-text-muted uppercase shrink-0">
                <span className="flex items-center gap-1.5">
                  <svg className="h-3 w-3 text-text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  All Chats
                </span>
                <span className="text-[10px] font-mono font-normal text-text-muted/80">{unpinnedChats.length}</span>
              </div>

              {/* List of Unpinned Chats */}
              <div className="space-y-0.5">
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
                ) : unpinnedChats.length === 0 ? (
                  <div className="px-2 py-3 text-center text-xs text-text-muted italic">
                    {pinnedChats.length > 0 ? "No other chats" : "No chats yet"}
                  </div>
                ) : (
                  unpinnedChats.map((chat) => (
                    <ChatItem
                      key={chat.id}
                      chat={chat}
                      isPinned={false}
                      isCurrent={activeChatId === chat.id && activeTab === "chat"}
                      isDeleting={deletingChatId === chat.id}
                      onSelect={() => {
                        onSelectChat(chat.id);
                        onSelectTab("chat");
                        onNavigate?.();
                      }}
                      onUpdateTitle={onUpdateChatTitle}
                      onDelete={onDeleteChat}
                      onTogglePin={onTogglePinChat}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
  );
}
