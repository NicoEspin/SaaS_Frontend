import { apiClient } from "@/lib/api-client";

import type {
  AddCartItemDto,
  Cart,
  CartItem,
  CheckoutCartDto,
  CheckoutCartResponse,
  CheckoutInvoice,
  CreateOrGetCurrentCartDto,
  UpdateCartItemQtyDto,
} from "@/lib/carts/types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function toNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const s = value.trim();
  return s ? s : null;
}

function toNullableString(value: unknown): string | null {
  if (value === null) return null;
  return toNonEmptyString(value);
}

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const s = value.trim();
    if (!s) return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function toCartItem(value: unknown): CartItem | null {
  if (!isRecord(value)) return null;

  const productId = toNonEmptyString(value.productId);
  const name = toNonEmptyString(value.name);
  const code = toNonEmptyString(value.code);
  const quantityRaw = toFiniteNumber(value.quantity);
  const unitPrice = toNonEmptyString(value.unitPrice);
  const lineTotal = toNonEmptyString(value.lineTotal);

  if (!productId || !name || !code) return null;
  if (quantityRaw === null) return null;
  if (!unitPrice || !lineTotal) return null;

  const quantity = Math.max(0, Math.floor(quantityRaw));

  return {
    productId,
    name,
    code,
    quantity,
    unitPrice,
    lineTotal,
  };
}

function toCart(value: unknown): Cart | null {
  if (!isRecord(value)) return null;

  const id = toNonEmptyString(value.id);
  const tenantId = toNonEmptyString(value.tenantId);
  const branchId = toNonEmptyString(value.branchId);
  const customerId = toNullableString(value.customerId);
  const status = toNonEmptyString(value.status);

  const subtotal = toNonEmptyString(value.subtotal);
  const discountTotal = toNonEmptyString(value.discountTotal);
  const taxTotal = toNonEmptyString(value.taxTotal);
  const total = toNonEmptyString(value.total);

  if (!id || !tenantId || !branchId || !status) return null;
  if (!subtotal || !discountTotal || !taxTotal || !total) return null;

  const items: CartItem[] = [];
  const rawItems = value.items;
  if (Array.isArray(rawItems)) {
    const seen = new Set<string>();
    for (const raw of rawItems) {
      const item = toCartItem(raw);
      if (!item) continue;
      if (seen.has(item.productId)) continue;
      seen.add(item.productId);
      items.push(item);
    }
  }

  return {
    id,
    tenantId,
    branchId,
    customerId,
    status,
    subtotal,
    discountTotal,
    taxTotal,
    total,
    items,
  };
}

function toCheckoutInvoice(value: unknown): CheckoutInvoice | null {
  if (!isRecord(value)) return null;
  const id = toNonEmptyString(value.id);
  const number = toNonEmptyString(value.number);
  const status = toNonEmptyString(value.status);
  const issuedAt = toNullableString(value.issuedAt);
  const total = toNonEmptyString(value.total);
  if (!id || !number || !status || !total) return null;
  return { id, number, status, issuedAt, total };
}

function toCheckoutCartResponse(value: unknown): CheckoutCartResponse {
  if (!isRecord(value)) throw new Error("Invalid checkout response");
  const cart = toCart(value.cart);
  const invoice = toCheckoutInvoice(value.invoice);
  if (!cart || !invoice) throw new Error("Invalid checkout response");
  return { cart, invoice };
}

export const cartsApi = {
  async getCurrent(branchId: string, options?: { signal?: AbortSignal }): Promise<Cart> {
    const res = await apiClient.get<unknown>(`/branches/${branchId}/carts/current`, {
      signal: options?.signal,
    });
    const parsed = toCart(res.data);
    if (!parsed) throw new Error("Invalid cart response");
    return parsed;
  },

  async postCurrent(
    branchId: string,
    dto?: CreateOrGetCurrentCartDto,
    options?: { signal?: AbortSignal }
  ): Promise<Cart> {
    const res = await apiClient.post<unknown>(`/branches/${branchId}/carts/current`, dto ?? null, {
      signal: options?.signal,
    });
    const parsed = toCart(res.data);
    if (!parsed) throw new Error("Invalid cart response");
    return parsed;
  },

  async get(branchId: string, cartId: string, options?: { signal?: AbortSignal }): Promise<Cart> {
    const res = await apiClient.get<unknown>(`/branches/${branchId}/carts/${cartId}`, {
      signal: options?.signal,
    });
    const parsed = toCart(res.data);
    if (!parsed) throw new Error("Invalid cart response");
    return parsed;
  },

  async addItem(branchId: string, cartId: string, dto: AddCartItemDto): Promise<void> {
    await apiClient.post<void>(`/branches/${branchId}/carts/${cartId}/items`, dto);
  },

  async updateItemQty(
    branchId: string,
    cartId: string,
    productId: string,
    dto: UpdateCartItemQtyDto
  ): Promise<void> {
    await apiClient.patch<void>(
      `/branches/${branchId}/carts/${cartId}/items/${productId}`,
      dto
    );
  },

  async removeItem(branchId: string, cartId: string, productId: string): Promise<void> {
    await apiClient.delete<void>(`/branches/${branchId}/carts/${cartId}/items/${productId}`);
  },

  async checkout(branchId: string, cartId: string, dto?: CheckoutCartDto): Promise<CheckoutCartResponse> {
    const res = await apiClient.post<unknown>(
      `/branches/${branchId}/carts/${cartId}/checkout`,
      dto ?? null
    );
    return toCheckoutCartResponse(res.data);
  },
};
