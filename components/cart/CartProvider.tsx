"use client";

import axios from "axios";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { CartSheet } from "@/components/cart/CartSheet";
import type { CartContextValue, CartView, LastSale } from "@/components/cart/cart-context";
import { CartContext } from "@/components/cart/cart-context";
import { cartsApi } from "@/lib/carts/api";
import type { Cart } from "@/lib/carts/types";
import type { AuthSession } from "@/lib/auth/session";
import { customersApi } from "@/lib/clients/api";
import type { CustomerCreateDto } from "@/lib/clients/types";
import { invoicesApi } from "@/lib/invoices/api";
import { getAxiosErrorMessage } from "@/lib/products/utils";
import { useAuthStore } from "@/stores/auth-store";
import { useCartUiStore } from "@/stores/cart-ui-store";

function getActiveBranchIdFromSession(session: AuthSession | null) {
  const branches = session?.branches ?? [];
  return (session?.activeBranch ?? branches[0] ?? null)?.id ?? null;
}

type Props = {
  children: ReactNode;
};

export function CartProvider({ children }: Props) {
  const t = useTranslations("Cart");
  const tc = useTranslations("Common");

  const open = useCartUiStore((s) => s.open);
  const selectedCustomerId = useCartUiStore((s) => s.selectedCustomerId);
  const docType = useCartUiStore((s) => s.docType);

  const resetAfterSale = useCartUiStore((s) => s.resetAfterSale);

  const session = useAuthStore((s) => s.session);
  const sessionLoading = useAuthStore((s) => s.sessionLoading);
  const hydrateSession = useAuthStore((s) => s.hydrateSession);

  const activeBranchId = useMemo(() => getActiveBranchIdFromSession(session), [session]);

  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [pendingByProductId, setPendingByProductId] = useState<Record<string, boolean>>({});
  const [checkoutPending, setCheckoutPending] = useState(false);

  const [view, setView] = useState<CartView>("cart");
  const [lastSale, setLastSale] = useState<LastSale | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!open) {
      setView("cart");
      setLastSale(null);
      setError(null);
      abortRef.current?.abort();
      return;
    }

    if (!session && !sessionLoading) {
      void hydrateSession();
    }
  }, [hydrateSession, open, session, sessionLoading]);

  const ensureCart = useCallback(async () => {
    if (!activeBranchId) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const next = await cartsApi.postCurrent(activeBranchId, undefined, { signal: controller.signal });
      if (controller.signal.aborted) return;
      setCart(next);
    } catch (err) {
      if (controller.signal.aborted) return;
      setError(getAxiosErrorMessage(err) ?? tc("errors.generic"));
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [activeBranchId, tc]);

  const refreshCart = useCallback(async () => {
    if (!activeBranchId) return;
    if (!cart) {
      await ensureCart();
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const next = await cartsApi.get(activeBranchId, cart.id, { signal: controller.signal });
      if (controller.signal.aborted) return;
      setCart(next);
    } catch (err) {
      if (controller.signal.aborted) return;
      const status = axios.isAxiosError(err) ? (err.response?.status ?? null) : null;
      if (status === 404) {
        await ensureCart();
        return;
      }
      setError(getAxiosErrorMessage(err) ?? tc("errors.generic"));
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [activeBranchId, cart, ensureCart, tc]);

  useEffect(() => {
    if (!open) return;
    if (!activeBranchId) return;
    void ensureCart();
  }, [activeBranchId, ensureCart, open]);

  async function withItemPending(productId: string, fn: () => Promise<void>) {
    setPendingByProductId((s) => ({ ...s, [productId]: true }));
    try {
      await fn();
    } finally {
      setPendingByProductId((s) => {
        const next = { ...s };
        delete next[productId];
        return next;
      });
    }
  }

  const getOrCreateCartId = useCallback(async (): Promise<string | null> => {
    if (!activeBranchId) return null;
    if (cart?.id) return cart.id;
    try {
      const next = await cartsApi.postCurrent(activeBranchId);
      setCart(next);
      return next.id;
    } catch (err) {
      toast.error(getAxiosErrorMessage(err) ?? tc("errors.generic"));
      return null;
    }
  }, [activeBranchId, cart?.id, tc]);

  const refetchCartById = useCallback(
    async (cartId: string) => {
      if (!activeBranchId) return;
      try {
        const next = await cartsApi.get(activeBranchId, cartId);
        setCart(next);
      } catch (err) {
        const status = axios.isAxiosError(err) ? (err.response?.status ?? null) : null;
        if (status === 404) {
          const next = await cartsApi.postCurrent(activeBranchId);
          setCart(next);
          return;
        }
        toast.error(getAxiosErrorMessage(err) ?? tc("errors.generic"));
      }
    },
    [activeBranchId, tc]
  );

  const addItem = useCallback(
    async (productId: string, quantity = 1) => {
      if (!activeBranchId) return;
      const cartId = await getOrCreateCartId();
      if (!cartId) return;

      await withItemPending(productId, async () => {
        try {
          await cartsApi.addItem(activeBranchId, cartId, { productId, quantity });
          await refetchCartById(cartId);
        } catch (err) {
          toast.error(getAxiosErrorMessage(err) ?? tc("errors.generic"));
          throw err;
        }
      });
    },
    [activeBranchId, getOrCreateCartId, refetchCartById, tc]
  );

  const setItemQty = useCallback(
    async (productId: string, quantity: number) => {
      if (!activeBranchId || !cart) return;
      const q = Number.isFinite(quantity) ? Math.max(0, Math.floor(quantity)) : 0;

      await withItemPending(productId, async () => {
        try {
          await cartsApi.updateItemQty(activeBranchId, cart.id, productId, { quantity: q });
          await refetchCartById(cart.id);
        } catch (err) {
          toast.error(getAxiosErrorMessage(err) ?? tc("errors.generic"));
          throw err;
        }
      });
    },
    [activeBranchId, cart, refetchCartById, tc]
  );

  const removeItem = useCallback(
    async (productId: string) => {
      if (!activeBranchId || !cart) return;
      await withItemPending(productId, async () => {
        try {
          await cartsApi.removeItem(activeBranchId, cart.id, productId);
          await refetchCartById(cart.id);
        } catch (err) {
          toast.error(getAxiosErrorMessage(err) ?? tc("errors.generic"));
          throw err;
        }
      });
    },
    [activeBranchId, cart, refetchCartById, tc]
  );

  const openPdf = useCallback(
    async (invoiceId: string) => {
      if (!activeBranchId) return;
      try {
        const res = await invoicesApi.getPdf(activeBranchId, invoiceId, { variant: "internal" });
        const url = URL.createObjectURL(res.blob);
        const w = window.open(url, "_blank", "noopener,noreferrer");
        if (!w) toast.error(t("errors.popupBlocked"));
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
      } catch (err) {
        toast.error(getAxiosErrorMessage(err) ?? tc("errors.generic"));
      }
    },
    [activeBranchId, t, tc]
  );

  const checkout = useCallback(async () => {
    if (!activeBranchId || !cart) return;
    if (cart.items.length === 0) {
      toast.error(t("errors.emptyCart"));
      return;
    }

    if (cart.status !== "DRAFT") {
      toast.error(t("errors.cartNotEditable"));
      return;
    }

    if (docType === "A" && !selectedCustomerId) {
      toast.error(t("errors.docTypeARequiresCustomer"));
      return;
    }

    setCheckoutPending(true);
    try {
      const res = await cartsApi.checkout(activeBranchId, cart.id, {
        customerId: selectedCustomerId ?? undefined,
      });

      await invoicesApi.issue(activeBranchId, res.invoice.id, {
        docType,
        mode: "INTERNAL",
      });

      setLastSale({ invoiceId: res.invoice.id, number: res.invoice.number, total: res.invoice.total });
      setView("success");
      toast.success(t("success.saleCompleted"));

      await openPdf(res.invoice.id);

      resetAfterSale();
      const next = await cartsApi.postCurrent(activeBranchId);
      setCart(next);
    } catch (err) {
      const status = axios.isAxiosError(err) ? (err.response?.status ?? null) : null;
      if (status === 409) {
        toast.error(getAxiosErrorMessage(err) ?? t("errors.conflict"));
        return;
      }
      toast.error(getAxiosErrorMessage(err) ?? tc("errors.generic"));
    } finally {
      setCheckoutPending(false);
    }
  }, [activeBranchId, cart, docType, openPdf, resetAfterSale, selectedCustomerId, t, tc]);

  const startNewSale = useCallback(async () => {
    setView("cart");
    setLastSale(null);
    await ensureCart();
  }, [ensureCart]);

  const createCustomerQuick = useCallback(
    async (dto: CustomerCreateDto) => {
      const created = await customersApi.customers.create(dto);
      return {
        id: created.id,
        label: created.taxId ? `${created.name} - ${created.taxId}` : created.name,
      };
    },
    []
  );

  const value = useMemo<CartContextValue>(
    () => ({
      activeBranchId,
      cart,
      loading,
      error,
      pendingByProductId,
      checkoutPending,
      view,
      lastSale,
      ensureCart,
      refreshCart,
      addItem,
      setItemQty,
      removeItem,
      checkout,
      openPdf,
      startNewSale,
      createCustomerQuick,
    }),
    [
      activeBranchId,
      addItem,
      cart,
      checkout,
      checkoutPending,
      createCustomerQuick,
      ensureCart,
      error,
      lastSale,
      loading,
      openPdf,
      pendingByProductId,
      refreshCart,
      removeItem,
      setItemQty,
      startNewSale,
      view,
    ]
  );

  return (
    <CartContext.Provider value={value}>
      {children}
      <CartSheet />
    </CartContext.Provider>
  );
}
