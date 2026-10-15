"use client";

import { useState, useEffect, useCallback } from "react";

const THEME_KEY = "alaya_theme";

export default function ThemeToggle({ className = "" }) {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    const syncTheme = () => {
      try {
        const saved = localStorage.getItem(THEME_KEY);
        const isLight = saved === "light" || document.documentElement.classList.contains("light");
        const currentTheme = isLight ? "light" : "dark";
        setTheme(currentTheme);

        if (isLight) {
          document.documentElement.classList.remove("dark");
          document.documentElement.classList.add("light");
          document.body?.classList?.remove("dark");
          document.body?.classList?.add("light");
        } else {
          document.documentElement.classList.remove("light");
          document.documentElement.classList.add("dark");
          document.body?.classList?.remove("light");
          document.body?.classList?.add("dark");
        }
      } catch {}
    };

    const raf = requestAnimationFrame(() => {
      setMounted(true);
      syncTheme();
    });

    window.addEventListener("storage", syncTheme);
    window.addEventListener("alaya-theme-change", syncTheme);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("storage", syncTheme);
      window.removeEventListener("alaya-theme-change", syncTheme);
    };
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prevTheme) => {
      const nextTheme = prevTheme === "dark" ? "light" : "dark";

      if (nextTheme === "light") {
        document.documentElement.classList.remove("dark");
        document.documentElement.classList.add("light");
        document.body?.classList?.remove("dark");
        document.body?.classList?.add("light");
      } else {
        document.documentElement.classList.remove("light");
        document.documentElement.classList.add("dark");
        document.body?.classList?.remove("light");
        document.body?.classList?.add("dark");
      }

      try {
        localStorage.setItem(THEME_KEY, nextTheme);
        window.dispatchEvent(new Event("alaya-theme-change"));
      } catch {}

      return nextTheme;
    });
  }, []);

  // Before mounting on client, render a stable button matching SSR exactly to prevent hydration mismatch
  if (!mounted) {
    return (
      <button
        type="button"
        disabled
        aria-label="Toggle theme"
        title="Toggle theme"
        suppressHydrationWarning
        className={`flex h-9 w-9 items-center justify-center rounded-xl border border-border-subtle bg-surface-secondary/70 text-text-muted opacity-60 ${className}`}
      >
        <span className="h-4 w-4 rounded-full border border-border-subtle" />
      </button>
    );
  }

  const isDark = theme === "dark";

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
