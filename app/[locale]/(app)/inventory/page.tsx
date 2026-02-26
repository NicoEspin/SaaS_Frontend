import { getTranslations } from "next-intl/server";

import { InventoryClient } from "@/components/inventory/InventoryClient";

export default async function InventoryPage() {
  const t = await getTranslations("Pages");

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">{t("inventory.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("inventory.subtitle")}</p>
      </div>

      <InventoryClient />
    </section>
  );
}
