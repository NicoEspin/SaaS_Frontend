import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";

import { routing } from "./i18n/routing";
import { isLocale } from "./i18n/locales";

const intlMiddleware = createMiddleware(routing);

const PUBLIC_SEGMENTS = new Set(["login", "register", "onboarding"]);
const ACCESS_TOKEN_COOKIE = "accessToken";
const REFRESH_TOKEN_COOKIE = "refreshToken";

function getLocaleFromPathname(pathname: string) {
  const maybeLocale = pathname.split("/")[1] ?? "";
  return isLocale(maybeLocale) ? maybeLocale : null;
}

function isPublicPathname(pathname: string) {
  const locale = getLocaleFromPathname(pathname);
  if (!locale) return false;
  const firstAfterLocale = pathname.split("/")[2] ?? "";
  return PUBLIC_SEGMENTS.has(firstAfterLocale);
}

export default function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  const locale = getLocaleFromPathname(pathname);
  if (locale) {
    const hasToken =
      Boolean(req.cookies.get(ACCESS_TOKEN_COOKIE)?.value) ||
      Boolean(req.cookies.get(REFRESH_TOKEN_COOKIE)?.value);
    const publicPath = isPublicPathname(pathname);

    if (!hasToken && !publicPath) {
      const url = req.nextUrl.clone();
      url.pathname = `/${locale}/login`;
      url.searchParams.set("next", `${pathname}${req.nextUrl.search}`);
      return NextResponse.redirect(url);
    }

    if (hasToken && publicPath) {
      const url = req.nextUrl.clone();
      url.pathname = `/${locale}/dashboard`;
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return intlMiddleware(req);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
