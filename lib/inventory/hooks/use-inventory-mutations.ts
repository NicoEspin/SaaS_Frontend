"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";

import { inventoryApi } from "@/lib/inventory/api";
import type { AdjustStockDto, TransferStockDto } from "@/lib/inventory/types";
import { getAxiosErrorMessage } from "@/lib/products/utils";

export function useInventoryMutations() {
  const tc = useTranslations("Common");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const adjustStock = useCallback(
    async (branchId: string, dto: AdjustStockDto): Promise<void> => {
      setSubmitting(true);
      setError(null);
      try {
        await inventoryApi.adjustStock(branchId, dto);
      } catch (err) {
        setError(getAxiosErrorMessage(err) ?? tc("errors.generic"));
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [tc]
  );

  const transferStock = useCallback(
    async (branchId: string, dto: TransferStockDto): Promise<void> => {
      setSubmitting(true);
      setError(null);
      try {
        await inventoryApi.transferStock(branchId, dto);
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
    adjustStock,
    transferStock,
  };
}
