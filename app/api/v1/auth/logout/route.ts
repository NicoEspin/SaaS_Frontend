import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const ACCESS_TOKEN_COOKIE = "accessToken";

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (origin && origin !== req.nextUrl.origin) {
    return NextResponse.json({ message: "Invalid origin" }, { status: 403 });
  }

  const cookieStore = await cookies();
  cookieStore.delete(ACCESS_TOKEN_COOKIE);
  return new NextResponse(null, {
    status: 204,
    headers: { "cache-control": "no-store" },
  });
}
