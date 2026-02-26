"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { productsApi } from "@/lib/products/api";
import type {
  ProductAttributeDefinition,
  ProductAttributeDefinitionCreateDto,
  ProductAttributeDefinitionUpdateDto,
} from "@/lib/products/types";
import { getAxiosErrorMessage } from "@/lib/products/utils";

type State = {
  categoryId: string | null;
  items: ProductAttributeDefinition[];
  loading: boolean;
  error: string | null;
};

export function useAttributeDefinitions(categoryId: string | null) {
  const tc = useTranslations("Common");

  const [state, setState] = useState<State>({
    categoryId: null,
    items: [],
    loading: false,
    error: null,
  });

  const activeCategoryId = categoryId?.trim() ? categoryId.trim() : null;
  const canFetch = Boolean(activeCategoryId && activeCategoryId.length === 26);
  const matches = state.categoryId === activeCategoryId;

  const refreshFor = useCallback(async (id: string) => {
    setState((s) => ({
      ...s,
      categoryId: id,
      loading: true,
      error: null,
      items: s.categoryId === id ? s.items : [],
    }));

    try {
      const data = await productsApi.attributeDefinitions.listByCategory(id);
      const items = Array.isArray(data) ? data : [];
      setState({ categoryId: id, items, loading: false, error: null });
    } catch (err) {
      setState({
        categoryId: id,
        items: [],
        loading: false,
        error: getAxiosErrorMessage(err) ?? tc("errors.generic"),
      });
    }
  }, [tc]);

  const refresh = useCallback(async () => {
    if (!activeCategoryId || !canFetch) return;
    await refreshFor(activeCategoryId);
  }, [activeCategoryId, canFetch, refreshFor]);

  useEffect(() => {
    if (!activeCategoryId || !canFetch) return;
    queueMicrotask(() => {
      void refreshFor(activeCategoryId);
    });
  }, [activeCategoryId, canFetch, refreshFor]);

  const createDefinition = useCallback(
    async (dto: ProductAttributeDefinitionCreateDto) => {
      const created = await productsApi.attributeDefinitions.create(dto);

      setState((s) => {
        if (s.categoryId !== created.categoryId) return s;
        return {
          ...s,
          items: [...s.items, created].sort((a, b) => a.sortOrder - b.sortOrder),
        };
      });

      return created;
    },
    []
  );

  const updateDefinition = useCallback(
    async (id: string, dto: ProductAttributeDefinitionUpdateDto) => {
      const updated = await productsApi.attributeDefinitions.update(id, dto);
      setState((s) => {
        if (s.categoryId !== updated.categoryId) return s;
        return {
          ...s,
          items: s.items
            .map((it) => (it.id === id ? updated : it))
            .sort((a, b) => a.sortOrder - b.sortOrder),
        };
      });
      return updated;
    },
    []
  );

  const deleteDefinition = useCallback(async (id: string) => {
    await productsApi.attributeDefinitions.remove(id);
    setState((s) => ({ ...s, items: s.items.filter((it) => it.id !== id) }));
  }, []);

  const items = useMemo(() => {
    if (!matches) return [];
    return Array.isArray(state.items) ? state.items : [];
  }, [matches, state.items]);
  const loading = matches ? state.loading : false;
  const error = matches ? state.error : null;

  const visibleInTable = useMemo(
    () => items.filter((d) => d.isVisibleInTable).sort((a, b) => a.sortOrder - b.sortOrder),
    [items]
  );

  return {
    items,
    visibleInTable,
    loading,
    error,
    refresh,
    createDefinition,
    updateDefinition,
    deleteDefinition,
  };
}
