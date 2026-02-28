import { getTranslations } from "next-intl/server";

import { SuppliersClient } from "@/components/suppliers/SuppliersClient";

export default async function SuppliersPage() {
  const t = await getTranslations("Pages");

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">{t("suppliersTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("suppliersSubtitle")}</p>
      </div>

      <SuppliersClient />
    </section>
  );
}
