"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";

import { productsApi } from "@/lib/products/api";
import type { Product, ProductCreateDto, ProductUpdateDto } from "@/lib/products/types";
import { getAxiosErrorMessage } from "@/lib/products/utils";

export function useProductMutations() {
  const tc = useTranslations("Common");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createProduct = useCallback(async (dto: ProductCreateDto): Promise<Product> => {
    setSubmitting(true);
    setError(null);
    try {
      return await productsApi.products.create(dto);
    } catch (err) {
      setError(getAxiosErrorMessage(err) ?? tc("errors.generic"));
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, [tc]);

  const updateProduct = useCallback(
    async (id: string, dto: ProductUpdateDto): Promise<Product> => {
      setSubmitting(true);
      setError(null);
      try {
        return await productsApi.products.update(id, dto);
      } catch (err) {
        setError(getAxiosErrorMessage(err) ?? tc("errors.generic"));
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [tc]
  );

  const deleteProduct = useCallback(async (id: string): Promise<void> => {
    setSubmitting(true);
    setError(null);
    try {
      await productsApi.products.remove(id);
    } catch (err) {
      setError(getAxiosErrorMessage(err) ?? tc("errors.generic"));
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, [tc]);

  return {
    submitting,
    error,
    createProduct,
    updateProduct,
    deleteProduct,
  };
}
