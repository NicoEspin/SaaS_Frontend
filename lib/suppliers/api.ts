import { apiClient } from "@/lib/api-client";
import { omitEmpty } from "@/lib/products/utils";
import {
  supplierSchema,
  suppliersListResponseSchema,
  type Supplier,
  type SupplierCreateDto,
  type SupplierUpdateDto,
  type SuppliersListQuery,
  type SuppliersListResponse,
} from "@/lib/suppliers/types";

function parseSupplier(value: unknown): Supplier {
  const parsed = supplierSchema.safeParse(value);
  if (!parsed.success) throw new Error("Invalid supplier response");
  return parsed.data;
}

function parseSuppliersListResponse(value: unknown): SuppliersListResponse {
  const parsed = suppliersListResponseSchema.safeParse(value);
  if (!parsed.success) throw new Error("Invalid suppliers list response");
  return parsed.data;
}

export const suppliersApi = {
  suppliers: {
    async create(dto: SupplierCreateDto): Promise<Supplier> {
      const res = await apiClient.post<unknown>("/suppliers", dto);
      return parseSupplier(res.data);
    },

    async list(query: SuppliersListQuery, options?: { signal?: AbortSignal }): Promise<SuppliersListResponse> {
      const res = await apiClient.get<unknown>("/suppliers", {
        params: omitEmpty(query),
        signal: options?.signal,
      });
      return parseSuppliersListResponse(res.data);
    },

    async get(id: string, options?: { signal?: AbortSignal }): Promise<Supplier> {
      const res = await apiClient.get<unknown>(`/suppliers/${id}`, { signal: options?.signal });
      return parseSupplier(res.data);
    },

    async update(id: string, dto: SupplierUpdateDto): Promise<Supplier> {
      const res = await apiClient.patch<unknown>(`/suppliers/${id}`, dto);
      return parseSupplier(res.data);
    },
  },
};
