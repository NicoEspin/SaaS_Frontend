"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";

import { purchaseOrdersApi } from "@/lib/purchase-orders/api";
import type {
  PurchaseOrder,
  PurchaseOrderCreateDto,
  PurchaseReceipt,
  PurchaseReceiptCreateDto,
} from "@/lib/purchase-orders/types";
import { getAxiosErrorMessage } from "@/lib/products/utils";

export function usePurchaseOrderMutations() {
  const tc = useTranslations("Common");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPurchaseOrder = useCallback(
    async (dto: PurchaseOrderCreateDto): Promise<PurchaseOrder> => {
      setSubmitting(true);
      setError(null);
      try {
        return await purchaseOrdersApi.create(dto);
      } catch (err) {
        setError(getAxiosErrorMessage(err) ?? tc("errors.generic"));
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [tc]
  );

  const confirmPurchaseOrder = useCallback(
    async (purchaseOrderId: string): Promise<void> => {
      setSubmitting(true);
      setError(null);
      try {
        await purchaseOrdersApi.confirm(purchaseOrderId);
      } catch (err) {
        setError(getAxiosErrorMessage(err) ?? tc("errors.generic"));
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [tc]
  );

  const cancelPurchaseOrder = useCallback(
    async (purchaseOrderId: string): Promise<void> => {
      setSubmitting(true);
      setError(null);
      try {
        await purchaseOrdersApi.cancel(purchaseOrderId);
      } catch (err) {
        setError(getAxiosErrorMessage(err) ?? tc("errors.generic"));
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [tc]
  );

  const createReceipt = useCallback(
    async (purchaseOrderId: string, dto: PurchaseReceiptCreateDto): Promise<PurchaseReceipt> => {
      setSubmitting(true);
      setError(null);
      try {
        return await purchaseOrdersApi.createReceipt(purchaseOrderId, dto);
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
    createPurchaseOrder,
    confirmPurchaseOrder,
    cancelPurchaseOrder,
    createReceipt,
  };
}
