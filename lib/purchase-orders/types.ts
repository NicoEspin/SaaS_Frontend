import { z } from "zod";

export const purchaseOrderStatusSchema = z.enum([
  "DRAFT",
  "CONFIRMED",
  "PARTIALLY_RECEIVED",
  "COMPLETED",
  "CANCELLED",
]);

export type PurchaseOrderStatus = z.infer<typeof purchaseOrderStatusSchema>;

export const purchaseOrderPartyRefSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
  })
  .passthrough();

export type PurchaseOrderPartyRef = z.infer<typeof purchaseOrderPartyRefSchema>;

export const purchaseOrderItemSchema = z
  .object({
    id: z.string().min(1),
    productId: z.string().min(1).nullable().optional(),

    productCodeSnapshot: z.string().nullable().optional(),
    productNameSnapshot: z.string().nullable().optional(),

    quantityOrdered: z.coerce.number(),
    receivedQty: z.coerce.number(),
    agreedUnitCost: z.coerce.number(),

    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
  })
  .passthrough();

export type PurchaseOrderItem = z.infer<typeof purchaseOrderItemSchema>;

export const purchaseReceiptItemSchema = z
  .object({
    id: z.string().min(1).optional(),
    purchaseOrderItemId: z.string().min(1),
    quantityReceived: z.coerce.number(),
    actualUnitCost: z.coerce.number(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
  })
  .passthrough();

export type PurchaseReceiptItem = z.infer<typeof purchaseReceiptItemSchema>;

export const purchaseReceiptSchema = z
  .object({
    id: z.string().min(1),
    purchaseOrderId: z.string().min(1).optional(),
    receivedAt: z.string().min(1),
    notes: z.string().nullable().optional(),
    payableId: z.string().nullable().optional(),
    items: z.array(purchaseReceiptItemSchema),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
  })
  .passthrough();

export type PurchaseReceipt = z.infer<typeof purchaseReceiptSchema>;

export const purchaseOrderSchema = z
  .object({
    id: z.string().min(1),
    status: purchaseOrderStatusSchema,

    branchId: z.string().min(1).optional(),
    supplierId: z.string().min(1).optional(),
    branch: purchaseOrderPartyRefSchema.nullable().optional(),
    supplier: purchaseOrderPartyRefSchema.nullable().optional(),

    expectedAt: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),

    items: z.array(purchaseOrderItemSchema),
    receipts: z.array(purchaseReceiptSchema).optional(),

    createdAt: z.string().min(1),
    updatedAt: z.string().min(1),
  })
  .passthrough();

export type PurchaseOrder = z.infer<typeof purchaseOrderSchema>;

export const purchaseOrdersListItemSchema = z
  .object({
    id: z.string().min(1),
    status: purchaseOrderStatusSchema,
    branchId: z.string().min(1).optional(),
    supplierId: z.string().min(1).optional(),
    branch: purchaseOrderPartyRefSchema.nullable().optional(),
    supplier: purchaseOrderPartyRefSchema.nullable().optional(),
    expectedAt: z.string().nullable().optional(),
    createdAt: z.string().min(1).optional(),
    updatedAt: z.string().min(1).optional(),
  })
  .passthrough();

export type PurchaseOrdersListItem = z.infer<typeof purchaseOrdersListItemSchema>;

export const purchaseOrdersListResponseSchema = z.object({
  items: z.array(purchaseOrdersListItemSchema),
  nextCursor: z.string().nullable(),
});

export type PurchaseOrdersListResponse = z.infer<typeof purchaseOrdersListResponseSchema>;

export const purchaseOrdersListQuerySchema = z.object({
  limit: z.number().int().positive().optional(),
  cursor: z.string().min(1).optional(),
  status: purchaseOrderStatusSchema.optional(),
  supplierId: z.string().min(1).optional(),
  branchId: z.string().min(1).optional(),
  q: z.string().optional(),
});

export type PurchaseOrdersListQuery = z.infer<typeof purchaseOrdersListQuerySchema>;

export const purchaseOrderNewProductSchema = z
  .object({
    code: z.string().min(1),
    name: z.string().min(1),
    categoryId: z.string().min(1).optional(),
    attributes: z.record(z.string(), z.unknown()).optional(),
    isActive: z.boolean().optional(),
  })
  .passthrough();

export type PurchaseOrderNewProduct = z.infer<typeof purchaseOrderNewProductSchema>;

export const purchaseOrderCreateItemSchema = z
  .object({
    productId: z.string().min(1).optional(),
    newProduct: purchaseOrderNewProductSchema.optional(),
    quantityOrdered: z.number(),
    agreedUnitCost: z.number(),
  })
  .refine((v) => Boolean(v.productId) !== Boolean(v.newProduct), {
    message: "Each item must include exactly one of productId or newProduct",
    path: ["productId"],
  });

export type PurchaseOrderCreateItem = z.infer<typeof purchaseOrderCreateItemSchema>;

export const purchaseOrderCreateDtoSchema = z.object({
  branchId: z.string().min(1),
  supplierId: z.string().min(1),
  expectedAt: z.string().min(1).optional(),
  notes: z.string().min(1).optional(),
  items: z.array(purchaseOrderCreateItemSchema).min(1),
});

export type PurchaseOrderCreateDto = z.infer<typeof purchaseOrderCreateDtoSchema>;

export const purchaseReceiptCreateItemSchema = z.object({
  purchaseOrderItemId: z.string().min(1),
  quantityReceived: z.number(),
  actualUnitCost: z.number(),
});

export type PurchaseReceiptCreateItem = z.infer<typeof purchaseReceiptCreateItemSchema>;

export const purchaseReceiptCreateDtoSchema = z.object({
  receivedAt: z.string().min(1).optional(),
  notes: z.string().min(1).optional(),
  payableId: z.string().min(1).optional(),
  items: z.array(purchaseReceiptCreateItemSchema).min(1),
});

export type PurchaseReceiptCreateDto = z.infer<typeof purchaseReceiptCreateDtoSchema>;
