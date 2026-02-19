import { isLocale } from "@/i18n/locales";

export const PUBLIC_ROUTE_SEGMENTS = ["login", "register", "onboarding"] as const;

function normalizePathname(pathname: string) {
  return pathname.startsWith("/") ? pathname : `/${pathname}`;
}

export function getLocaleFromPathname(pathname: string): string | null {
  const normalized = normalizePathname(pathname);
  const maybeLocale = normalized.split("/")[1] ?? "";
  return isLocale(maybeLocale) ? maybeLocale : null;
}

export function isPublicPathname(pathname: string): boolean {
  const normalized = normalizePathname(pathname);
  const maybeLocale = normalized.split("/")[1] ?? "";
  if (!isLocale(maybeLocale)) return false;

  const firstSegmentAfterLocale = normalized.split("/")[2] ?? "";
  return (PUBLIC_ROUTE_SEGMENTS as readonly string[]).includes(
    firstSegmentAfterLocale
  );
}

export function getLoginPathForPathname(pathname: string): string {
  const locale = getLocaleFromPathname(pathname);
  return `/${locale ?? "es"}/login`;
}
