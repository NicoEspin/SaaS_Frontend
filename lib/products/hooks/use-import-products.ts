"use client";

import { useCallback, useState } from "react";
import axios from "axios";
import { useTranslations } from "next-intl";

import { productsApi } from "@/lib/products/api";
import type {
  ImportProductsConfirmResponse,
  ImportProductsMode,
  ImportProductsPreviewResponse,
} from "@/lib/products/types";
import { getAxiosErrorMessage } from "@/lib/products/utils";

export function useImportPreview() {
  const tc = useTranslations("Common");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [preview, setPreview] = useState<ImportProductsPreviewResponse | null>(null);

  const runPreview = useCallback(async (file: File, mode: ImportProductsMode) => {
    setLoading(true);
    setError(null);
    setErrorStatus(null);
    setPreview(null);
    try {
      const data = await productsApi.imports.productsPreview(file, mode);
      setPreview(data);
      return data;
    } catch (err) {
      setError(getAxiosErrorMessage(err) ?? tc("errors.generic"));
      setErrorStatus(axios.isAxiosError(err) ? err.response?.status ?? null : null);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [tc]);

  return { loading, error, errorStatus, preview, setPreview, runPreview };
}

export function useImportConfirm() {
  const tc = useTranslations("Common");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [result, setResult] = useState<ImportProductsConfirmResponse | null>(null);

  const confirm = useCallback(async (previewId: string) => {
    setLoading(true);
    setError(null);
    setErrorStatus(null);
    setResult(null);
    try {
      const data = await productsApi.imports.productsConfirm({ previewId });
      setResult(data);
      return data;
    } catch (err) {
      setError(getAxiosErrorMessage(err) ?? tc("errors.generic"));
      setErrorStatus(axios.isAxiosError(err) ? err.response?.status ?? null : null);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [tc]);

  return { loading, error, errorStatus, result, setResult, confirm };
}
