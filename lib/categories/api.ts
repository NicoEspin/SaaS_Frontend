import { apiClient } from "@/lib/api-client";
import type {
  CategoriesListQuery,
  CategoriesListResponse,
  Category,
  CategoryCreateDto,
  CategoryUpdateDto,
} from "@/lib/categories/types";
import { omitEmpty } from "@/lib/products/utils";

export const categoriesApi = {
  async list(query: CategoriesListQuery, options?: { signal?: AbortSignal }) {
    const res = await apiClient.get<CategoriesListResponse>("/categories", {
      params: omitEmpty(query),
      signal: options?.signal,
    });
    return res.data;
  },

  async get(id: string, options?: { signal?: AbortSignal }) {
    const res = await apiClient.get<Category>(`/categories/${id}`, {
      signal: options?.signal,
    });
    return res.data;
  },

  async create(dto: CategoryCreateDto) {
    const res = await apiClient.post<Category>("/categories", dto);
    return res.data;
  },

  async update(id: string, dto: CategoryUpdateDto) {
    const res = await apiClient.patch<Category>(`/categories/${id}`, dto);
    return res.data;
  },

  async remove(id: string) {
    await apiClient.delete<void>(`/categories/${id}`);
  },
};
