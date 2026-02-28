import { apiClient } from "@/lib/api-client";
import { omitEmpty } from "@/lib/products/utils";

import type {
  EmployeeRecord,
  EmployeesListQuery,
  EmployeesListResponse,
  EmployeeCreateDto,
  EmployeeUpdateDto,
  MembershipRole,
} from "@/lib/employees/types";
import { MEMBERSHIP_ROLES } from "@/lib/employees/types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function toNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const s = value.trim();
  return s ? s : null;
}

function isMembershipRole(value: string): value is MembershipRole {
  return (MEMBERSHIP_ROLES as readonly string[]).includes(value);
}

function toMembershipRole(value: unknown): MembershipRole | null {
  const s = toNonEmptyString(value);
  if (!s) return null;
  return isMembershipRole(s) ? s : null;
}

function toBranch(value: unknown): { id: string; name: string } | null {
  if (!isRecord(value)) return null;
  const id = toNonEmptyString(value.id);
  const name = toNonEmptyString(value.name);
  if (!id || !name) return null;
  return { id, name };
}

function toEmployeeUser(value: unknown) {
  if (!isRecord(value)) return null;
  const id = toNonEmptyString(value.id);
  const email = toNonEmptyString(value.email);
  const fullName = toNonEmptyString(value.fullName);
  const createdAt = toNonEmptyString(value.createdAt);
  if (!id || !email || !fullName || !createdAt) return null;
  return { id, email, fullName, createdAt };
}

function toEmployeeMembership(value: unknown) {
  if (!isRecord(value)) return null;
  const id = toNonEmptyString(value.id);
  const role = toMembershipRole(value.role);
  const createdAt = toNonEmptyString(value.createdAt);
  if (!id || !role || !createdAt) return null;
  return { id, role, createdAt };
}

function toEmployeeRecord(value: unknown): EmployeeRecord | null {
  if (!isRecord(value)) return null;
  const membership = toEmployeeMembership(value.membership);
  const user = toEmployeeUser(value.user);

  const rawBranch = value.activeBranch;
  const activeBranch = rawBranch === null ? null : toBranch(rawBranch);

  if (!membership || !user) return null;
  if (rawBranch !== null && !activeBranch) return null;

  return { membership, user, activeBranch };
}

function toEmployeesListResponse(value: unknown): EmployeesListResponse {
  if (!isRecord(value)) return { items: [], nextCursor: null };
  const rawItems = value.items;
  const rawNextCursor = value.nextCursor;

  const nextCursor = rawNextCursor === null ? null : toNonEmptyString(rawNextCursor);
  if (!Array.isArray(rawItems)) return { items: [], nextCursor };

  const items: EmployeeRecord[] = [];
  const seen = new Set<string>();
  for (const raw of rawItems) {
    const rec = toEmployeeRecord(raw);
    if (!rec) continue;
    if (seen.has(rec.membership.id)) continue;
    seen.add(rec.membership.id);
    items.push(rec);
  }

  return { items, nextCursor };
}

export const employeesApi = {
  async list(query: EmployeesListQuery, options?: { signal?: AbortSignal }) {
    const res = await apiClient.get<unknown>("/employees", {
      params: omitEmpty(query),
      signal: options?.signal,
    });
    return toEmployeesListResponse(res.data);
  },

  async get(id: string, options?: { signal?: AbortSignal }) {
    const res = await apiClient.get<unknown>(`/employees/${id}`, { signal: options?.signal });
    const parsed = toEmployeeRecord(res.data);
    if (!parsed) throw new Error("Invalid employee response");
    return parsed;
  },

  async create(dto: EmployeeCreateDto) {
    const res = await apiClient.post<unknown>("/employees", dto);
    const parsed = toEmployeeRecord(res.data);
    if (!parsed) throw new Error("Invalid employee response");
    return parsed;
  },

  async update(id: string, dto: EmployeeUpdateDto) {
    const res = await apiClient.patch<unknown>(`/employees/${id}`, dto);
    const parsed = toEmployeeRecord(res.data);
    if (!parsed) throw new Error("Invalid employee response");
    return parsed;
  },
};
