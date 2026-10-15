"use client";

import { useEffect } from "react";
import { useLocalStorage } from "@/lib/use-local-storage";

export default function ThemeToggle({ className = "" }) {
  const [theme, setTheme] = useLocalStorage("alaya_theme", "dark");
  const isDark = theme !== "light";
  useEffect(() => {
    for (const element of [document.documentElement, document.body]) {
      element.classList.toggle("dark", isDark);
      element.classList.toggle("light", !isDark);
    }
  }, [isDark]);
  const toggleTheme = () => setTheme(isDark ? "light" : "dark");

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to day mode" : "Switch to night mode"}
      title={isDark ? "Switch to day mode" : "Switch to night mode"}
      className={`flex h-9 w-9 items-center justify-center rounded-xl border border-border-subtle bg-surface-secondary/70 text-text-secondary hover:text-accent-sky hover:border-accent-sky/30 transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sky ${className}`}
    >
      {isDark ? (
        /* Sun Icon - Day mode prompt */
        <svg
          className="h-4.5 w-4.5 transition-transform duration-200 hover:rotate-45"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      ) : (
        /* Moon Icon - Night mode prompt */
        <svg
          className="h-4.5 w-4.5 transition-transform duration-200 hover:-rotate-12 text-accent-sky"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}
