import "server-only";

import { cookies } from "next/headers";

import type { AuthSession } from "@/lib/auth/session";
import { parseAuthSession } from "@/lib/auth/session";

function buildApiBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ?? "";
  const base = raw.replace(/\/$/, "");
  if (!base) return null;

  if (/\/api\/v\d+$/i.test(base)) return base;
  return `${base}/api/v1`;
}

const API_BASE_URL = buildApiBaseUrl();

async function buildCookieHeader() {
  const store = await cookies();
  const list = store.getAll();
  if (list.length === 0) return "";
  return list.map((c) => `${c.name}=${c.value}`).join("; ");
}

export async function getServerAuthSession(): Promise<AuthSession | null> {
  const cookieHeader = await buildCookieHeader();

  const url = `${API_BASE_URL ?? "/api/v1"}/auth/session`;
  const res = await fetch(url, {
    method: "GET",
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    },
  });

  if (!res.ok) return null;

  const data: unknown = await res.json();
  const parsed = parseAuthSession(data);
  return parsed;
}
