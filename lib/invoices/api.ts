import { apiClient } from "@/lib/api-client";
import { omitEmpty, parseContentDispositionFilename } from "@/lib/products/utils";

import type {
  Invoice,
  InvoiceDocType,
  InvoiceLine,
  InvoiceListItem,
  InvoiceMode,
  InvoiceStatus,
  InvoicesListQuery,
  InvoicesListResponse,
  IssueInvoiceDto,
} from "@/lib/invoices/types";

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

function toNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const s = value.trim();
    if (!s) return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

const INVOICE_STATUSES = ["DRAFT", "ISSUED"] as const;
const INVOICE_MODES = ["INTERNAL", "ARCA"] as const;
const INVOICE_DOC_TYPES = ["A", "B"] as const;

function isInvoiceStatus(value: string): value is InvoiceStatus {
  return (INVOICE_STATUSES as readonly string[]).includes(value);
}

function isInvoiceMode(value: string): value is InvoiceMode {
  return (INVOICE_MODES as readonly string[]).includes(value);
}

function isInvoiceDocType(value: string): value is InvoiceDocType {
  return (INVOICE_DOC_TYPES as readonly string[]).includes(value);
}

function toInvoiceListItem(value: unknown): InvoiceListItem | null {
  if (!isRecord(value)) return null;

  const id = toNonEmptyString(value.id);
  const number = toNonEmptyString(value.number);
  const displayNumber = toNullableString(value.displayNumber);

  const statusRaw = toNonEmptyString(value.status);
  const modeRaw = toNonEmptyString(value.mode);
  const docTypeRaw = toNonEmptyString(value.docType);

  const issuedAt = toNullableString(value.issuedAt);
  const customerId = toNullableString(value.customerId);
  const customerNameSnapshot = toNullableString(value.customerNameSnapshot);
  const total = toNonEmptyString(value.total);
  const createdAt = toNonEmptyString(value.createdAt);

  if (!id || !number || !statusRaw || !modeRaw || !docTypeRaw || !total || !createdAt) {
    return null;
  }
  if (!isInvoiceStatus(statusRaw) || !isInvoiceMode(modeRaw) || !isInvoiceDocType(docTypeRaw)) {
    return null;
  }

  return {
    id,
    number,
    displayNumber,
    status: statusRaw,
    mode: modeRaw,
    docType: docTypeRaw,
    issuedAt,
    customerId,
    customerNameSnapshot,
    total,
    createdAt,
  };
}

function toInvoicesListResponse(value: unknown): InvoicesListResponse {
  if (!isRecord(value)) return { items: [], nextCursor: null };

  const rawItems = value.items;
  const rawNextCursor = value.nextCursor;

  const nextCursor = rawNextCursor === null ? null : toNonEmptyString(rawNextCursor);

  const items: InvoiceListItem[] = [];
  if (Array.isArray(rawItems)) {
    const seen = new Set<string>();
    for (const raw of rawItems) {
      const item = toInvoiceListItem(raw);
      if (!item) continue;
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      items.push(item);
    }
  }

  return { items, nextCursor };
}

function toInvoiceLine(value: unknown): InvoiceLine | null {
  if (!isRecord(value)) return null;

  const id = toNonEmptyString(value.id);
  const productId = toNullableString(value.productId);
  const productCodeSnapshot = toNullableString(value.productCodeSnapshot);
  const description = toNonEmptyString(value.description);
  const quantity = toNumber(value.quantity);
  const unitPrice = toNonEmptyString(value.unitPrice);
  const lineTotal = toNonEmptyString(value.lineTotal);
  const vatRate = toNonEmptyString(value.vatRate);
  const netUnitPrice = toNonEmptyString(value.netUnitPrice);
  const netLineTotal = toNonEmptyString(value.netLineTotal);
  const vatAmount = toNonEmptyString(value.vatAmount);

  if (!id || !description) return null;
  if (quantity === null) return null;
  if (!unitPrice || !lineTotal || !vatRate || !netUnitPrice || !netLineTotal || !vatAmount) {
    return null;
  }

  return {
    id,
    productId,
    productCodeSnapshot,
    description,
    quantity,
    unitPrice,
    lineTotal,
    vatRate,
    netUnitPrice,
    netLineTotal,
    vatAmount,
  };
}

