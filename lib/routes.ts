import { defaultLocale, isLocale, type Locale } from "@/i18n/locales";

export const PUBLIC_ROUTE_SEGMENTS = ["login", "register", "onboarding"] as const;

export type LocalePlacement = "suffix" | "prefix" | null;

export type ParsedLocalePathname = {
  locale: Locale | null;
  placement: LocalePlacement;
  pathnameWithoutLocale: string;
};

function normalizePathname(pathname: string) {
  return pathname.startsWith("/") ? pathname : `/${pathname}`;
}

function splitSegments(pathname: string) {
  return normalizePathname(pathname).split("/").filter(Boolean);
}

export function parseLocalePathname(pathname: string): ParsedLocalePathname {
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
  const placement: LocalePlacement = suffixLocale
    ? "suffix"
    : prefixLocale
      ? "prefix"
      : null;

  const pathnameWithoutLocale = `/${segments.join("/")}`;
  return {
    locale,
    placement,
    pathnameWithoutLocale: pathnameWithoutLocale === "//" ? "/" : pathnameWithoutLocale,
  };
}

export function getLocaleFromPathname(pathname: string): Locale | null {
  return parseLocalePathname(pathname).locale;
}

export function stripLocaleFromPathname(pathname: string): string {
  const stripped = parseLocalePathname(pathname).pathnameWithoutLocale;
  return stripped === "/" ? "/" : stripped.replace(/\/$/, "");
}

export function addLocaleSuffixToPathname(pathname: string, locale: Locale): string {
  const logical = stripLocaleFromPathname(pathname);
  if (logical === "/") return `/${locale}`;
  return `${logical}/${locale}`;
}

export function localizeHref(href: string, locale: Locale): string {
  if (!href.startsWith("/") || href.startsWith("//")) return href;

  const url = new URL(href, "http://local");
  const localizedPathname = addLocaleSuffixToPathname(url.pathname, locale);
  return `${localizedPathname}${url.search}${url.hash}`;
}

export function isPublicPathname(pathname: string): boolean {
  const logical = stripLocaleFromPathname(pathname);
  const first = splitSegments(logical)[0] ?? "";
  return (PUBLIC_ROUTE_SEGMENTS as readonly string[]).includes(first);
}

export function getLoginPathForPathname(pathname: string): string {
  const locale = getLocaleFromPathname(pathname) ?? defaultLocale;
  return addLocaleSuffixToPathname("/login", locale);
}

export function getDashboardPathForLocale(locale: Locale): string {
  return addLocaleSuffixToPathname("/dashboard", locale);
}
