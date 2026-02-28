"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { invoicesApi } from "@/lib/invoices/api";
import type { InvoiceListItem, InvoicesListQuery } from "@/lib/invoices/types";
import { getAxiosErrorMessage } from "@/lib/products/utils";

type State = {
  items: InvoiceListItem[];
  nextCursor: string | null;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
};

export function useInvoicesList(options: {
  branchId: string | null;
  limit?: number;
  initialFilters?: Omit<InvoicesListQuery, "limit" | "cursor">;
}) {
  const tc = useTranslations("Common");
  const branchId = options.branchId;
  const limit = options.limit ?? 10;

  const [filters, setFilters] = useState<Omit<InvoicesListQuery, "limit" | "cursor">>(
    options.initialFilters ?? {}
  );

  const [state, setState] = useState<State>({
    items: [],
    nextCursor: null,
    loading: Boolean(branchId),
    loadingMore: false,
    error: null,
  });

  const abortRef = useRef<AbortController | null>(null);

  const fetchPage = useCallback(
    async (cursor: string | null, mode: "replace" | "append") => {
      if (!branchId) return;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setState((s) => ({
        ...s,
        error: null,
        loading: mode === "replace",
        loadingMore: mode === "append",
      }));

      try {
        const res = await invoicesApi.list(
          branchId,
          {
            ...filters,
            limit,
            cursor: cursor ?? undefined,
          },
          { signal: controller.signal }
        );

        if (controller.signal.aborted) return;

        setState((s) => {
          const nextItems = mode === "replace" ? res.items : [...s.items, ...res.items];

          const seen = new Set<string>();
          const deduped: InvoiceListItem[] = [];
          for (const item of nextItems) {
            if (seen.has(item.id)) continue;
            seen.add(item.id);
            deduped.push(item);
          }

          return {
            items: deduped,
            nextCursor: res.nextCursor,
            loading: false,
            loadingMore: false,
            error: null,
          };
        });
      } catch (err) {
        if (controller.signal.aborted) return;
        setState((s) => ({
          ...s,
          loading: false,
          loadingMore: false,
          error: getAxiosErrorMessage(err) ?? tc("errors.generic"),
        }));
      }
    },
    [branchId, filters, limit, tc]
  );

  useEffect(() => {
    if (!branchId) {
      abortRef.current?.abort();
      setState({ items: [], nextCursor: null, loading: false, loadingMore: false, error: null });
      return;
    }
    void fetchPage(null, "replace");
    return () => abortRef.current?.abort();
  }, [branchId, fetchPage]);

  const canLoadMore = useMemo(
    () => Boolean(state.nextCursor) && !state.loading && !state.loadingMore,
    [state.loading, state.loadingMore, state.nextCursor]
  );

  const loadMore = useCallback(async () => {
    if (!state.nextCursor) return;
    await fetchPage(state.nextCursor, "append");
  }, [fetchPage, state.nextCursor]);

  const refresh = useCallback(async () => {
    await fetchPage(null, "replace");
  }, [fetchPage]);

  return {
    items: state.items,
    nextCursor: state.nextCursor,
    loading: state.loading,
    loadingMore: state.loadingMore,
    error: state.error,

    filters,
    setFilters,
    refresh,
    canLoadMore,
    loadMore,
  };
}
