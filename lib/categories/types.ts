import type { ProductAttributeDefinitionType } from "@/lib/products/types";

export type Category = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type CategoriesListQuery = {
  limit?: number;
  cursor?: string;
  q?: string;
};

export type CategoriesListResponse = {
  items: Category[];
  nextCursor: string | null;
};

export type CategoryAttributeDefinitionCreateInput = {
  key: string;
  label: string;
  type: ProductAttributeDefinitionType;
  options?: string[];
  unit?: string | null;
  isRequired?: boolean;
  isVisibleInTable?: boolean;
  sortOrder?: number;
};

export type CategoryCreateDto = {
  name: string;
  attributeDefinitions?: CategoryAttributeDefinitionCreateInput[];
};

export type CategoryUpdateDto = {
  name?: string;
};
