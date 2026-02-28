import { z } from "zod";

export const supplierSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    email: z.string().nullable(),
    phone: z.string().nullable(),
    address: z.string().nullable(),
    taxId: z.string().nullable(),
    paymentTerms: z.string(),
    notes: z.string().nullable(),
    isActive: z.boolean(),
    createdAt: z.string().min(1),
    updatedAt: z.string().min(1),
  })
  .passthrough();

export type Supplier = z.infer<typeof supplierSchema>;

export const suppliersListResponseSchema = z.object({
  items: z.array(supplierSchema),
  nextCursor: z.string().nullable(),
});

export type SuppliersListResponse = z.infer<typeof suppliersListResponseSchema>;

export const suppliersListQuerySchema = z.object({
  limit: z.number().int().positive().optional(),
  cursor: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
  q: z.string().optional(),
});

export type SuppliersListQuery = z.infer<typeof suppliersListQuerySchema>;

export const supplierCreateDtoSchema = z.object({
  name: z.string().min(1),
  email: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  address: z.string().min(1).optional(),
  taxId: z.string().min(1).optional(),
  paymentTerms: z.string().min(1),
  notes: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
});

export type SupplierCreateDto = z.infer<typeof supplierCreateDtoSchema>;

export const supplierUpdateDtoSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  taxId: z.string().nullable().optional(),
  paymentTerms: z.string().min(1).optional(),
  notes: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

export type SupplierUpdateDto = z.infer<typeof supplierUpdateDtoSchema>;
