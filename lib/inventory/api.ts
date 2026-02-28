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
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return null;
    return value;
  }

  if (typeof value === "string") {
    const s = value.trim();
    if (!s) return null;
    const n = Number(s);
    if (!Number.isFinite(n)) return null;
    return n;
  }

  return null;
}

function toString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const s = value.trim();
  return s ? s : null;
}

function toInventoryItem(value: unknown): BranchInventoryItem | null {
  if (!isRecord(value)) return null;

  const id = toString(value.id);

  const product = isRecord(value.product) ? value.product : null;

  const productId = toString(value.productId) ?? (product ? toString(product.id) : null);
  const productCode =
    toString(value.productCode) ??
    (product ? toString(product.code) ?? toString(product.sku) : null);
  const productName = toString(value.productName) ?? (product ? toString(product.name) : null);

  const stockOnHand = toNumber(value.stockOnHand);

  const hasPrice = "price" in value;

  const price =
    hasPrice && value.price === null
      ? null
      : toNumber(value.price) ??
        (product ? (product.price === null ? null : toNumber(product.price)) : null);

  const productCategory = product && isRecord(product.category) ? product.category : null;

  const categoryName =
    value.categoryName === null
      ? null
      : toString(value.categoryName) ??
        (product ? toString(product.categoryName) : null) ??
        (productCategory ? toString(productCategory.name) : null);

  if (!id || !productId || !productCode || !productName) return null;
  if (stockOnHand === null) return null;

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
