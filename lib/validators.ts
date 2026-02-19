export function isValidEmail(value: string) {
  // Simple, pragmatic email check.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function isValidPassword(value: string) {
  return value.trim().length >= 8;
}

export function normalizeTenantSlug(value: string) {
  return value.trim().toLowerCase();
}

export function isValidTenantSlug(value: string) {
  return /^[a-z0-9-]+$/.test(normalizeTenantSlug(value));
}
