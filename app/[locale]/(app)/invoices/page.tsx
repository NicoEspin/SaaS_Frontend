import { getTranslations } from "next-intl/server";

import { InvoicesClient } from "@/components/invoices/InvoicesClient";

export default async function InvoicesPage() {
  const t = await getTranslations("Pages");

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">{t("invoicesTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("invoicesSubtitle")}</p>
      </div>

      <InvoicesClient />
    </section>
  );
}
