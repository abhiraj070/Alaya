/**
 * Mock user reference for frontend UI placeholders when needed.
 * Real authentication communicates directly with backend APIs (/api/user/login, /api/user/register).
 * No credentials or passwords are stored on the frontend.
 */

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
        cachedUser = { ...mockUser, ...parsed };
        return cachedUser;
      }
    }
  } catch {
    // Fallback to mockUser
  }
  cachedUser = mockUser;
  return mockUser;
}

export function subscribeUserStorage(callback) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}
