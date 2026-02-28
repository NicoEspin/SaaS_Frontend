"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { purchaseOrdersApi } from "@/lib/purchase-orders/api";
import type { PurchaseOrder } from "@/lib/purchase-orders/types";
import { getAxiosErrorMessage } from "@/lib/products/utils";

type State = {
  purchaseOrder: PurchaseOrder | null;
  loading: boolean;
  error: string | null;
};

export function usePurchaseOrder(purchaseOrderId: string | null) {
  const tc = useTranslations("Common");

  const [state, setState] = useState<State>({
    purchaseOrder: null,
    loading: Boolean(purchaseOrderId),
    error: null,
  });

  const abortRef = useRef<AbortController | null>(null);

  const refresh = useCallback(async () => {
    if (!purchaseOrderId) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const po = await purchaseOrdersApi.get(purchaseOrderId, { signal: controller.signal });
      if (controller.signal.aborted) return;
      setState({ purchaseOrder: po, loading: false, error: null });
    } catch (err) {
      if (controller.signal.aborted) return;
      setState((s) => ({
        ...s,
        loading: false,
        error: getAxiosErrorMessage(err) ?? tc("errors.generic"),
      }));
    }
  }, [purchaseOrderId, tc]);

  useEffect(() => {
    if (!purchaseOrderId) {
      abortRef.current?.abort();
      setState({ purchaseOrder: null, loading: false, error: null });
      return;
    }
    void refresh();
    return () => abortRef.current?.abort();
  }, [purchaseOrderId, refresh]);

  return {
    purchaseOrder: state.purchaseOrder,
    loading: state.loading,
    error: state.error,
    refresh,
  };
}
