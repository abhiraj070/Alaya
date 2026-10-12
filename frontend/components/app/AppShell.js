"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
import AppHeader from "@/components/app/AppHeader";
import Sidebar from "@/components/app/Sidebar";
import MobileDrawer from "@/components/app/MobileDrawer";
import WorkspacePlaceholder from "@/components/app/WorkspacePlaceholder";
import { getStoredUser, subscribeUserStorage, mockUser } from "@/mock/users";

export default function AppShell() {
  // On tablet screens, default to collapsed sidebar to maximize workspace area
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window !== "undefined" && window.innerWidth >= 768 && window.innerWidth < 1024) {
      return true;
    }
    return false;
  });

  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("chat"); // Chat active by default

  // Synchronize user profile with external browser storage safely
  const currentUser = useSyncExternalStore(
    subscribeUserStorage,
    getStoredUser,
    () => mockUser
  );

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
          user={currentUser}
        />

        {/* Mobile Navigation Drawer (Overlay on mobile) */}
        <MobileDrawer
          isOpen={isMobileDrawerOpen}
          onClose={() => setIsMobileDrawerOpen(false)}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          user={currentUser}
        />

        {/* Resizing Main Content Area */}
        <main
          className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-bg-primary transition-all duration-300 motion-reduce:transition-none"
          id="main-workspace-content"
          role="region"
          aria-label={activeTab === "chat" ? "Chat Workspace" : "Knowledge Base Workspace"}
        >
          <WorkspacePlaceholder activeTab={activeTab} />
        </main>
      </div>
    </div>
  );
}
