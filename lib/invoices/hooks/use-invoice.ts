"use client";

import axios from "axios";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { invoicesApi } from "@/lib/invoices/api";
import type { Invoice } from "@/lib/invoices/types";
import { getAxiosErrorMessage } from "@/lib/products/utils";

type State = {
  invoice: Invoice | null;
  loading: boolean;
  error: string | null;
  branchId: string | null;
};

function uniqueStrings(values: readonly string[]) {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const v of values) {
    const s = v.trim();
    if (!s) continue;
    if (seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out;
}

function orderBranches(branchIds: readonly string[], first: string | null) {
  if (!first) return uniqueStrings(branchIds);
  const out: string[] = [first];
  for (const id of branchIds) if (id !== first) out.push(id);
  return uniqueStrings(out);
}

export function useInvoice(branchIds: readonly string[] | null, invoiceId: string | null) {
  const t = useTranslations("Invoices");
  const tc = useTranslations("Common");
  const [state, setState] = useState<State>({
    invoice: null,
    loading: Boolean(branchIds && branchIds.length > 0 && invoiceId),
    error: null,
    branchId: null,
  });

  const abortRef = useRef<AbortController | null>(null);
  const lastSuccessBranchIdRef = useRef<string | null>(null);

  const fetchInvoice = useCallback(async (reason: "effect" | "manual") => {
    if (!branchIds || branchIds.length === 0 || !invoiceId) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const showLoading = reason === "effect" || reason === "manual";
    if (showLoading) setState((s) => ({ ...s, loading: true, error: null }));

    try {
      const ordered = orderBranches(branchIds, lastSuccessBranchIdRef.current);

      let lastNotFound = false;
      for (const branchId of ordered) {
        try {
          const invoice = await invoicesApi.get(branchId, invoiceId, { signal: controller.signal });
          if (controller.signal.aborted) return;
          lastSuccessBranchIdRef.current = branchId;
          setState(() => ({ invoice, loading: false, error: null, branchId }));
          return;
        } catch (err) {
          if (controller.signal.aborted) return;

          const status = axios.isAxiosError(err) ? err.response?.status ?? null : null;
          if (status === 404) {
            lastNotFound = true;
            continue;
          }

          setState(() => ({
            invoice: null,
            loading: false,
            error: getAxiosErrorMessage(err) ?? tc("errors.generic"),
            branchId: null,
          }));
          return;
        }
      }

      setState(() => ({
        invoice: null,
        loading: false,
        error: lastNotFound ? t("errors.notFound") : tc("errors.generic"),
        branchId: null,
      }));
      lastSuccessBranchIdRef.current = null;
    } catch (err) {
      if (controller.signal.aborted) return;
      setState(() => ({
        invoice: null,
        loading: false,
        error: getAxiosErrorMessage(err) ?? tc("errors.generic"),
        branchId: null,
      }));
      lastSuccessBranchIdRef.current = null;
    }
  }, [branchIds, invoiceId, t, tc]);

  useEffect(() => {
    lastSuccessBranchIdRef.current = null;
  }, [invoiceId]);

  useEffect(() => {
    if (!branchIds || branchIds.length === 0 || !invoiceId) {
      abortRef.current?.abort();
      return;
    }

    void fetchInvoice("effect");
    return () => abortRef.current?.abort();
  }, [branchIds, invoiceId, fetchInvoice]);

  const enabled = Boolean(branchIds && branchIds.length > 0 && invoiceId);

  return {
    invoice: enabled ? state.invoice : null,
    loading: enabled ? state.loading : false,
    error: enabled ? state.error : null,
    branchId: enabled ? state.branchId : null,
    refresh: async () => fetchInvoice("manual"),
  };
}
