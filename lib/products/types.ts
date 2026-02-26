export type Cursor = string;

export type ProductAttributeValue = string | number | boolean;

export type Product = {
  id: string;
  code: string;
  name: string;
  category: { id: string; name: string } | null;
  description: string | null;
  attributes: Record<string, ProductAttributeValue>;
  displayAttributes: Array<{ key: string; label: string; value: ProductAttributeValue }>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ProductsListResponse = {
  items: Product[];
  nextCursor: Cursor | null;
};

export type ProductsListQuery = {
  limit?: number;
  cursor?: Cursor;
  q?: string;
  name?: string;
  code?: string;
  categoryId?: string;
  categoryName?: string;
  isActive?: boolean;
};

export type ProductCreateDto = {
  code: string;
  name: string;
  categoryId?: string;
  description?: string;
  isActive?: boolean;
  attributes?: Record<string, unknown>;
  initialStock?: Array<{
    branchId: string;
    stockOnHand: number;
    price: number;
  }>;
};

export type ProductUpdateDto = {
  code?: string;
  name?: string;
  categoryId?: string;
  description?: string;
  isActive?: boolean;
  attributes?: Record<string, unknown>;
};

export type ProductAttributeDefinitionType =
  | "TEXT"
  | "NUMBER"
  | "BOOLEAN"
  | "DATE"
  | "ENUM";

export type ProductAttributeDefinition = {
  id: string;
  categoryId: string;
  key: string;
  label: string;
  type: ProductAttributeDefinitionType;
  options: string[] | null;
  unit: string | null;
  isRequired: boolean;
  isVisibleInTable: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type ProductAttributeDefinitionCreateDto = {
  categoryId: string;
  key: string;
  label: string;
  type: ProductAttributeDefinitionType;
  options?: string[] | null;
  unit?: string | null;
  isRequired?: boolean;
  isVisibleInTable?: boolean;
  sortOrder?: number;
};

export type ProductAttributeDefinitionUpdateDto = {
  key?: string;
  label?: string;
  type?: ProductAttributeDefinitionType;
  options?: string[] | null;
  unit?: string | null;
  isRequired?: boolean;
  isVisibleInTable?: boolean;
  sortOrder?: number;
};

export type ImportProductsMode = "create" | "update" | "upsert";

export type ImportPreviewSummary = {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  willCreate: number;
  willUpdate: number;
};

export type ImportRowError = {
  rowNumber: number;
  column: string;
  message: string;
};

export type ImportProductsPreviewResponse = {
  previewId: string;
  summary: ImportPreviewSummary;
  errors: ImportRowError[];
  rows: Array<Record<string, unknown>>;
};

export type ImportProductsConfirmDto = {
  previewId: string;
};

export type ImportProductsConfirmResponse = {
  processed: number;
  created: number;
  updated: number;
  failed: number;
  errors: ImportRowError[];
};

export type ExportProductsFormat = "xlsx" | "csv";

export const EXPORT_BASE_COLUMNS = [
  "code",
  "name",
  "categoryId",
  "categoryName",
  "description",
  "isActive",
  "createdAt",
  "updatedAt",
] as const;

export type ExportBaseColumn = (typeof EXPORT_BASE_COLUMNS)[number];
export type ExportColumn = ExportBaseColumn | `attr_${string}`;
