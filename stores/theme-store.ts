import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type ThemeMode = "light" | "dark";

type ThemeState = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: "light",
      setMode: (mode) => set({ mode }),
      toggleMode: () =>
        set({ mode: get().mode === "dark" ? "light" : "dark" }),
    }),
    {
      name: "theme-mode",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ mode: state.mode }),
    }
  )
);
