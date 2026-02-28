"use client";

import { create } from "zustand";

export type CartDocType = "A" | "B";

type CartUiState = {
  open: boolean;
  setOpen: (open: boolean) => void;

  selectedCustomerId: string | null;
  setSelectedCustomerId: (customerId: string | null) => void;

  docType: CartDocType;
  setDocType: (docType: CartDocType) => void;

  resetAfterSale: () => void;
};

export const useCartUiStore = create<CartUiState>()((set) => ({
  open: false,
  setOpen: (open) => set({ open }),

  selectedCustomerId: null,
  setSelectedCustomerId: (selectedCustomerId) => set({ selectedCustomerId }),

  docType: "B",
  setDocType: (docType) => set({ docType }),

  resetAfterSale: () => set({ selectedCustomerId: null, docType: "B" }),
}));
