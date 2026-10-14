"use client";

import { createContext, useContext, useState, useCallback, useSyncExternalStore } from "react";
import { authApi, getStoredAccessToken, clearAllAuthTokens, cleanToken } from "@/lib/api";
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
  isLoading: false,
  error: null,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  updateUser: () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }) {
  const user = useSyncExternalStore(
    subscribeUserStorage,
    getStoredUser,
    () => null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Sync user state to browser storage
  const persistUser = useCallback((userData) => {
    if (typeof window === "undefined") return;
    try {
      if (userData) {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
        const token = cleanToken(userData.access_token || userData.token);
        if (token) {
          localStorage.setItem("access_token", token);
          sessionStorage.setItem("access_token", token);
        }
      } else {
        sessionStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(STORAGE_KEY);
        clearAllAuthTokens();
      }
      // Dispatch storage event so other tabs and external stores update
      window.dispatchEvent(new Event("storage"));
    } catch {
      // Storage unavailable or quota exceeded
    }
  }, []);

  // Update user profile (frontend-only mock state update)
  const updateUser = useCallback((updates) => {
    const updated = updateStoredUser(updates);
    return updated;
  }, []);

  // Login handler
  const login = useCallback(
    async (username, password) => {
      setError(null);
      try {
        const res = await authApi.login({ username, password });
        const candidateToken =
          res?.access_token ||
          res?.token ||
          res?.accessToken ||
          getStoredAccessToken();
        const token = cleanToken(candidateToken);

        const authenticatedUser = {
          ...mockUser,
          id: res.id,
          name: res.name,
          username: res.username,
          isAuthenticated: true,
          ...(token ? { access_token: token } : {}),
        };

        if (token) {
          try {
            localStorage.setItem("access_token", token);
            sessionStorage.setItem("access_token", token);
          } catch {}
        }

        updateStoredUser(authenticatedUser);
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

  // Logout handler: asynchronously clears backend session, cookies, and local storage tokens
  const logout = useCallback(async () => {
    try {
      const current = getStoredUser();
      const currentUserId =
        current?.id && typeof current.id === "number" ? current.id : null;
      await authApi.logout(currentUserId);
    } catch {
      // Backend logout failed or server offline
    } finally {
      clearAllAuthTokens();
      clearStoredUser();
    }
  }, []);

  // Refresh user data from backend/storage
  const refreshUser = useCallback(() => {
    return getStoredUser();
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
