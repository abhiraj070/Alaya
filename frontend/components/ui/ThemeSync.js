"use client";

import { useEffect } from "react";
import { useLocalStorage } from "@/lib/use-local-storage";

export default function ThemeSync() {
  const [theme] = useLocalStorage("alaya_theme", "dark");
  const isDark = theme !== "light";

  useEffect(() => {
    for (const element of [document.documentElement, document.body]) {
      element.classList.toggle("dark", isDark);
      element.classList.toggle("light", !isDark);
    }
  }, [isDark]);

  return null;
}
