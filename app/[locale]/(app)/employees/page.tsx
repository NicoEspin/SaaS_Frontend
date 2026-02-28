import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { EmployeesClient } from "@/components/employees/EmployeesClient";
import { getServerAuthSession } from "@/lib/auth/session-server";

function canManageEmployees(role: string) {
  return role === "ADMIN" || role === "OWNER";
}

export default async function EmployeesPage() {
  const t = await getTranslations("Pages");
  const session = await getServerAuthSession();

  const role = session?.membership.role ?? null;
  if (!role || !canManageEmployees(role)) notFound();

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">{t("employeesTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("employeesSubtitle")}</p>
      </div>

      <EmployeesClient />
    </section>
  );
}
