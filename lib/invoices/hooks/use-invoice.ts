"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { invoicesApi } from "@/lib/invoices/api";
import type { Invoice } from "@/lib/invoices/types";
import { getAxiosErrorMessage } from "@/lib/products/utils";

type State = {
  invoice: Invoice | null;
  loading: boolean;
  error: string | null;
};

export function useInvoice(branchId: string | null, invoiceId: string | null) {
  const tc = useTranslations("Common");
  const [state, setState] = useState<State>({
    invoice: null,
    loading: Boolean(branchId && invoiceId),
    error: null,
  });

  const abortRef = useRef<AbortController | null>(null);

  const fetchInvoice = useCallback(async (reason: "effect" | "manual") => {
    if (!branchId || !invoiceId) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const showLoading = reason === "effect" || reason === "manual";
    if (showLoading) setState((s) => ({ ...s, loading: true, error: null }));

    try {
      const invoice = await invoicesApi.get(branchId, invoiceId, { signal: controller.signal });
      if (controller.signal.aborted) return;
      setState(() => ({ invoice, loading: false, error: null }));
    } catch (err) {
      if (controller.signal.aborted) return;
      setState(() => ({
        invoice: null,
        loading: false,
        error: getAxiosErrorMessage(err) ?? tc("errors.generic"),
      }));
    }
  }, [branchId, invoiceId, tc]);

  useEffect(() => {
    if (!branchId || !invoiceId) {
      abortRef.current?.abort();
      return;
    }

    void fetchInvoice("effect");
    return () => abortRef.current?.abort();
  }, [branchId, invoiceId, fetchInvoice]);

  const enabled = Boolean(branchId && invoiceId);

  return {
    invoice: enabled ? state.invoice : null,
    loading: enabled ? state.loading : false,
    error: enabled ? state.error : null,
    refresh: async () => fetchInvoice("manual"),
  };
}
