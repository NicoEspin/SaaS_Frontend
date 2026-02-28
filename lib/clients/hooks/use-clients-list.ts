"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { customersApi } from "@/lib/clients/api";
import type { Customer, CustomersListQuery } from "@/lib/clients/types";
import { getAxiosErrorMessage } from "@/lib/products/utils";

type State = {
  items: Customer[];
  nextCursor: string | null;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
};

export function useClientsList(options?: {
  limit?: number;
  initialFilters?: Omit<CustomersListQuery, "limit" | "cursor">;
}) {
  const tc = useTranslations("Common");
  const limit = options?.limit ?? 10;

  const [filters, setFilters] = useState<Omit<CustomersListQuery, "limit" | "cursor">>(
    options?.initialFilters ?? {}
  );

  const [state, setState] = useState<State>({
    items: [],
    nextCursor: null,
    loading: true,
    loadingMore: false,
    error: null,
  });

  const abortRef = useRef<AbortController | null>(null);

  const fetchPage = useCallback(
    async (cursor: string | null, mode: "replace" | "append") => {
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
        const res = await customersApi.customers.list(
          {
            ...filters,
            limit,
            cursor: cursor ?? undefined,
          },
          { signal: controller.signal }
        );

        setState((s) => {
          const nextItems = mode === "replace" ? res.items : [...s.items, ...res.items];

          const seen = new Set<string>();
          const deduped: Customer[] = [];
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
    [filters, limit, tc]
  );

  useEffect(() => {
    void fetchPage(null, "replace");
    return () => abortRef.current?.abort();
  }, [fetchPage]);

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
