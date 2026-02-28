import { apiClient } from "@/lib/api-client";
import { omitEmpty } from "@/lib/products/utils";

import type {
  Branch,
  BranchCreateDto,
  BranchRecord,
  BranchesListQuery,
  BranchesListResponse,
  BranchUpdateDto,
} from "@/lib/branches/types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function toNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const s = value.trim();
  return s ? s : null;
}

function toBranch(value: unknown): Branch | null {
  if (!isRecord(value)) return null;
  const id = toNonEmptyString(value.id);
  const name = toNonEmptyString(value.name);
  if (!id || !name) return null;
  return { id, name };
}

function toBranchRecord(value: unknown): BranchRecord | null {
  if (!isRecord(value)) return null;
  const id = toNonEmptyString(value.id);
  const name = toNonEmptyString(value.name);
  const createdAt = toNonEmptyString(value.createdAt);
  const updatedAt = toNonEmptyString(value.updatedAt);
  if (!id || !name || !createdAt || !updatedAt) return null;
  return { id, name, createdAt, updatedAt };
}

function toBranchesListResponse(value: unknown): BranchesListResponse {
  if (!isRecord(value)) return { items: [], nextCursor: null };

  const rawItems = value.items;
  const rawNextCursor = value.nextCursor;

  const nextCursor = rawNextCursor === null ? null : toNonEmptyString(rawNextCursor);
  if (!Array.isArray(rawItems)) return { items: [], nextCursor };

  const items: BranchRecord[] = [];
  const seen = new Set<string>();
  for (const raw of rawItems) {
    const b = toBranchRecord(raw);
    if (!b) continue;
    if (seen.has(b.id)) continue;
    seen.add(b.id);
    items.push(b);
  }

  return { items, nextCursor };
}

export const branchesApi = {
  async list(query: BranchesListQuery, options?: { signal?: AbortSignal }) {
    const res = await apiClient.get<unknown>("/branches", {
      params: omitEmpty(query),
      signal: options?.signal,
    });
    return toBranchesListResponse(res.data);
  },

  async listNames(options?: { signal?: AbortSignal }): Promise<Branch[]> {
    const res = await branchesApi.list({ limit: 200 }, options);
    const out: Branch[] = [];
    const seen = new Set<string>();
    for (const raw of res.items) {
      const b = toBranch(raw);
      if (!b) continue;
      if (seen.has(b.id)) continue;
      seen.add(b.id);
      out.push(b);
    }
    return out;
  },

  async get(id: string, options?: { signal?: AbortSignal }) {
    const res = await apiClient.get<unknown>(`/branches/${id}`, {
      signal: options?.signal,
    });
    const parsed = toBranchRecord(res.data);
    if (!parsed) throw new Error("Invalid branch response");
    return parsed;
  },

  async create(dto: BranchCreateDto) {
    const res = await apiClient.post<unknown>("/branches", dto);
    const parsed = toBranchRecord(res.data);
    if (!parsed) throw new Error("Invalid branch response");
    return parsed;
  },

  async update(id: string, dto: BranchUpdateDto) {
    const res = await apiClient.patch<unknown>(`/branches/${id}`, dto);
    const parsed = toBranchRecord(res.data);
    if (!parsed) throw new Error("Invalid branch response");
    return parsed;
  },

  async remove(id: string) {
    await apiClient.delete<void>(`/branches/${id}`);
  },

  async setActive(dto: { branchId: string }) {
    await apiClient.post<void>("/branches/active", dto);
  },
};
