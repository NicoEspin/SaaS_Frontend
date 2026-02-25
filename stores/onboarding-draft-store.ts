"use client";

import { create } from "zustand";

export type DraftAdmin = {
  fullName: string;
  email: string;
  password: string;
};

type DraftState = {
  admin: DraftAdmin | null;
  setAdmin: (admin: DraftAdmin) => void;
  clear: () => void;
};

export const useOnboardingDraftStore = create<DraftState>()((set) => ({
  admin: null,
  setAdmin: (admin) => set({ admin }),
  clear: () => set({ admin: null }),
}));
