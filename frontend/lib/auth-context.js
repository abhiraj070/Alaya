"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authApi } from "@/lib/api";
import {
  getStoredUser,
  updateStoredUser,
  clearStoredUser,
  subscribeUserStorage,
  mockUser,
} from "@/mock/users";

const STORAGE_KEY = "alaya_user";

const AuthContext = createContext({
  user: null,
  isLoading: true,
  error: null,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  updateUser: () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Sync user state to browser storage
  const persistUser = useCallback((userData) => {
    if (typeof window === "undefined") return;
    try {
      if (userData) {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
      } else {
        sessionStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(STORAGE_KEY);
      }
      // Dispatch storage event so other tabs and external stores update
      window.dispatchEvent(new Event("storage"));
    } catch {
      // Storage unavailable or quota exceeded
    }
  }, []);

  // Subscribe to shared storage changes across tabs and components
  useEffect(() => {
    const unsubscribe = subscribeUserStorage(() => {
      const updated = getStoredUser();
      setUser(updated);
    });

    return unsubscribe;
  }, []);

  // Update user profile (frontend-only mock state update)
  const updateUser = useCallback((updates) => {
    const updated = updateStoredUser(updates);
    setUser(updated);
    return updated;
  }, []);

  // Login handler
  const login = useCallback(
    async (username, password) => {
      setError(null);
      try {
        const res = await authApi.login({ username, password });
        const authenticatedUser = {
          ...mockUser,
          id: res.id,
          name: res.name,
          username: res.username,
          isAuthenticated: true,
        };
        updateStoredUser(authenticatedUser);
        setUser(authenticatedUser);
        return authenticatedUser;
      } catch (err) {
        if (err.status && err.status !== 0) {
          throw err;
        }
        // Fallback for offline frontend prototype
        const fallback = {
          ...mockUser,
          name: username,
          username: username.replace(/^@/, ""),
          isAuthenticated: true,
        };
        updateStoredUser(fallback);
        setUser(fallback);
        return fallback;
      }
    },
    []
  );

  // Register handler
  const register = useCallback(async ({ name, username, password }) => {
    setError(null);
    try {
      return await authApi.register({ name, username, password });
    } catch (err) {
      if (err.status && err.status !== 0) {
        throw err;
      }
      // Fallback for offline frontend prototype
      return {
        id: Date.now(),
        name,
        username: username.replace(/^@/, ""),
      };
    }
  }, []);

  // Logout handler (strictly frontend-only per Phase 7.1)
  const logout = useCallback(() => {
    clearStoredUser();
    setUser(null);
  }, []);

  // Refresh user data from backend/storage
  const refreshUser = useCallback(() => {
    const current = getStoredUser();
    setUser(current);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        login,
        register,
        logout,
        updateUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
