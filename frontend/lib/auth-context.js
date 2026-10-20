"use client";

import { createContext, useContext, useCallback, useSyncExternalStore, useState, useRef } from "react";
import { authApi } from "@/lib/api";
import { getStoredUser, updateStoredUser, clearStoredUser, subscribeUserStorage } from "@/lib/user-store";

const AuthContext = createContext(null);
const serverUser = () => null;
const subscribeReady = () => () => {};

export function AuthProvider({ children }) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const logoutRequest = useRef(false);
  const user = useSyncExternalStore(subscribeUserStorage, getStoredUser, serverUser);
  const ready = useSyncExternalStore(subscribeReady, () => true, () => false);

  const login = useCallback(async (username, password) => {
    const profile = await authApi.login({ username, password });
    return updateStoredUser(profile);
  }, []);

  const register = useCallback((data) => authApi.register(data), []);

  const logout = useCallback(async () => {
    if (logoutRequest.current) return;
    logoutRequest.current = true;
    setIsLoggingOut(true);
    const current = getStoredUser();
    try {
      if (current?.id) await authApi.logout(current.id);
    } catch (error) {
      console.warn("Could not clear the backend session:", error.message);
    } finally {
      clearStoredUser();
      logoutRequest.current = false;
      setIsLoggingOut(false);
    }
  }, []);

  const updateUser = useCallback(async (updates) => {
    const current = getStoredUser();
    if (!current?.id) throw new Error("Please sign in to update your profile.");
    const profile = await authApi.updateUser(current.id, updates);
    return updateStoredUser(profile);
  }, []);

  const deleteAccount = useCallback(async () => {
    const current = getStoredUser();
    if (!current?.id) throw new Error("Please sign in to delete your account.");
    await authApi.deleteUser(current.id);
    clearStoredUser();
  }, []);

  const refreshUser = useCallback(async () => {
    const current = getStoredUser();
    if (!current?.id) return null;
    try {
      return updateStoredUser(await authApi.getUser(current.id));
    } catch (error) {
      if (error.status === 401) clearStoredUser();
      return getStoredUser();
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, ready, login, register, logout, isLoggingOut, updateUser, deleteAccount, refreshUser }}>
      {children}
      {isLoggingOut && (
        <div role="status" aria-live="polite" aria-label="Logging out"
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-3 bg-bg-primary/90 backdrop-blur-sm text-text-primary">
          <span aria-hidden="true" className="h-8 w-8 animate-spin rounded-full border-2 border-accent-sky border-t-transparent" />
          <span className="text-sm font-medium">Logging out...</span>
        </div>
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