function toInvoice(value: unknown): Invoice | null {
  if (!isRecord(value)) return null;

  const id = toNonEmptyString(value.id);
  const tenantId = toNonEmptyString(value.tenantId);
  const branchId = toNonEmptyString(value.branchId);
  const orderId = toNullableString(value.orderId);
  const customerId = toNullableString(value.customerId);
  const number = toNonEmptyString(value.number);
  const displayNumber = toNullableString(value.displayNumber);
  const modeRaw = toNonEmptyString(value.mode);
  const docTypeRaw = toNonEmptyString(value.docType);
  const statusRaw = toNonEmptyString(value.status);
  const issuedAt = toNullableString(value.issuedAt);

  const customerNameSnapshot = toNullableString(value.customerNameSnapshot);
  const customerTaxIdSnapshot = toNullableString(value.customerTaxIdSnapshot);
  const customerAddressSnapshot = toNullableString(value.customerAddressSnapshot);

  const subtotal = toNonEmptyString(value.subtotal);
  const netSubtotal = toNonEmptyString(value.netSubtotal);
  const taxTotal = toNonEmptyString(value.taxTotal);
  const total = toNonEmptyString(value.total);

  const createdAt = toNonEmptyString(value.createdAt);
  const updatedAt = toNonEmptyString(value.updatedAt);

  if (
    !id ||
    !tenantId ||
    !branchId ||
    !number ||
    !modeRaw ||
    !docTypeRaw ||
    !statusRaw ||
    !subtotal ||
    !netSubtotal ||
    !taxTotal ||
    !total ||
    !createdAt ||
    !updatedAt
  ) {
    return null;
  }
  if (!isInvoiceMode(modeRaw) || !isInvoiceDocType(docTypeRaw) || !isInvoiceStatus(statusRaw)) {
    return null;
  }

  const lines: InvoiceLine[] = [];
  const rawLines = value.lines;
  if (Array.isArray(rawLines)) {
    const seen = new Set<string>();
    for (const raw of rawLines) {
      const line = toInvoiceLine(raw);
      if (!line) continue;
      if (seen.has(line.id)) continue;
      seen.add(line.id);
      lines.push(line);
    }
  }

  return {
    id,
    tenantId,
    branchId,
    orderId,
    customerId,
    number,
    displayNumber,
    mode: modeRaw,
    docType: docTypeRaw,
    status: statusRaw,
    issuedAt,
    customerNameSnapshot,
    customerTaxIdSnapshot,
    customerAddressSnapshot,
    subtotal,
    netSubtotal,
    taxTotal,
    total,
    createdAt,
    updatedAt,
    lines,
  };
}

export const invoicesApi = {
  async list(
    branchId: string,
    query: InvoicesListQuery,
    options?: { signal?: AbortSignal }
  ): Promise<InvoicesListResponse> {
    const res = await apiClient.get<unknown>(`/branches/${branchId}/invoices`, {
      params: omitEmpty(query),
      signal: options?.signal,
    });
    return toInvoicesListResponse(res.data);
  },

  async get(branchId: string, invoiceId: string, options?: { signal?: AbortSignal }): Promise<Invoice> {
    const res = await apiClient.get<unknown>(`/branches/${branchId}/invoices/${invoiceId}`, {
      signal: options?.signal,
    });
    const parsed = toInvoice(res.data);
    if (!parsed) throw new Error("Invalid invoice response");
    return parsed;
  },

  async issue(branchId: string, invoiceId: string, dto: IssueInvoiceDto): Promise<void> {
    await apiClient.post<void>(`/branches/${branchId}/invoices/${invoiceId}/issue`, dto);
  },

  async getPdf(
    branchId: string,
    invoiceId: string,
    options?: { variant?: "internal"; signal?: AbortSignal }
  ): Promise<{ blob: Blob; filename: string | null }> {
    const variant = options?.variant ?? "internal";
    const res = await apiClient.get<Blob>(`/branches/${branchId}/invoices/${invoiceId}/pdf`, {
      params: omitEmpty({ variant }),
      responseType: "blob",
      signal: options?.signal,
      headers: {
        Accept: "application/pdf",
      },
    });

    const disposition =
      typeof res.headers?.["content-disposition"] === "string"
        ? res.headers["content-disposition"]
        : null;

    return {
      blob: res.data,
      filename: parseContentDispositionFilename(disposition),
    };
  },
};
