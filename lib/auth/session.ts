export type AuthSessionTenant = {
  id: string;
  slug: string;
  name: string;
};

export type AuthSessionUser = {
  id: string;
  email: string;
  fullName: string;
};

export type AuthSessionMembership = {
  id: string;
  role: string;
};

export type AuthSessionBranch = {
  id: string;
  name: string;
};

export type AuthSession = {
  tenant: AuthSessionTenant;
  user: AuthSessionUser;
  membership: AuthSessionMembership;
  branches: AuthSessionBranch[];
  activeBranch: AuthSessionBranch | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function toString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const s = value.trim();
  return s ? s : null;
}

function toBranch(value: unknown): AuthSessionBranch | null {
  if (!isRecord(value)) return null;
  const id = toString(value.id);
  const name = toString(value.name);
  if (!id || !name) return null;
  return { id, name };
}

export function parseAuthSession(value: unknown): AuthSession | null {
  if (!isRecord(value)) return null;

  const rawTenant = value.tenant;
  const rawUser = value.user;
  const rawMembership = value.membership;

  if (!isRecord(rawTenant) || !isRecord(rawUser) || !isRecord(rawMembership)) return null;

  const tenantId = toString(rawTenant.id);
  const tenantSlug = toString(rawTenant.slug);
  const tenantName = toString(rawTenant.name);

  const userId = toString(rawUser.id);
  const userEmail = toString(rawUser.email);
  const userFullName = toString(rawUser.fullName);

  const membershipId = toString(rawMembership.id);
  const membershipRole = toString(rawMembership.role);

  if (!tenantId || !tenantSlug || !tenantName) return null;
  if (!userId || !userEmail || !userFullName) return null;
  if (!membershipId || !membershipRole) return null;

  const branches: AuthSessionBranch[] = [];
  const rawBranches = value.branches;
  if (Array.isArray(rawBranches)) {
    const seen = new Set<string>();
    for (const raw of rawBranches) {
      const b = toBranch(raw);
      if (!b) continue;
      if (seen.has(b.id)) continue;
      seen.add(b.id);
      branches.push(b);
    }
  }

  const rawActive = value.activeBranch;
  const activeBranch = rawActive === null ? null : toBranch(rawActive);

  return {
    tenant: { id: tenantId, slug: tenantSlug, name: tenantName },
    user: { id: userId, email: userEmail, fullName: userFullName },
    membership: { id: membershipId, role: membershipRole },
    branches,
    activeBranch,
  };
}
