"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import AppHeader from "@/components/app/AppHeader";
import Sidebar from "@/components/app/Sidebar";
import MobileDrawer from "@/components/app/MobileDrawer";
import WorkspacePlaceholder from "@/components/app/WorkspacePlaceholder";
import Chat from "@/components/app/Chat";
import KnowledgeBaseManager from "@/components/app/KnowledgeBaseManager";
import { useAuth } from "@/lib/auth-context";
import { chatApi, messagesApi } from "@/lib/api";

export default function AppShell() {
  const router = useRouter();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("chat"); // Chat (Ask) active by default

  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [isLoadingChats, setIsLoadingChats] = useState(true);

  const { user } = useAuth();

  // Load user chats dynamically from backend API
  const loadChats = useCallback(async (userId) => {
    if (!userId) {
      setChats([]);
      setActiveChatId(null);
      setIsLoadingChats(false);
      return;
    }

    try {
      const data = await chatApi.getChats(userId);
      const normalized = (Array.isArray(data) ? data : []).map((c) => ({
        id: c.id,
        title: c.chat_title || "New chat",
        userId: c.user_id,
        messages: [],
      }));

      setChats(normalized);
      if (normalized.length > 0) {
        setActiveChatId((prev) =>
          prev && normalized.some((c) => c.id === prev) ? prev : normalized[0].id
        );
      } else {
        setActiveChatId(null);
      }
    } catch (err) {
      console.error("Failed to load user chats from backend:", err);
      setChats([]);
      setActiveChatId(null);
    } finally {
      setIsLoadingChats(false);
    }
  }, []);

  // Sync chats on user change
  useEffect(() => {
    let isMounted = true;

    if (!user?.id) {
      Promise.resolve().then(() => {
        if (isMounted) {
          setChats([]);
          setActiveChatId(null);
          setIsLoadingChats(false);
        }
      });
      return () => {
        isMounted = false;
      };
    }

    chatApi
      .getChats(user.id)
      .then((data) => {
        if (!isMounted) return;
        const normalized = (Array.isArray(data) ? data : []).map((c) => ({
          id: c.id,
          title: c.chat_title || "New chat",
          userId: c.user_id,
          messages: [],
        }));

        setChats(normalized);
        if (normalized.length > 0) {
          setActiveChatId((prev) =>
            prev && normalized.some((c) => c.id === prev) ? prev : normalized[0].id
          );
        } else {
          setActiveChatId(null);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Failed to load user chats from backend:", err);
        setChats([]);
        setActiveChatId(null);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingChats(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  // Load messages whenever activeChatId changes
  useEffect(() => {
    if (!activeChatId || typeof activeChatId !== "number") return;

    let isMounted = true;
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
        console.error("Failed to load chat messages:", err);
      });

    return () => {
      isMounted = false;
    };
  }, [activeChatId]);

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
          if (c.title === "New chat" && updatedMessages.length > 0) {
            const firstUserMsg = updatedMessages.find((m) => m.sender === "user");
            if (firstUserMsg?.text) {
              updatedTitle =
                firstUserMsg.text.length > 28
                  ? `${firstUserMsg.text.slice(0, 28)}...`
                  : firstUserMsg.text;
              chatApi.updateChatTitle(c.id, updatedTitle).catch(() => {});
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
    if (!user?.id) {
      router.push("/auth?mode=signin");
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
      console.error("Failed to create chat in backend:", err);
    }
  };

  const handleSelectChat = (chatId) => {
    setActiveChatId(chatId);
    setActiveTab("chat");
  };

  // Delete chat session dynamically via DELETE /api/chat/delete_chat/{chat_id}
  const handleDeleteChat = async (chatId) => {
    try {
      await chatApi.deleteChat(chatId);
      setChats((prev) => {
        const updated = prev.filter((c) => c.id !== chatId);
        if (activeChatId === chatId) {
          setActiveChatId(updated[0]?.id || null);
        }
        return updated;
      });
    } catch (err) {
      console.error("Failed to delete chat in backend:", err);
    }
  };

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
    <div className="relative flex h-screen w-screen flex-col overflow-hidden bg-bg-primary text-text-primary selection:bg-accent-sky/25 selection:text-text-primary">
      {/* Top Application Header */}
      <AppHeader
        isSidebarCollapsed={isSidebarCollapsed}
        isMobileDrawerOpen={isMobileDrawerOpen}
        onToggleSidebar={handleToggleSidebar}
        user={user}
      />

      {/* Main Workspace Area (Sidebar + Main Content Container) */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Desktop & Tablet Sidebar (Hidden on mobile) */}
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          chats={chats}
          activeChatId={activeChatId}
          onNewChat={handleNewChat}
          onSelectChat={handleSelectChat}
          onDeleteChat={handleDeleteChat}
          user={user}
          isLoadingChats={isLoadingChats}
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
          onSelectChat={handleSelectChat}
          onDeleteChat={handleDeleteChat}
          user={user}
          isLoadingChats={isLoadingChats}
        />

        {/* Resizing Main Content Area */}
        <main
          className="flex-1 flex flex-col min-w-0 overflow-hidden bg-bg-primary transition-all duration-300 motion-reduce:transition-none"
          id="main-workspace-content"
          role="region"
          aria-label={activeTab === "chat" ? "Ask Workspace" : "Knowledge Base Workspace"}
        >
          {activeTab === "chat" ? (
            <Chat
              key={activeChat?.id || "empty-chat"}
              chatId={activeChat?.id}
              messages={activeChatMessages}
              setMessages={handleSetMessages}
            />
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
    </div>
  );
}
