/**
 * Mock user reference for frontend UI placeholders when needed.
 * Real authentication communicates directly with backend APIs (/api/user/login, /api/user/register).
 * No credentials or passwords are stored on the frontend.
 */

import { clearAllAuthTokens, cleanToken } from "@/lib/api";

export const defaultGuestUser = {
  id: null,
  name: "Guest User",
  username: "guest",
  email: "",
  avatarUrl: null,
  isAuthenticated: false,
};

export const mockUser = defaultGuestUser;
export const mockUsers = [defaultGuestUser];

let cachedUser = null;
let lastStoredRaw = null;

export function getStoredUser() {
  if (typeof window === "undefined") return defaultGuestUser;
  try {
    const raw =
      sessionStorage.getItem("alaya_user") ||
      localStorage.getItem("alaya_user");
    if (raw === lastStoredRaw && cachedUser) {
      return cachedUser;
    }
    lastStoredRaw = raw;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.id && typeof parsed.id === "number") {
        const token = cleanToken(
          parsed?.access_token ||
          localStorage.getItem("access_token") ||
          sessionStorage.getItem("access_token")
        );
        cachedUser = {
          ...defaultGuestUser,
          ...parsed,
          isAuthenticated: true,
          ...(token ? { access_token: token } : {}),
        };
        return cachedUser;
      }
    }
  } catch {
    // Fallback to defaultGuestUser
  }
  cachedUser = defaultGuestUser;
  return defaultGuestUser;
}

export function updateStoredUser(updates) {
  if (typeof window === "undefined") return { ...defaultGuestUser, ...updates };
  try {
    const current = getStoredUser();

    // Preserve any existing access token from updates, current user, or storage
    const candidateToken =
      updates?.access_token ||
      updates?.token ||
      current?.access_token ||
      localStorage.getItem("access_token") ||
      sessionStorage.getItem("access_token");
    const existingToken = cleanToken(candidateToken);

    const updated = {
      ...defaultGuestUser,
      ...current,
      ...updates,
      isAuthenticated: Boolean(updates?.id || current?.id),
      ...(existingToken ? { access_token: existingToken } : {}),
    };

    if (existingToken) {
      try {
        localStorage.setItem("access_token", existingToken);
        sessionStorage.setItem("access_token", existingToken);
      } catch {}
    }

    cachedUser = updated;
    const json = JSON.stringify(updated);
    sessionStorage.setItem("alaya_user", json);
    localStorage.setItem("alaya_user", json);
    lastStoredRaw = json;
    window.dispatchEvent(new Event("storage"));
    return updated;
  } catch {
    return { ...defaultGuestUser, ...updates };
  }
}

export function clearStoredUser() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem("alaya_user");
    localStorage.removeItem("alaya_user");
    cachedUser = { ...defaultGuestUser };
    lastStoredRaw = null;
    clearAllAuthTokens();
    window.dispatchEvent(new Event("storage"));
  } catch {}
}

export function subscribeUserStorage(callback) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}
