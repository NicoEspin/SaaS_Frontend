import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { buildBackendUrl } from "@/lib/server/backend";

const ACCESS_TOKEN_COOKIE = "accessToken";

function isSameOrigin(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  return origin === req.nextUrl.origin;
}

async function handler(req: NextRequest, params: Promise<{ path: string[] }>) {
  if (req.method !== "GET" && req.method !== "HEAD" && !isSameOrigin(req)) {
    return NextResponse.json({ message: "Invalid origin" }, { status: 403 });
  }

  const { path } = await params;
  const pathname = `/api/v1/${path.join("/")}`;
  const url = buildBackendUrl(pathname, req.nextUrl.search);
  if (!url) {
    return NextResponse.json(
      { message: "Missing API_BASE_URL" },
      { status: 500 }
    );
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value ?? null;
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };

  for (const [key, value] of req.headers.entries()) {
    const k = key.toLowerCase();
    if (k === "host") continue;
    if (k === "cookie") continue;
    if (k === "authorization") continue;
    if (k === "content-length") continue;
    if (k === "connection") continue;
    if (k.startsWith("x-") || k === "accept" || k === "content-type" || k === "accept-language") {
      headers[key] = value;
    }
  }

  const body =
    req.method === "GET" || req.method === "HEAD" ? undefined : await req.text();

  const upstream = await fetch(url, {
    method: req.method,
    headers,
    body,
    redirect: "manual",
    cache: "no-store",
  });

  if (upstream.status === 401) {
    cookieStore.delete(ACCESS_TOKEN_COOKIE);
  }

  const resHeaders = new Headers();
  const upstreamContentType = upstream.headers.get("content-type");
  if (upstreamContentType) resHeaders.set("content-type", upstreamContentType);
  resHeaders.set("cache-control", "no-store");

  const upstreamBody = await upstream.arrayBuffer();
  return new NextResponse(upstreamBody, {
    status: upstream.status,
    headers: resHeaders,
  });
}

export function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return handler(req, ctx.params);
}
export function POST(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return handler(req, ctx.params);
}
export function PUT(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return handler(req, ctx.params);
}
export function PATCH(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return handler(req, ctx.params);
}
export function DELETE(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return handler(req, ctx.params);
}
