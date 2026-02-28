export type Cursor = string;

export type InvoiceStatus = "DRAFT" | "ISSUED";
export type InvoiceMode = "INTERNAL" | "ARCA";
export type InvoiceDocType = "A" | "B";

export type InvoiceListItem = {
  id: string;
  number: string;
  displayNumber: string | null;
  status: InvoiceStatus;
  mode: InvoiceMode;
  docType: InvoiceDocType;
  issuedAt: string | null;
  customerId: string | null;
  customerNameSnapshot: string | null;
  total: string;
  createdAt: string;
};

export type InvoicesListResponse = {
  items: InvoiceListItem[];
  nextCursor: Cursor | null;
};

export type InvoicesListQuery = {
  limit?: number;
  cursor?: Cursor;
  status?: InvoiceStatus;
  customerId?: string;
};

export type InvoiceLine = {
  id: string;
  productId: string | null;
  productCodeSnapshot: string | null;
  description: string;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
  vatRate: string;
  netUnitPrice: string;
  netLineTotal: string;
  vatAmount: string;
};

export type Invoice = {
  id: string;
  tenantId: string;
  branchId: string;
  orderId: string | null;

  customerId: string | null;

  number: string;
  displayNumber: string | null;
  mode: InvoiceMode;
  docType: InvoiceDocType;
  status: InvoiceStatus;
  issuedAt: string | null;

  customerNameSnapshot: string | null;
  customerTaxIdSnapshot: string | null;
  customerAddressSnapshot: string | null;

  subtotal: string;
  netSubtotal: string;
  taxTotal: string;
  total: string;

  createdAt: string;
  updatedAt: string;

  lines: InvoiceLine[];
};

export type IssueInvoiceDto = {
  docType: InvoiceDocType;
  mode: InvoiceMode;
};
