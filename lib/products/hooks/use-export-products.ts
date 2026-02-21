"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";

import { productsApi } from "@/lib/products/api";
import type { ExportColumn, ExportProductsFormat, ProductsListQuery } from "@/lib/products/types";
import {
  downloadBlob,
  getAxiosErrorMessage,
  parseContentDispositionFilename,
} from "@/lib/products/utils";

export function useExportProducts() {
  const tc = useTranslations("Common");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportProducts = useCallback(
    async (params: {
      format: ExportProductsFormat;
      columns: ExportColumn[];
      filters: Omit<ProductsListQuery, "limit" | "cursor">;
      fallbackFilename: string;
    }) => {
      setLoading(true);
      setError(null);
      try {
        const res = await productsApi.exports.products({
          format: params.format,
          columns: params.columns,
          filters: params.filters,
        });

        const headerValue =
          (res.headers?.["content-disposition"] as string | undefined) ?? null;
        const filename =
          parseContentDispositionFilename(headerValue) ?? params.fallbackFilename;

        downloadBlob(res.blob, filename);
      } catch (err) {
        setError(getAxiosErrorMessage(err) ?? tc("errors.generic"));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [tc]
  );

  return { loading, error, exportProducts };
}
