import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { BranchesClient } from "@/components/branches/BranchesClient";
import { getServerAuthSession } from "@/lib/auth/session-server";

function canManageBranches(role: string) {
  return role === "ADMIN" || role === "OWNER";
}

export default async function BranchesPage() {
  const t = await getTranslations("Pages");
  const session = await getServerAuthSession();

  const role = session?.membership.role ?? null;
  if (!role || !canManageBranches(role)) notFound();

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">{t("branchesTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("branchesSubtitle")}</p>
      </div>

      <BranchesClient />
    </section>
  );
}
