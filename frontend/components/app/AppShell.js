"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import AppHeader from "@/components/app/AppHeader";
import Sidebar from "@/components/app/Sidebar";
import MobileDrawer from "@/components/app/MobileDrawer";
import Chat from "@/components/app/Chat";
import ChatEmptyState from "@/components/app/ChatEmptyState";
import KnowledgeBaseManager from "@/components/app/KnowledgeBaseManager";
import DeleteChatModal from "@/components/app/DeleteChatModal";
import { useAuth } from "@/lib/auth-context";
import { useLocalStorage } from "@/lib/use-local-storage";
import { chatApi, messagesApi } from "@/lib/api";
import { normalizeChat, normalizeMessages, sortChats } from "@/lib/chat-data";

const EMPTY_PINS = [];

export default function AppShell() {
  const { user, ready } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (ready && !user) router.replace("/auth?mode=signin");
  }, [ready, user, router]);
  if (!ready || !user) return <div role="status" className="grid h-screen place-items-center text-text-muted">Loading workspace...</div>;
  return <Workspace key={user.id} user={user} />;
}

function Workspace({ user }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");
  const [sidebarWidth, saveSidebarWidth] = useLocalStorage("alaya_sidebar_width", 260);
  const [dragWidth, setDragWidth] = useState(null);
  const [isResizing, setIsResizing] = useState(false);
  const widthRef = useRef(260);
  const [pinnedChatIds, setPinnedChatIds] = useLocalStorage(`alaya_pinned_chats:${user.id}`, EMPTY_PINS);
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [chatToDelete, setChatToDelete] = useState(null);
  const [isDeletingChat, setIsDeletingChat] = useState(false);
  const [error, setError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const createRequest = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    chatApi.getChats(user.id, { signal: controller.signal }).then((data) => {
      if (controller.signal.aborted) return;
      const next = sortChats(data.map(normalizeChat));
      setChats(next);
      setActiveChatId(next[0]?.id ?? null);
    }).catch((err) => {
      if (!controller.signal.aborted) setError(err.message);
    }).finally(() => {
      if (!controller.signal.aborted) setIsLoadingChats(false);
    });
    return () => controller.abort();
  }, [user.id]);

  useEffect(() => {
    if (activeChatId === null) return;
    const controller = new AbortController();
    messagesApi.getMessages(activeChatId, { signal: controller.signal }).then((data) => {
      if (!controller.signal.aborted) setChats((previous) => previous.map((chat) =>
        chat.id === activeChatId ? { ...chat, messages: normalizeMessages(data) } : chat));
    }).catch((err) => {
      if (!controller.signal.aborted) setError(err.message);
    }).finally(() => {
      if (!controller.signal.aborted) setIsLoadingMessages(false);
    });
    return () => controller.abort();
  }, [activeChatId]);

  const activeChat = chats.find((chat) => chat.id === activeChatId);
  const setMessages = useCallback((update) => {
    setChats((previous) => previous.map((chat) => chat.id === activeChatId
      ? { ...chat, messages: typeof update === "function" ? update(chat.messages) : update }
      : chat));
  }, [activeChatId]);

  const selectChat = (id) => {
    setIsLoadingMessages(id !== null && id !== activeChatId);
    setActiveChatId(id);
    setActiveTab("chat");
  };

  const newChat = async () => {
    if (createRequest.current) return;
    createRequest.current = true;
    setIsCreatingChat(true);
    try {
      const created = normalizeChat(await chatApi.createChat(user.id));
      setChats((previous) => [created, ...previous]);
      selectChat(created.id);
      setError("");
    } catch (err) { setError(err.message); }
    finally { createRequest.current = false; setIsCreatingChat(false); }
  };

  const updateTitle = async (id, title) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    await chatApi.updateChatTitle(id, trimmed);
    setChats((previous) => previous.map((chat) => chat.id === id ? { ...chat, title: trimmed } : chat));
  };

  const deleteChat = async () => {
    if (!chatToDelete || isDeletingChat) return;
    setIsDeletingChat(true);
    setDeleteError("");
    try {
      await chatApi.deleteChat(chatToDelete.id);
      const next = chats.filter((chat) => chat.id !== chatToDelete.id);
      setChats(next);
      if (activeChatId === chatToDelete.id) selectChat(next[0]?.id ?? null);
      setPinnedChatIds((previous) => previous.filter((id) => id !== chatToDelete.id));
      setChatToDelete(null);
    } catch (err) { setDeleteError(err.message); }
    finally { setIsDeletingChat(false); }
  };

  useEffect(() => {
    if (!isResizing) return;
    const onMove = (event) => {
      widthRef.current = Math.min(460, Math.max(220, event.clientX));
      setDragWidth(widthRef.current);
    };
    const onUp = () => {
      saveSidebarWidth(widthRef.current);
      setIsResizing(false);
      setDragWidth(null);
    };
    const previousCursor = document.body.style.cursor;
    const previousSelect = document.body.style.userSelect;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      document.body.style.cursor = previousCursor;
      document.body.style.userSelect = previousSelect;
    };
  }, [isResizing, saveSidebarWidth]);

  const toggleSidebar = () => {
    if (window.innerWidth < 768) setIsMobileDrawerOpen((open) => !open);
    else setIsSidebarCollapsed((collapsed) => !collapsed);
  };
  const navigation = {
    activeTab, onSelectTab: setActiveTab, chats, activeChatId, onNewChat: newChat,
    isCreatingChat, onSelectChat: selectChat, onUpdateChatTitle: updateTitle, user,
    isLoadingChats, deletingChatId: isDeletingChat ? chatToDelete?.id : null,
    pinnedChatIds: Array.isArray(pinnedChatIds) ? pinnedChatIds : EMPTY_PINS,
    onDeleteChat: (id) => { setDeleteError(""); setChatToDelete(chats.find((chat) => chat.id === id)); },
    onTogglePinChat: (id) => setPinnedChatIds((previous) => previous.includes(id)
      ? previous.filter((pin) => pin !== id) : [id, ...previous]),
  };

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-bg-primary text-text-primary selection:bg-accent-sky/25 selection:text-text-primary">
      <Sidebar {...navigation} isCollapsed={isSidebarCollapsed} onToggleCollapse={toggleSidebar}
        sidebarWidth={dragWidth ?? Math.min(460, Math.max(220, Number(sidebarWidth) || 260))}
        isResizing={isResizing} onStartResize={(event) => { event.preventDefault(); setIsResizing(true); }}
        onResetWidth={() => saveSidebarWidth(260)} />
      <MobileDrawer {...navigation} isOpen={isMobileDrawerOpen} onClose={() => setIsMobileDrawerOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-bg-primary">
        <AppHeader isSidebarCollapsed={isSidebarCollapsed} isMobileDrawerOpen={isMobileDrawerOpen}
          onToggleSidebar={toggleSidebar} onNewChat={newChat} isCreatingChat={isCreatingChat} activeTab={activeTab} user={user} />
        {error && <div role="alert" className="flex items-center justify-between gap-3 border-b border-rose-500/30 p-3 text-xs text-rose-400">
          {error}<button type="button" onClick={() => window.location.reload()} className="underline">Retry</button>
        </div>}
        <main id="main-workspace-content" className="flex-1 flex flex-col min-w-0 overflow-hidden bg-bg-primary transition-all duration-300 motion-reduce:transition-none" aria-label={activeTab === "chat" ? "Ask workspace" : "Knowledge base"}>
          {activeTab === "knowledge" ? <div className="flex-1 min-h-0 overflow-y-auto chat-scrollbar flex flex-col"><KnowledgeBaseManager /></div>
            : isLoadingChats || isLoadingMessages ? <div className="flex-1 flex flex-col items-center justify-center gap-3 animate-fadeIn">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-sky border-t-transparent" role="status" aria-label="Loading conversation..." />
                <span className="text-xs text-text-muted font-medium">{isLoadingChats ? "Loading chats..." : "Loading messages..."}</span>
              </div>
            : activeChat ? <Chat key={activeChat.id} chatId={activeChat.id} messages={activeChat.messages} setMessages={setMessages}
                onFirstMessage={(text) => {
                  const updatedAt = new Date().toISOString();
                  setChats((previous) => sortChats(previous.map((chat) => chat.id === activeChat.id ? { ...chat, updatedAt } : chat)));
                  if (activeChat.title.toLowerCase() === "new chat") updateTitle(activeChat.id, text.slice(0, 40)).catch((err) => setError(err.message));
                }} />
            : <div className="flex flex-1 flex-col items-center justify-center pb-8"><ChatEmptyState /><button type="button" className="btn-primary" disabled={isCreatingChat} onClick={newChat}>New chat</button></div>}
        </main>
      </div>
      {chatToDelete && <DeleteChatModal chat={chatToDelete} isDeleting={isDeletingChat}
        error={deleteError} onClose={() => setChatToDelete(null)} onConfirm={deleteChat} />}
    </div>
  );
}
