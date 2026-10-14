"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authApi } from "@/lib/api";

const STORAGE_KEY = "alaya_user";

const AuthContext = createContext({
  user: null,
  isLoading: true,
  error: null,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
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

  // Check initial authentication status from storage and verify with backend
  useEffect(() => {
    let isMounted = true;

    async function initializeAuth() {
      if (typeof window === "undefined") return;

      let storedUserData = null;
      try {
        const raw = sessionStorage.getItem(STORAGE_KEY) || localStorage.getItem(STORAGE_KEY);
        if (raw) {
          storedUserData = JSON.parse(raw);
        }
      } catch {
        storedUserData = null;
      }

      if (storedUserData && storedUserData.id) {
        if (isMounted) {
          setUser({ ...storedUserData, isAuthenticated: true });
        }

        // Validate session with backend
        try {
          const freshUser = await authApi.getUser(storedUserData.id);
          if (isMounted && freshUser) {
            const updated = {
              id: freshUser.id,
              name: freshUser.name,
              username: freshUser.username,
              isAuthenticated: true,
            };
            setUser(updated);
            persistUser(updated);
          }
        } catch (err) {
          // If session expired or invalid on backend (401), clear local session
          if (err?.status === 401 || err?.status === 404) {
            if (isMounted) {
              setUser(null);
              persistUser(null);
            }
          }
        }
      } else {
        if (isMounted) {
          setUser(null);
        }
      }

      if (isMounted) {
        setIsLoading(false);
      }
    }

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, [persistUser]);

  // Login handler
  const login = useCallback(
    async (username, password) => {
      setError(null);
      const res = await authApi.login({ username, password });
      const authenticatedUser = {
        id: res.id,
        name: res.name,
        username: res.username,
        isAuthenticated: true,
      };
      setUser(authenticatedUser);
      persistUser(authenticatedUser);
      return authenticatedUser;
    },
    [persistUser]
  );

  // Register handler
  const register = useCallback(async ({ name, username, password }) => {
    setError(null);
    return await authApi.register({ name, username, password });
  }, []);

  // Logout handler
  const logout = useCallback(async () => {
    try {
      if (user?.id) {
        await authApi.logout(user.id);
      }
    } catch {
      // Ignore network errors on logout to allow clean client logout
    } finally {
      setUser(null);
      persistUser(null);
    }
  }, [user, persistUser]);

  // Refresh user data from backend
  const refreshUser = useCallback(async () => {
    if (!user?.id) return;
    try {
      const freshUser = await authApi.getUser(user.id);
      if (freshUser) {
        const updated = {
          id: freshUser.id,
          name: freshUser.name,
          username: freshUser.username,
          isAuthenticated: true,
        };
        setUser(updated);
        persistUser(updated);
      }
    } catch {
      // Ignore refresh failure
    }
  }, [user, persistUser]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        login,
        register,
        logout,
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
