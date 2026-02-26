"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { branchesApi } from "@/lib/branches/api";
import type { Branch } from "@/lib/branches/types";
import { getAxiosErrorMessage } from "@/lib/products/utils";

type State = {
  items: Branch[];
  loading: boolean;
  error: string | null;
};

export function useBranches(options?: { enabled?: boolean }) {
  const tc = useTranslations("Common");
  const enabled = options?.enabled ?? true;

  const [state, setState] = useState<State>({
    items: [],
    loading: false,
    error: null,
  });

  const abortRef = useRef<AbortController | null>(null);

  const fetchAll = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const items = await branchesApi.listNames({ signal: controller.signal });
      setState({ items, loading: false, error: null });
    } catch (err) {
      if (controller.signal.aborted) return;
      setState((s) => ({
        ...s,
        loading: false,
        error: getAxiosErrorMessage(err) ?? tc("errors.generic"),
      }));
    }
  }, [tc]);

  useEffect(() => {
    if (!enabled) return;
    void fetchAll();
    return () => abortRef.current?.abort();
  }, [enabled, fetchAll]);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    await fetchAll();
  }, [enabled, fetchAll]);

  const byId = useMemo(() => {
    const map = new Map<string, Branch>();
    for (const b of state.items) map.set(b.id, b);
    return map;
  }, [state.items]);

  return {
    items: state.items,
    loading: state.loading,
    error: state.error,
    refresh,
    byId,
  };
}
