import { apiClient } from "@/lib/api-client";
import { omitEmpty } from "@/lib/products/utils";
import type {
  Customer,
  CustomerCreateDto,
  CustomerUpdateDto,
  CustomersListQuery,
  CustomersListResponse,
} from "@/lib/clients/types";

export const customersApi = {
  customers: {
    async create(dto: CustomerCreateDto) {
      const res = await apiClient.post<Customer>("/customers", dto);
      return res.data;
    },

    async list(query: CustomersListQuery, options?: { signal?: AbortSignal }) {
      const res = await apiClient.get<CustomersListResponse>("/customers", {
        params: omitEmpty(query),
        signal: options?.signal,
      });
      return res.data;
    },

    async get(id: string, options?: { signal?: AbortSignal }) {
      const res = await apiClient.get<Customer>(`/customers/${id}`, {
        signal: options?.signal,
      });
      return res.data;
    },

    async update(id: string, dto: CustomerUpdateDto) {
      const res = await apiClient.patch<Customer>(`/customers/${id}`, dto);
      return res.data;
    },

    async remove(id: string) {
      const res = await apiClient.delete<{ deleted: boolean }>(`/customers/${id}`);
      return res.data;
    },
  },
};
