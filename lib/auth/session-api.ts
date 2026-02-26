import { apiClient } from "@/lib/api-client";
import type { AuthSession } from "@/lib/auth/session";
import { parseAuthSession } from "@/lib/auth/session";

export const authSessionApi = {
  async get(options?: { signal?: AbortSignal }): Promise<AuthSession> {
    const res = await apiClient.get<unknown>("/auth/session", { signal: options?.signal });
    const parsed = parseAuthSession(res.data);
    if (!parsed) {
      throw new Error("Invalid auth session response");
    }
    return parsed;
  },
};
