"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

function decode(raw, fallback) {
  if (raw === null) return fallback;
  try { return JSON.parse(raw); } catch { return typeof fallback === "string" ? raw : fallback; }
}

export function useLocalStorage(key, fallback) {
  const subscribe = useCallback((listener) => {
    const onStorage = (event) => {
      if (!event.key || event.key === key) listener();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("alaya:preferences", listener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("alaya:preferences", listener);
    };
  }, [key]);
  const read = useCallback(() => {
    try { return localStorage.getItem(key); } catch { return null; }
  }, [key]);
  const raw = useSyncExternalStore(subscribe, read, () => null);
  const value = useMemo(() => decode(raw, fallback), [raw, fallback]);
  const write = useCallback((next) => {
    try {
      const current = read();
      const previous = decode(current, fallback);
      localStorage.setItem(key, JSON.stringify(typeof next === "function" ? next(previous) : next));
      window.dispatchEvent(new Event("alaya:preferences"));
    } catch { /* Preferences are optional when browser storage is unavailable. */ }
  }, [fallback, key, read]);
  return [value, write];
}
