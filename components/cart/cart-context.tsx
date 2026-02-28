"use client";

import type { CustomerCreateDto } from "@/lib/clients/types";
import type { Cart } from "@/lib/carts/types";
import { createContext, useContext } from "react";

export type LastSale = {
  invoiceId: string;
  number: string;
  total: string;
};

export type CartView = "cart" | "success";

export type CartContextValue = {
  activeBranchId: string | null;

  cart: Cart | null;
  loading: boolean;
  error: string | null;

  pendingByProductId: Record<string, boolean>;
  checkoutPending: boolean;

  view: CartView;
  lastSale: LastSale | null;

  ensureCart: () => Promise<void>;
  refreshCart: () => Promise<void>;

  addItem: (productId: string, quantity?: number) => Promise<void>;
  setItemQty: (productId: string, quantity: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;

  checkout: () => Promise<void>;
  openPdf: (invoiceId: string) => Promise<void>;

  startNewSale: () => Promise<void>;
  createCustomerQuick: (dto: CustomerCreateDto) => Promise<{ id: string; label: string }>;
};

export const CartContext = createContext<CartContextValue | null>(null);

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
