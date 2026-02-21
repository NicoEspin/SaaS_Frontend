"use client";

import axios from "axios";
import type { AxiosError, InternalAxiosRequestConfig } from "axios";

import { isPublicPathname } from "@/lib/routes";
import { useAuthStore } from "@/stores/auth-store";

function buildApiBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ?? "";
  const base = raw.replace(/\/$/, "");
  if (!base) return null;

  // Allow setting either the backend origin (https://api.example.com)
  // or the full API base (https://api.example.com/api/v1).
  if (/\/api\/v\d+$/i.test(base)) return base;
  return `${base}/api/v1`;
}

const API_BASE_URL = buildApiBaseUrl();

export const apiClient = axios.create({
  baseURL: API_BASE_URL ?? "/api/v1",
  withCredentials: true,
  headers: {
    Accept: "application/json",
  },
});

type RetriableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

let refreshPromise: Promise<void> | null = null;

function isRefreshableRequest(config: InternalAxiosRequestConfig) {
  const url = config.url ?? "";
  // Never attempt refresh for auth endpoints.
  return !url.startsWith("/auth/");
}

async function refreshSessionOnce() {
  if (!API_BASE_URL) throw new Error("Missing NEXT_PUBLIC_API_BASE_URL");
  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${API_BASE_URL}/auth/refresh`, null, {
        withCredentials: true,
        headers: { Accept: "application/json" },
      })
      .then(() => undefined)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

apiClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const status = error.response?.status;

    const config = error.config as RetriableRequestConfig | undefined;

    if (status === 401 && typeof window !== "undefined" && config) {
      // Avoid redirect loops for auth endpoints.
      if ((config.url ?? "").startsWith("/auth/")) {
        return Promise.reject(error);
      }

      if (!config._retry && isRefreshableRequest(config)) {
        config._retry = true;
        try {
          await refreshSessionOnce();
          return apiClient.request(config);
        } catch {
          // fall through to logout handling
        }
      }

      const pathname = window.location.pathname;
      if (!isPublicPathname(pathname)) {
        useAuthStore.getState().logout({ reason: "expired" });
      }
    }
    return Promise.reject(error);
  }
);
