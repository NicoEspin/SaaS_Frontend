import { apiClient } from "@/lib/api-client";
import { omitEmpty } from "@/lib/products/utils";

import type {
  AdjustStockDto,
  BranchInventoryItem,
  InventoryListResult,
  ProductStockResult,
  TransferStockDto,
} from "@/lib/inventory/types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function toNumber(value: unknown): number | null {
  if (typeof value !== "number") return null;
  if (!Number.isFinite(value)) return null;
  return value;
}

function toString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const s = value.trim();
  return s ? s : null;
}

function toInventoryItem(value: unknown): BranchInventoryItem | null {
  if (!isRecord(value)) return null;

  const id = toString(value.id);
  const productId = toString(value.productId);
  const productCode = toString(value.productCode);
  const productName = toString(value.productName);
  const stockOnHand = toNumber(value.stockOnHand);
  const price = toNumber(value.price);

  const categoryNameRaw = value.categoryName;
  const categoryName =
    categoryNameRaw === null
      ? null
      : typeof categoryNameRaw === "string"
        ? categoryNameRaw
        : null;

  if (!id || !productId || !productCode || !productName) return null;
  if (stockOnHand === null || price === null) return null;

  return {
    id,
    productId,
    productCode,
    productName,
    categoryName,
    stockOnHand,
    price,
  };
}

function toInventoryListResult(data: unknown): InventoryListResult {
  if (!isRecord(data)) return { items: [], nextCursor: null };

  const rawItems = data.items;
  const rawCursor = data.nextCursor;

  const items: BranchInventoryItem[] = [];
  if (Array.isArray(rawItems)) {
    const seen = new Set<string>();
    for (const raw of rawItems) {
      const item = toInventoryItem(raw);
      if (!item) continue;
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      items.push(item);
    }
  }

  const nextCursor = rawCursor === null ? null : typeof rawCursor === "string" ? rawCursor : null;
  return { items, nextCursor };
}

function toProductStockResult(data: unknown): ProductStockResult {
  if (!isRecord(data)) return { stockOnHand: 0 };
  const stock = toNumber(data.stockOnHand);
  return { stockOnHand: stock ?? 0 };
}

export const inventoryApi = {
  async getInventoryByBranch(
    branchId: string,
    params?: { cursor?: string; limit?: number },
    options?: { signal?: AbortSignal }
  ): Promise<InventoryListResult> {
    const res = await apiClient.get<unknown>(`/branches/${branchId}/inventory`, {
      params: omitEmpty({
        cursor: params?.cursor,
        limit: params?.limit,
      }),
      signal: options?.signal,
    });
    return toInventoryListResult(res.data);
  },

  async getStockByProduct(
    productId: string,
    options?: { signal?: AbortSignal }
  ): Promise<ProductStockResult> {
    const res = await apiClient.get<unknown>(`/products/${productId}/stock`, {
      signal: options?.signal,
    });
    return toProductStockResult(res.data);
  },

  async adjustStock(branchId: string, dto: AdjustStockDto): Promise<void> {
    await apiClient.post<void>(`/branches/${branchId}/inventory/adjustments`, dto);
  },

  async transferStock(branchId: string, dto: TransferStockDto): Promise<void> {
    await apiClient.post<void>(`/branches/${branchId}/inventory/transfers`, dto);
  },
};
