/**
 * Mock user reference for frontend UI placeholders when needed.
 * Real authentication communicates directly with backend APIs (/api/user/login, /api/user/register).
 * No credentials or passwords are stored on the frontend.
 */

import { clearAllAuthTokens, cleanToken } from "@/lib/api";

export const mockUser = {
  id: "usr_mock_01",
  name: "Abhiraj Sharma",
  username: "abhiraj",
  email: "abhiraj@example.com",
  avatarUrl: null,
  createdAt: "2026-01-01T00:00:00.000Z",
};

export const mockUsers = [mockUser];

let cachedUser = null;
let lastStoredRaw = null;

export function getStoredUser() {
  if (typeof window === "undefined") return mockUser;
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
      if (parsed?.name) {
        const token = cleanToken(
          parsed?.access_token ||
          localStorage.getItem("access_token") ||
          sessionStorage.getItem("access_token")
        );
        cachedUser = {
          ...mockUser,
          ...parsed,
          ...(token ? { access_token: token } : {}),
        };
        return cachedUser;
      }
    }
  } catch {
    // Fallback to mockUser
  }
  cachedUser = mockUser;
  return mockUser;
}

export function updateStoredUser(updates) {
  if (typeof window === "undefined") return { ...mockUser, ...updates };
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
      ...current,
      ...updates,
      isAuthenticated: true,
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
    return { ...mockUser, ...updates };
  }
}

export function clearStoredUser() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem("alaya_user");
    localStorage.removeItem("alaya_user");
    cachedUser = { ...mockUser, isAuthenticated: false };
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
