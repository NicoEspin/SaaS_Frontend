"use client";

import { useEffect } from "react";

import { useThemeStore } from "@/stores/theme-store";

export default function ThemeClassSync() {
  const mode = useThemeStore((s) => s.mode);

  useEffect(() => {
    const root = document.documentElement;
    if (mode === "dark") {
      root.classList.add("dark");
      root.style.colorScheme = "dark";
    } else {
      root.classList.remove("dark");
      root.style.colorScheme = "light";
    }
  }, [mode]);

  return null;
}
