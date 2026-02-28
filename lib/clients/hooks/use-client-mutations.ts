"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";

import { customersApi } from "@/lib/clients/api";
import type { Customer, CustomerCreateDto, CustomerUpdateDto } from "@/lib/clients/types";
import { getAxiosErrorMessage } from "@/lib/products/utils";

export function useClientMutations() {
  const tc = useTranslations("Common");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCustomer = useCallback(
    async (dto: CustomerCreateDto): Promise<Customer> => {
      setSubmitting(true);
      setError(null);
      try {
        return await customersApi.customers.create(dto);
      } catch (err) {
        setError(getAxiosErrorMessage(err) ?? tc("errors.generic"));
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [tc]
  );

  const updateCustomer = useCallback(
    async (id: string, dto: CustomerUpdateDto): Promise<Customer> => {
      setSubmitting(true);
      setError(null);
      try {
        return await customersApi.customers.update(id, dto);
      } catch (err) {
        setError(getAxiosErrorMessage(err) ?? tc("errors.generic"));
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [tc]
  );

  const deleteCustomer = useCallback(
    async (id: string): Promise<void> => {
      setSubmitting(true);
      setError(null);
      try {
        await customersApi.customers.remove(id);
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
    createCustomer,
    updateCustomer,
    deleteCustomer,
  };
}
