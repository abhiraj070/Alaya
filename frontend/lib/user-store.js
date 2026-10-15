// Only the display profile is stored here. Authentication uses server-issued cookies.
const STORAGE_KEY = "alaya_user";
const CHANGE_EVENT = "alaya:user-changed";
let cachedRaw;
let cachedUser = null;

export function getStoredUser() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === cachedRaw) return cachedUser;
    cachedRaw = raw;
    const profile = raw ? JSON.parse(raw) : null;
    cachedUser = Number.isInteger(profile?.id) ? {
      id: profile.id, name: profile.name, username: profile.username, isAuthenticated: true,
    } : null;
  } catch {
    cachedUser = null;
  }
  return cachedUser;
}

export function updateStoredUser(profile) {
  const next = {
    id: profile.id, name: profile.name, username: profile.username,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  // Remove the old duplicate session profile and app-owned legacy tokens.
  sessionStorage.removeItem(STORAGE_KEY);
  for (const key of ["access_token", "refresh_token"]) {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
  return getStoredUser();
}

export function clearStoredUser() {
  localStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(STORAGE_KEY);
  cachedRaw = undefined;
  cachedUser = null;
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function subscribeUserStorage(callback) {
  const onStorage = (event) => {
    if (event.key === STORAGE_KEY || event.key === null) callback();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(CHANGE_EVENT, callback);
  };
}
