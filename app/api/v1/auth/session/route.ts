import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const ACCESS_TOKEN_COOKIE = "accessToken";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value ?? null;
  return NextResponse.json(
    { authenticated: Boolean(token) },
    { status: 200, headers: { "cache-control": "no-store" } }
  );
}
