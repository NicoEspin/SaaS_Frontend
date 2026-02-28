import { getTranslations } from "next-intl/server";

import { ClientsClient } from "@/components/clients/ClientsClient";

export default async function ClientsPage() {
  const t = await getTranslations("Pages");

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">{t("clientsTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("clientsSubtitle")}</p>
      </div>

      <ClientsClient />
    </section>
  );
}
