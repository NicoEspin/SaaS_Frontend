import "server-only";

export function getBackendBaseUrl() {
  const raw =
    process.env.API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    process.env.BACKEND_BASE_URL ??
    "";

  const base = raw.trim().replace(/\/$/, "");
  return base;
}

export function buildBackendUrl(pathname: string, search: string) {
  const base = getBackendBaseUrl();
  if (!base) return null;

  const cleanPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${base}${cleanPath}${search}`;
}
