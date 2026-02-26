import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { defaultLocale, isLocale, type Locale } from "./i18n/locales";

const PUBLIC_SEGMENTS = new Set(["login", "register", "onboarding"]);
const ACCESS_TOKEN_COOKIE = "accessToken";
const REFRESH_TOKEN_COOKIE = "refreshToken";

const NEXT_INTL_LOCALE_HEADER = "X-NEXT-INTL-LOCALE";

function normalizePathname(pathname: string) {
  return pathname.startsWith("/") ? pathname : `/${pathname}`;
}

function splitSegments(pathname: string) {
  return normalizePathname(pathname).split("/").filter(Boolean);
}

function parseLocaleAndLogicalPathname(pathname: string): {
  locale: Locale | null;
  logicalPathname: string;
} {
  const segments = splitSegments(pathname);

  let suffixLocale: Locale | null = null;
  let prefixLocale: Locale | null = null;

  // Canonical scheme: trailing locale (/dashboard/es).
  while (segments.length && isLocale(segments[segments.length - 1] ?? "")) {
    suffixLocale = segments.pop() as Locale;
  }

  // Legacy scheme: leading locale (/es/dashboard).
  while (segments.length && isLocale(segments[0] ?? "")) {
    prefixLocale = segments.shift() as Locale;
  }

  const locale = suffixLocale ?? prefixLocale;

  const logicalPathname = `/${segments.join("/")}`;
  return { locale, logicalPathname: logicalPathname === "//" ? "/" : logicalPathname };
}

function buildCanonicalSuffixPathname(logicalPathname: string, locale: Locale) {
  const logical = normalizePathname(logicalPathname).replace(/\/$/, "");
  if (logical === "/") return `/${locale}`;
  return `${logical}/${locale}`;
}

function isPublicLogicalPathname(logicalPathname: string) {
  const first = splitSegments(logicalPathname)[0] ?? "";
  return PUBLIC_SEGMENTS.has(first);
}

export default function middleware(req: NextRequest) {
  const pathname = normalizePathname(req.nextUrl.pathname);
  const { locale: extractedLocale, logicalPathname } = parseLocaleAndLogicalPathname(pathname);

  const locale = extractedLocale ?? defaultLocale;
  const hasToken =
    Boolean(req.cookies.get(ACCESS_TOKEN_COOKIE)?.value) ||
    Boolean(req.cookies.get(REFRESH_TOKEN_COOKIE)?.value);
  const publicPath = isPublicLogicalPathname(logicalPathname);

  // Auth gating always redirects to canonical, locale-suffixed URLs.
  if (!hasToken && !publicPath) {
    const url = req.nextUrl.clone();
    url.pathname = buildCanonicalSuffixPathname("/login", locale);
    url.search = "";
    url.searchParams.set("next", `${logicalPathname}${req.nextUrl.search}`);
    return NextResponse.redirect(url);
  }

  if (hasToken && publicPath) {
    const url = req.nextUrl.clone();
    url.pathname = buildCanonicalSuffixPathname("/dashboard", locale);
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Canonicalize the URL shape to trailing locale.
  const canonicalPathname = buildCanonicalSuffixPathname(logicalPathname, locale);
  if (pathname !== canonicalPathname) {
    const url = req.nextUrl.clone();
    url.pathname = canonicalPathname;
    return NextResponse.redirect(url);
  }

  // Rewrite canonical URLs to the internal, Next.js file-system routes (/es/dashboard).
  const internalPathname = logicalPathname === "/" ? `/${locale}` : `/${locale}${logicalPathname}`;
  const url = req.nextUrl.clone();
  url.pathname = internalPathname;

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set(NEXT_INTL_LOCALE_HEADER, locale);

  return NextResponse.rewrite(url, {
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
