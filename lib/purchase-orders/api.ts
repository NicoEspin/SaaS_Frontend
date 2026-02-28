import { apiClient } from "@/lib/api-client";
import { omitEmpty } from "@/lib/products/utils";
import {
  purchaseOrderSchema,
  purchaseOrdersListResponseSchema,
  purchaseReceiptSchema,
  type PurchaseOrder,
  type PurchaseOrderCreateDto,
  type PurchaseOrdersListQuery,
  type PurchaseOrdersListResponse,
  type PurchaseReceipt,
  type PurchaseReceiptCreateDto,
} from "@/lib/purchase-orders/types";

function parsePurchaseOrder(value: unknown): PurchaseOrder {
  const parsed = purchaseOrderSchema.safeParse(value);
  if (!parsed.success) throw new Error("Invalid purchase order response");
  return parsed.data;
}

function parsePurchaseOrdersListResponse(value: unknown): PurchaseOrdersListResponse {
  const parsed = purchaseOrdersListResponseSchema.safeParse(value);
  if (!parsed.success) throw new Error("Invalid purchase orders list response");
  return parsed.data;
}

function parsePurchaseReceipt(value: unknown): PurchaseReceipt {
  const parsed = purchaseReceiptSchema.safeParse(value);
  if (!parsed.success) throw new Error("Invalid purchase receipt response");
  return parsed.data;
}

export const purchaseOrdersApi = {
  async create(dto: PurchaseOrderCreateDto): Promise<PurchaseOrder> {
    const res = await apiClient.post<unknown>("/purchase-orders", dto);
    return parsePurchaseOrder(res.data);
  },

  async list(query: PurchaseOrdersListQuery, options?: { signal?: AbortSignal }): Promise<PurchaseOrdersListResponse> {
    const res = await apiClient.get<unknown>("/purchase-orders", {
      params: omitEmpty(query),
      signal: options?.signal,
    });
    return parsePurchaseOrdersListResponse(res.data);
  },

  async get(id: string, options?: { signal?: AbortSignal }): Promise<PurchaseOrder> {
    const res = await apiClient.get<unknown>(`/purchase-orders/${id}`, {
      signal: options?.signal,
    });
    return parsePurchaseOrder(res.data);
  },

  async confirm(id: string): Promise<void> {
    await apiClient.post<void>(`/purchase-orders/${id}/confirm`, null);
  },

  async cancel(id: string): Promise<void> {
    await apiClient.post<void>(`/purchase-orders/${id}/cancel`, null);
  },

  async createReceipt(id: string, dto: PurchaseReceiptCreateDto): Promise<PurchaseReceipt> {
    const res = await apiClient.post<unknown>(`/purchase-orders/${id}/receipts`, dto);
    return parsePurchaseReceipt(res.data);
  },
};
