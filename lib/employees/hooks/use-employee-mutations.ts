"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";

import { employeesApi } from "@/lib/employees/api";
import type { EmployeeCreateDto, EmployeeRecord, EmployeeUpdateDto } from "@/lib/employees/types";
import { getAxiosErrorMessage } from "@/lib/products/utils";

export function useEmployeeMutations() {
  const tc = useTranslations("Common");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createEmployee = useCallback(
    async (dto: EmployeeCreateDto): Promise<EmployeeRecord> => {
      setSubmitting(true);
      setError(null);
      try {
        return await employeesApi.create(dto);
      } catch (err) {
        setError(getAxiosErrorMessage(err) ?? tc("errors.generic"));
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [tc]
  );

  const updateEmployee = useCallback(
    async (id: string, dto: EmployeeUpdateDto): Promise<EmployeeRecord> => {
      setSubmitting(true);
      setError(null);
      try {
        return await employeesApi.update(id, dto);
      } catch (err) {
        setError(getAxiosErrorMessage(err) ?? tc("errors.generic"));
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [tc]
  );

  return { submitting, error, createEmployee, updateEmployee };
}
