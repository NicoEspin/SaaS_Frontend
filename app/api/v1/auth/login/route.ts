import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { buildBackendUrl } from "@/lib/server/backend";

const ACCESS_TOKEN_COOKIE = "accessToken";
const ACCESS_TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function isSameOrigin(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  return origin === req.nextUrl.origin;
}

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ message: "Invalid origin" }, { status: 403 });
  }

  const url = buildBackendUrl("/api/v1/auth/login", "");
  if (!url) {
    return NextResponse.json(
      { message: "Missing API_BASE_URL" },
      { status: 500 }
    );
  }

  const bodyText = await req.text();

  const upstream = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": req.headers.get("content-type") ?? "application/json",
      Accept: "application/json",
    },
    body: bodyText,
    cache: "no-store",
  });

  const contentType = upstream.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");

  if (!upstream.ok) {
    const payload = isJson ? await upstream.json() : await upstream.text();
    return NextResponse.json(payload, { status: upstream.status });
  }

  const data = (isJson ? await upstream.json() : null) as
    | { accessToken?: unknown }
    | null;
  const accessToken =
    data && typeof data.accessToken === "string" ? data.accessToken : null;

  if (!accessToken) {
    return NextResponse.json(
      { message: "Invalid login response" },
      { status: 502 }
    );
  }

  const cookieStore = await cookies();
  cookieStore.set(ACCESS_TOKEN_COOKIE, accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ACCESS_TOKEN_MAX_AGE_SECONDS,
  });

  return new NextResponse(null, {
    status: 204,
    headers: { "cache-control": "no-store" },
  });
}
