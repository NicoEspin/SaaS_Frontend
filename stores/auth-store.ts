"use client";

import { create } from "zustand";
import type { AxiosError } from "axios";

import { apiClient } from "@/lib/api-client";
import { getLocaleFromPathname } from "@/lib/routes";

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
  admin: { email: string; password: string };
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

type AuthState = {
  logout: (options?: LogoutOptions) => void;

  login: (dto: LoginDto) => Promise<LoginResponse>;
  onboardingInitial: (dto: OnboardingInitialDto) => Promise<OnboardingInitialResponse>;
};

function redirectToLogin(options?: LogoutOptions) {
  if (typeof window === "undefined") return;

  const locale = getLocaleFromPathname(window.location.pathname) ?? "es";
  const url = new URL(window.location.href);
  url.pathname = `/${locale}/login`;
  url.search = "";
  if (options?.reason === "expired") url.searchParams.set("reason", "expired");
  window.location.assign(url.toString());
}

export function isAxiosError(error: unknown): error is AxiosError {
  return typeof error === "object" && error !== null && "isAxiosError" in error;
}

export const useAuthStore = create<AuthState>()(() => ({
  logout: async (options) => {
    try {
      await apiClient.post("/auth/logout");
    } catch {
      // ignore
    }
    redirectToLogin({ reason: options?.reason ?? "manual" });
  },

  login: async (dto) => {
    await apiClient.post("/auth/login", dto);
    return { ok: true };
  },

  onboardingInitial: async (dto) => {
    const res = await apiClient.post<OnboardingInitialResponse>(
      "/onboarding/initial",
      dto
    );
    return res.data;
  },
}));
