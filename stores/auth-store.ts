"use client";

import { create } from "zustand";
import type { AxiosError } from "axios";

import { apiClient } from "@/lib/api-client";
import type { AuthSession } from "@/lib/auth/session";
import { authSessionApi } from "@/lib/auth/session-api";
import { getLoginPathForPathname } from "@/lib/routes";

export type LoginDto = {
  tenantSlug: string;
  email: string;
  password: string;
};

export type LoginResponse = {
  ok: true;
};

export type OnboardingInitialDto = {
  tenant: { name: string; slug: string };
  branch?: { name: string };
  admin: { fullName: string; email: string; password: string };
};

export type OnboardingInitialResponse = {
  tenant?: { id: string | number; slug: string; name: string };
  user?: { id: string | number; email: string };
  membership?: { id: string | number; role: string };
  ok?: true;
};

type LogoutOptions = {
  reason?: "expired" | "manual";
};

export type SessionError = {
  kind: "generic" | "unauthorized" | "invalid";
};

type AuthState = {
  session: AuthSession | null;
  sessionLoading: boolean;
  sessionError: SessionError | null;

  hydrateSession: () => Promise<AuthSession>;

  logout: (options?: LogoutOptions) => Promise<void>;

  login: (dto: LoginDto) => Promise<LoginResponse>;
  onboardingInitial: (
    dto: OnboardingInitialDto,
  ) => Promise<OnboardingInitialResponse>;
};

function redirectToLogin(options?: LogoutOptions) {
  if (typeof window === "undefined") return;

  const url = new URL(window.location.href);
  url.pathname = getLoginPathForPathname(window.location.pathname);
  url.search = "";
  if (options?.reason === "expired") url.searchParams.set("reason", "expired");
  window.location.assign(url.toString());
}

export function isAxiosError(error: unknown): error is AxiosError {
  return typeof error === "object" && error !== null && "isAxiosError" in error;
}

let hydratePromise: Promise<AuthSession> | null = null;

export const useAuthStore = create<AuthState>()((set, get) => ({
  session: null,
  sessionLoading: false,
  sessionError: null,

  hydrateSession: async () => {
    if (hydratePromise) return hydratePromise;

    set({ sessionLoading: true, sessionError: null });
    hydratePromise = authSessionApi
      .get()
      .then((session) => {
        set({ session, sessionLoading: false, sessionError: null });
        return session;
      })
      .catch((err: unknown) => {
        const status =
          isAxiosError(err) && typeof err.response?.status === "number"
            ? err.response.status
            : null;

        set({
          session: null,
          sessionLoading: false,
          sessionError:
            status === 401
              ? { kind: "unauthorized" }
              : err instanceof Error && err.message.includes("Invalid auth session")
                ? { kind: "invalid" }
                : { kind: "generic" },
        });

        throw err;
      })
      .finally(() => {
        hydratePromise = null;
      });

    return hydratePromise;
  },

  logout: async (options) => {
    set({ session: null, sessionError: null, sessionLoading: false });

    try {
      await apiClient.post("/auth/logout");
    } catch {
      // ignore
    }
    redirectToLogin({ reason: options?.reason ?? "manual" });
  },

  login: async (dto) => {
    await apiClient.post("/auth/login", dto);
    try {
      await get().hydrateSession();
    } catch {
      // best-effort: route is still protected by cookies
    }
    return { ok: true };
  },

  onboardingInitial: async (dto) => {
    const res = await apiClient.post<OnboardingInitialResponse>(
      "/onboarding/initial",
      dto,
    );
    try {
      await get().hydrateSession();
    } catch {
      // best-effort
    }
    return res.data;
  },
}));
