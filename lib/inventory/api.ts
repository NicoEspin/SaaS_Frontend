import { apiClient } from "@/lib/api-client";
import { omitEmpty } from "@/lib/products/utils";

import type {
  AdjustStockDto,
  BranchInventoryItem,
  InventoryDisplayAttribute,
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

function toInventoryDisplayAttribute(value: unknown): InventoryDisplayAttribute | null {
  if (!isRecord(value)) return null;

  const key = toString(value.key);
  const label = toString(value.label);

  if (!key || !label) return null;

  const raw = value.value;
  if (raw === null) return { key, label, value: null };
  if (typeof raw === "string") return { key, label, value: raw };
  if (typeof raw === "number" && Number.isFinite(raw)) return { key, label, value: raw };
  if (typeof raw === "boolean") return { key, label, value: raw };

  return { key, label, value: null };
}

function toInventoryDisplayAttributes(value: unknown): InventoryDisplayAttribute[] {
  if (!Array.isArray(value)) return [];

  const out: InventoryDisplayAttribute[] = [];
  const seen = new Set<string>();
  for (const raw of value) {
    const a = toInventoryDisplayAttribute(raw);
    if (!a) continue;
    if (seen.has(a.key)) continue;
    seen.add(a.key);
    out.push(a);
  }
  return out;
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

  const attrsFromProduct = toInventoryDisplayAttributes(product ? product.displayAttributes : null);
  const attrsFromRoot = toInventoryDisplayAttributes(value.displayAttributes);
  const displayAttributes = attrsFromProduct.length ? attrsFromProduct : attrsFromRoot;

  return {
    id,
    productId,
    productCode,
    productName,
    categoryName,
    displayAttributes,
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
