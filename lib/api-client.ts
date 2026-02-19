"use client";

import axios from "axios";
import type { AxiosError } from "axios";

import { isPublicPathname } from "@/lib/routes";
import { useAuthStore } from "@/stores/auth-store";

export const apiClient = axios.create({
  baseURL: "/api/v1",
  withCredentials: true,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    const status = error.response?.status;
    if (status === 401 && typeof window !== "undefined") {
      const pathname = window.location.pathname;
      if (!isPublicPathname(pathname)) {
        useAuthStore.getState().logout({ reason: "expired" });
      }
    }
    return Promise.reject(error);
  }
);
