import { apiClient } from "@/lib/api-client";
import { omitEmpty } from "@/lib/products/utils";
import type {
  ExportColumn,
  ExportProductsFormat,
  ImportProductsConfirmDto,
  ImportProductsConfirmResponse,
  ImportProductsMode,
  ImportProductsPreviewResponse,
  Product,
  ProductAttributeDefinition,
  ProductAttributeDefinitionCreateDto,
  ProductAttributeDefinitionUpdateDto,
  ProductCreateDto,
  ProductUpdateDto,
  ProductsListQuery,
  ProductsListResponse,
} from "@/lib/products/types";

export const productsApi = {
  products: {
    async create(dto: ProductCreateDto) {
      const res = await apiClient.post<Product>("/products", dto);
      return res.data;
    },

    async list(query: ProductsListQuery, options?: { signal?: AbortSignal }) {
      const res = await apiClient.get<ProductsListResponse>("/products", {
        params: omitEmpty(query),
        signal: options?.signal,
      });
      return res.data;
    },

    async get(id: string) {
      const res = await apiClient.get<Product>(`/products/${id}`);
      return res.data;
    },

    async update(id: string, dto: ProductUpdateDto) {
      const res = await apiClient.patch<Product>(`/products/${id}`, dto);
      return res.data;
    },

    async remove(id: string) {
      await apiClient.delete<void>(`/products/${id}`);
    },
  },

  attributeDefinitions: {
    async create(dto: ProductAttributeDefinitionCreateDto) {
      const res = await apiClient.post<ProductAttributeDefinition>(
        "/products/attribute-definitions",
        dto
      );
      return res.data;
    },

    async listByCategory(categoryId: string) {
      const res = await apiClient.get<ProductAttributeDefinition[]>(
        "/products/attribute-definitions",
        { params: { categoryId } }
      );
      return res.data;
    },

    async update(id: string, dto: ProductAttributeDefinitionUpdateDto) {
      const res = await apiClient.patch<ProductAttributeDefinition>(
        `/products/attribute-definitions/${id}`,
        dto
      );
      return res.data;
    },

    async remove(id: string) {
      await apiClient.delete<void>(`/products/attribute-definitions/${id}`);
    },
  },

  imports: {
    async productsPreview(file: File, mode: ImportProductsMode) {
      const form = new FormData();
      form.append("file", file);

      const res = await apiClient.post<ImportProductsPreviewResponse>(
        "/imports/products/preview",
        form,
        { params: { mode } }
      );
      return res.data;
    },

    async productsConfirm(dto: ImportProductsConfirmDto) {
      const res = await apiClient.post<ImportProductsConfirmResponse>(
        "/imports/products/confirm",
        dto
      );
      return res.data;
    },
  },

  exports: {
    async products(params: {
      format: ExportProductsFormat;
      columns: ExportColumn[];
      filters: Omit<ProductsListQuery, "limit" | "cursor">;
    }) {
      const columnsValue = params.columns.join(",");

      const res = await apiClient.get<Blob>("/exports/products", {
        params: omitEmpty({
          format: params.format,
          columns: columnsValue,
          ...params.filters,
        }),
        responseType: "blob",
      });

      return { blob: res.data, headers: res.headers };
    },
  },
};
