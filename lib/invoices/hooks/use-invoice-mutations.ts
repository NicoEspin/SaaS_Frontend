"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";

import { invoicesApi } from "@/lib/invoices/api";
import type { IssueInvoiceDto } from "@/lib/invoices/types";
import { getAxiosErrorMessage } from "@/lib/products/utils";

export function useInvoiceMutations() {
  const tc = useTranslations("Common");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const issueInvoice = useCallback(
    async (branchId: string, invoiceId: string, dto: IssueInvoiceDto): Promise<void> => {
      setSubmitting(true);
      setError(null);
      try {
        await invoicesApi.issue(branchId, invoiceId, dto);
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
    issueInvoice,
  };
}
