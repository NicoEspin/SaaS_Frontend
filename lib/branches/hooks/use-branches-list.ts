"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { branchesApi } from "@/lib/branches/api";
import type { BranchRecord, BranchesListQuery } from "@/lib/branches/types";
import { getAxiosErrorMessage } from "@/lib/products/utils";

type State = {
  items: BranchRecord[];
  nextCursor: string | null;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
};

export function useBranchesList(options?: {
  limit?: number;
  q?: string;
  enabled?: boolean;
}) {
  const tc = useTranslations("Common");

  const limit = options?.limit ?? 100;
  const enabled = options?.enabled ?? true;
  const q = options?.q?.trim() ? options.q.trim() : undefined;

  const [state, setState] = useState<State>({
    items: [],
    nextCursor: null,
    loading: false,
    loadingMore: false,
    error: null,
  });

  const abortRef = useRef<AbortController | null>(null);

  const query = useMemo(() => ({ limit, q } satisfies BranchesListQuery), [limit, q]);

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
        const res = await branchesApi.list(
          {
            ...query,
            cursor: cursor ?? undefined,
          },
          { signal: controller.signal }
        );

        setState((s) => {
          const nextItems = mode === "replace" ? res.items : [...s.items, ...res.items];
          const seen = new Set<string>();
          const deduped: BranchRecord[] = [];
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
    [query, tc]
  );

  useEffect(() => {
    if (!enabled) return;
    void fetchPage(null, "replace");
    return () => abortRef.current?.abort();
  }, [enabled, fetchPage]);

  const canLoadMore = useMemo(
    () => Boolean(state.nextCursor) && !state.loading && !state.loadingMore,
    [state.loading, state.loadingMore, state.nextCursor]
  );

  const refresh = useCallback(async () => {
    if (!enabled) return;
    await fetchPage(null, "replace");
  }, [enabled, fetchPage]);

  const loadMore = useCallback(async () => {
    if (!enabled) return;
    if (!state.nextCursor) return;
    await fetchPage(state.nextCursor, "append");
  }, [enabled, fetchPage, state.nextCursor]);

  return {
    items: state.items,
    nextCursor: state.nextCursor,
    loading: state.loading,
    loadingMore: state.loadingMore,
    error: state.error,
    canLoadMore,
    refresh,
    loadMore,
  };
}
