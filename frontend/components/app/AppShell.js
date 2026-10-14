"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import AppHeader from "@/components/app/AppHeader";
import Sidebar from "@/components/app/Sidebar";
import MobileDrawer from "@/components/app/MobileDrawer";
import WorkspacePlaceholder from "@/components/app/WorkspacePlaceholder";
import Chat from "@/components/app/Chat";
import KnowledgeBaseManager from "@/components/app/KnowledgeBaseManager";
import DeleteChatModal from "@/components/app/DeleteChatModal";
import { useAuth } from "@/lib/auth-context";
import { chatApi, messagesApi } from "@/lib/api";

const DEFAULT_SIDEBAR_WIDTH = 260;
const MIN_SIDEBAR_WIDTH = 220;
const MAX_SIDEBAR_WIDTH = 460;

export default function AppShell() {
  const router = useRouter();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("chat"); // Chat (Ask) active by default

  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarWidthRef = useRef(DEFAULT_SIDEBAR_WIDTH);

  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [chatToDelete, setChatToDelete] = useState(null);
  const [isDeletingChat, setIsDeletingChat] = useState(false);

  const { user } = useAuth();

  // Initialize workspace chats whenever /app route opens or user changes
  useEffect(() => {
    let isMounted = true;

    async function initializeWorkspaceChats() {
      setIsLoadingChats(true);

      // If no authenticated backend user (id must be number), provide a local new chat session immediately
      if (!user?.id || typeof user.id !== "number" || !user?.isAuthenticated) {
        const localNewChat = {
          id: `chat-${Date.now()}`,
          title: "New chat",
          messages: [],
        };
        if (isMounted) {
          setChats([localNewChat]);
          setActiveChatId(localNewChat.id);
          setActiveTab("chat");
          setIsLoadingChats(false);
        }
        return;
      }

      try {
        // 1. Fetch user's existing chats from backend
        let existingChats = [];
        let authExpired = false;
        try {
          const data = await chatApi.getChats(user.id);
          existingChats = (Array.isArray(data) ? data : []).map((c) => ({
            id: c.id,
            title: c.chat_title || "New chat",
            userId: c.user_id,
            messages: [],
          }));
          existingChats.sort((a, b) =>
            typeof b.id === "number" && typeof a.id === "number" ? b.id - a.id : 0
          );
        } catch (err) {
          if (err?.status === 401) {
            authExpired = true;
          } else {
            console.error("Failed to load existing chats from backend:", err);
          }
        }

        // If backend session has no access token or is expired, fall back to local chat session
        if (authExpired) {
          const localNewChat = {
            id: `chat-${Date.now()}`,
            title: "New chat",
            messages: [],
          };
          if (isMounted) {
            setChats([localNewChat]);
            setActiveChatId(localNewChat.id);
            setActiveTab("chat");
          }
          return;
        }

        // 2. Check if the top chat is already an unused/empty "New chat"
        let canReuseTopChat = false;
        if (
          existingChats.length > 0 &&
          existingChats[0].title?.toLowerCase() === "new chat"
        ) {
          try {
            const msgs = await messagesApi.getMessages(existingChats[0].id);
            if (!Array.isArray(msgs) || msgs.length === 0) {
              canReuseTopChat = true;
            }
          } catch {
            canReuseTopChat = true;
          }
        }

        if (canReuseTopChat) {
          if (!isMounted) return;
          setChats(existingChats);
          setActiveChatId(existingChats[0].id);
          setActiveTab("chat");
          return;
        }

        // 3. Otherwise create a brand new chat session for this visit
        let newChat = null;
        try {
          const created = await chatApi.createChat(user.id, "New chat");
          newChat = {
            id: created.id,
            title: created.chat_title || "New chat",
            userId: created.user_id,
            messages: [],
          };
        } catch (err) {
          if (err?.status !== 401) {
            console.error("Failed to create new chat in backend, falling back to local chat:", err);
          }
          newChat = {
            id: `chat-${Date.now()}`,
            title: "New chat",
            userId: user.id,
            messages: [],
          };
        }

        if (!isMounted) return;
        setChats([newChat, ...existingChats]);
        setActiveChatId(newChat.id);
        setActiveTab("chat");
      } catch (err) {
        console.error("Error initializing workspace chats:", err);
      } finally {
        if (isMounted) {
          setIsLoadingChats(false);
        }
      }
    }

    initializeWorkspaceChats();

    return () => {
      isMounted = false;
    };
  }, [user?.id, user?.isAuthenticated]);

  // Load messages whenever activeChatId changes
  useEffect(() => {
    if (
      !activeChatId ||
      typeof activeChatId !== "number" ||
      typeof user?.id !== "number" ||
      !user?.isAuthenticated
    ) {
      return;
    }

    let isMounted = true;
    requestAnimationFrame(() => {
      if (isMounted) {
        setIsLoadingMessages(true);
      }
    });
    messagesApi
      .getMessages(activeChatId)
      .then((data) => {
        if (!isMounted) return;
        const normalized = (Array.isArray(data) ? data : []).map((m) => ({
          id: m.message_id || m.id,
          sender: m.sent_by === "USER" ? "user" : "alaya",
          text: m.message_content,
        }));

        setChats((prevChats) =>
          prevChats.map((c) =>
            c.id === activeChatId ? { ...c, messages: normalized } : c
          )
        );
      })
      .catch((err) => {
        if (err?.status !== 401) {
          console.error("Failed to load chat messages:", err);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingMessages(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [activeChatId, user?.id, user?.isAuthenticated]);

  const activeChat = chats.find((c) => c.id === activeChatId) || chats[0];
  const activeChatMessages = activeChat?.messages || [];

  const handleSetMessages = (newMessagesOrUpdater) => {
    setChats((prevChats) =>
      prevChats.map((c) => {
        if (c.id === (activeChat?.id || prevChats[0]?.id)) {
          const updatedMessages =
            typeof newMessagesOrUpdater === "function"
              ? newMessagesOrUpdater(c.messages)
              : newMessagesOrUpdater;
          let updatedTitle = c.title;
          if (c.title?.toLowerCase() === "new chat" && updatedMessages.length > 0) {
            const firstUserMsg = updatedMessages.find((m) => m.sender === "user");
            if (firstUserMsg?.text) {
              updatedTitle =
                firstUserMsg.text.length > 28
                  ? `${firstUserMsg.text.slice(0, 28)}...`
                  : firstUserMsg.text;
              if (typeof c.id === "number") {
                chatApi.updateChatTitle(c.id, updatedTitle).catch(() => {});
              }
            }
          }
          return {
            ...c,
            title: updatedTitle,
            messages: updatedMessages,
          };
        }
        return c;
      })
    );
  };

  // Create chat session dynamically via POST /api/chat/create_chat
  const handleNewChat = async () => {
    if (isCreatingChat) return;
    setIsCreatingChat(true);

    if (!user?.id || typeof user.id !== "number" || !user?.isAuthenticated) {
      const localChat = {
        id: `chat-${Date.now()}`,
        title: "New chat",
        messages: [],
      };
      setChats((prev) => [localChat, ...prev]);
      setActiveChatId(localChat.id);
      setActiveTab("chat");
      setIsCreatingChat(false);
      return;
    }

    try {
      const created = await chatApi.createChat(user.id, "New chat");
      const newChat = {
        id: created.id,
        title: created.chat_title || "New chat",
        userId: created.user_id,
        messages: [],
      };
      setChats((prev) => [newChat, ...prev]);
      setActiveChatId(newChat.id);
      setActiveTab("chat");
    } catch (err) {
      if (err?.status !== 401) {
        console.error("Failed to create chat in backend, using local chat fallback:", err);
      }
      const fallbackChat = {
        id: `chat-${Date.now()}`,
        title: "New chat",
        userId: user.id,
        messages: [],
      };
      setChats((prev) => [fallbackChat, ...prev]);
      setActiveChatId(fallbackChat.id);
      setActiveTab("chat");
    } finally {
      setIsCreatingChat(false);
    }
  };

  const handleSelectChat = (chatId) => {
    setActiveChatId(chatId);
    setActiveTab("chat");
  };

  // Update chat title dynamically via PUT /api/chat/update_chat/{chat_id}
  const handleUpdateChatTitle = async (chatId, newTitle) => {
    const trimmed = (newTitle || "").trim();
    if (!trimmed) return;

    if (typeof chatId === "number" && typeof user?.id === "number" && user?.isAuthenticated) {
      try {
        await chatApi.updateChatTitle(chatId, trimmed);
      } catch (err) {
        if (err?.status !== 401) {
          console.error("Failed to update chat title in backend:", err);
        }
      }
    }

    setChats((prev) =>
      prev.map((c) => (c.id === chatId ? { ...c, title: trimmed } : c))
    );
  };

  // Delete chat session dynamically via DELETE /api/chat/delete_chat/{chat_id}
  const handleDeleteChat = async (chatId) => {
    if (typeof chatId === "number" && typeof user?.id === "number" && user?.isAuthenticated) {
      try {
        await chatApi.deleteChat(chatId);
      } catch (err) {
        if (err?.status !== 401) {
          console.error("Failed to delete chat in backend:", err);
        }
      }
    }
    setChats((prev) => {
      const updated = prev.filter((c) => c.id !== chatId);
      if (updated.length === 0) {
        const freshChat = {
          id: `chat-${Date.now()}`,
          title: "New chat",
          messages: [],
        };
        setActiveChatId(freshChat.id);
        return [freshChat];
      }
      if (activeChatId === chatId) {
        setActiveChatId(updated[0]?.id || null);
      }
      return updated;
    });
  };

  // Close delete chat modal on Escape key
  useEffect(() => {
    if (!chatToDelete) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !isDeletingChat) {
        setChatToDelete(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [chatToDelete, isDeletingChat]);

  // Request deletion: opens confirmation modal
  const handleRequestDeleteChat = (chatOrId) => {
    const id = typeof chatOrId === "object" ? chatOrId?.id : chatOrId;
    const target =
      (typeof chatOrId === "object" && chatOrId?.title ? chatOrId : null) ||
      chats.find((c) => c.id === id) || { id, title: "New chat" };
    setChatToDelete(target);
  };

  // Confirm delete and perform API call
  const handleConfirmDeleteChat = async () => {
    if (!chatToDelete) return;
    const chatId = chatToDelete.id;
    setIsDeletingChat(true);
    try {
      await handleDeleteChat(chatId);
    } finally {
      setIsDeletingChat(false);
      setChatToDelete(null);
    }
  };

  // Initialize sidebar width from localStorage after mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("alaya_sidebar_width");
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= MIN_SIDEBAR_WIDTH && parsed <= MAX_SIDEBAR_WIDTH) {
          requestAnimationFrame(() => {
            setSidebarWidth(parsed);
          });
          sidebarWidthRef.current = parsed;
        }
      }
    } catch {}
  }, []);

  // Drag-to-resize handlers inspired by ChatGPT web
  const handleStartResize = (e) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const handleResetSidebarWidth = () => {
    setSidebarWidth(DEFAULT_SIDEBAR_WIDTH);
    sidebarWidthRef.current = DEFAULT_SIDEBAR_WIDTH;
    try {
      localStorage.setItem("alaya_sidebar_width", String(DEFAULT_SIDEBAR_WIDTH));
    } catch {}
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e) => {
      const newWidth = Math.min(
        MAX_SIDEBAR_WIDTH,
        Math.max(MIN_SIDEBAR_WIDTH, e.clientX)
      );
      sidebarWidthRef.current = newWidth;
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      try {
        localStorage.setItem("alaya_sidebar_width", String(sidebarWidthRef.current));
      } catch {}
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
  }, [isResizing]);

  // Automatically close mobile drawer when viewport expands to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileDrawerOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Unified toggle handler: opens mobile drawer on mobile, collapses sidebar on desktop
  const handleToggleSidebar = () => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setIsMobileDrawerOpen((prev) => !prev);
    } else {
      setIsSidebarCollapsed((prev) => !prev);
    }
  };

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-bg-primary text-text-primary selection:bg-accent-sky/25 selection:text-text-primary">
      {/* Desktop & Tablet Sidebar (Touches the top edge, full viewport height, draggable width) */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
        sidebarWidth={sidebarWidth}
        isResizing={isResizing}
        onStartResize={handleStartResize}
        onResetWidth={handleResetSidebarWidth}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        chats={chats}
        activeChatId={activeChatId}
        onNewChat={handleNewChat}
        isCreatingChat={isCreatingChat}
        onSelectChat={handleSelectChat}
        onUpdateChatTitle={handleUpdateChatTitle}
        onDeleteChat={handleRequestDeleteChat}
        user={user}
        isLoadingChats={isLoadingChats}
        deletingChatId={isDeletingChat ? chatToDelete?.id : null}
      />

      {/* Mobile Navigation Drawer (Overlay on mobile) */}
      <MobileDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        chats={chats}
        activeChatId={activeChatId}
        onNewChat={handleNewChat}
        isCreatingChat={isCreatingChat}
        onSelectChat={handleSelectChat}
        onUpdateChatTitle={handleUpdateChatTitle}
        onDeleteChat={handleRequestDeleteChat}
        user={user}
        isLoadingChats={isLoadingChats}
        deletingChatId={isDeletingChat ? chatToDelete?.id : null}
      />

      {/* Main Workspace Column (Header + Main Content) */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-bg-primary">
        {/* Top Application Header */}
        <AppHeader
          isSidebarCollapsed={isSidebarCollapsed}
          isMobileDrawerOpen={isMobileDrawerOpen}
          onToggleSidebar={handleToggleSidebar}
          onNewChat={handleNewChat}
          isCreatingChat={isCreatingChat}
          activeTab={activeTab}
          user={user}
        />

        {/* Resizing Main Content Area */}
        <main
          className="flex-1 flex flex-col min-w-0 overflow-hidden bg-bg-primary transition-all duration-300 motion-reduce:transition-none"
          id="main-workspace-content"
          role="region"
          aria-label={activeTab === "chat" ? "Ask Workspace" : "Knowledge Base Workspace"}
        >
          {activeTab === "chat" ? (
            isLoadingChats || (isLoadingMessages && (!activeChatMessages || activeChatMessages.length === 0)) ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 animate-fadeIn">
                <div
                  className="h-8 w-8 animate-spin rounded-full border-2 border-accent-sky border-t-transparent"
                  role="status"
                  aria-label="Loading conversation..."
                />
                <span className="text-xs text-text-muted font-medium">
                  {isLoadingChats ? "Loading chats..." : "Loading messages..."}
                </span>
              </div>
            ) : (
              <Chat
                key={activeChat?.id || "empty-chat"}
                chatId={activeChat?.id}
                messages={activeChatMessages}
                setMessages={handleSetMessages}
              />
            )
          ) : activeTab === "knowledge" ? (
            <div className="flex-1 min-h-0 overflow-y-auto chat-scrollbar flex flex-col">
              <KnowledgeBaseManager />
            </div>
          ) : (
            <div className="flex-1 min-h-0 overflow-y-auto chat-scrollbar flex flex-col">
              <WorkspacePlaceholder activeTab={activeTab} />
            </div>
          )}
        </main>
      </div>

      {/* Delete Chat Confirmation Modal */}
      {chatToDelete && (
        <DeleteChatModal
          chat={chatToDelete}
          isDeleting={isDeletingChat}
          onClose={() => setChatToDelete(null)}
          onConfirm={handleConfirmDeleteChat}
        />
      )}
    </div>
  );
}
