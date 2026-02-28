"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";

import { suppliersApi } from "@/lib/suppliers/api";
import type { Supplier, SupplierCreateDto, SupplierUpdateDto } from "@/lib/suppliers/types";
import { getAxiosErrorMessage } from "@/lib/products/utils";

export function useSupplierMutations() {
  const tc = useTranslations("Common");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createSupplier = useCallback(
    async (dto: SupplierCreateDto): Promise<Supplier> => {
      setSubmitting(true);
      setError(null);
      try {
        return await suppliersApi.suppliers.create(dto);
      } catch (err) {
        setError(getAxiosErrorMessage(err) ?? tc("errors.generic"));
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [tc]
  );

  const updateSupplier = useCallback(
    async (id: string, dto: SupplierUpdateDto): Promise<Supplier> => {
      setSubmitting(true);
      setError(null);
      try {
        return await suppliersApi.suppliers.update(id, dto);
      } catch (err) {
        setError(getAxiosErrorMessage(err) ?? tc("errors.generic"));
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [tc]
  );

  return {
    submitting,
    error,
    createSupplier,
    updateSupplier,
  };
}
