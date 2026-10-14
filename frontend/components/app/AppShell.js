"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
import AppHeader from "@/components/app/AppHeader";
import Sidebar from "@/components/app/Sidebar";
import MobileDrawer from "@/components/app/MobileDrawer";
import WorkspacePlaceholder from "@/components/app/WorkspacePlaceholder";
import Chat from "@/components/app/Chat";
import KnowledgeBaseManager from "@/components/app/KnowledgeBaseManager";
import { getStoredUser, subscribeUserStorage, mockUser } from "@/mock/users";
import { mockChats } from "@/mock/chat";
import { useAuth } from "@/lib/auth-context";

export default function AppShell() {
  // Default to expanded; tablet auto-collapse handled after mount to prevent hydration mismatch
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("chat"); // Chat (Ask) active by default
  const [chats, setChats] = useState(mockChats);
  const [activeChatId, setActiveChatId] = useState("chat-1");

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

  const handleNewChat = () => {
    const newId = `chat-${Date.now()}`;
    const newChat = {
      id: newId,
      title: "New chat",
      messages: [],
      createdAt: Date.now(),
    };
    setChats((prev) => [newChat, ...prev]);
    setActiveChatId(newId);
    setActiveTab("chat");
  };

  const handleSelectChat = (chatId) => {
    setActiveChatId(chatId);
    setActiveTab("chat");
  };

  const { user } = useAuth();

  // Synchronize user profile with external browser storage safely
  const storedUser = useSyncExternalStore(
    subscribeUserStorage,
    getStoredUser,
    () => mockUser
  );

  const currentUser = user?.isAuthenticated ? user : storedUser;

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
        user={currentUser}
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
          user={currentUser}
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
          user={currentUser}
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
              key={activeChat?.id}
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
