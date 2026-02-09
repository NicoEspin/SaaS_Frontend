import { getTranslations } from "next-intl/server";

export default async function InventoryPage() {
  const t = await getTranslations("Pages");

  return (
    <section className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">
        {t("inventoryTitle")}
      </h1>
      <p className="text-sm text-muted-foreground">{t("inventorySubtitle")}</p>
    </section>
  );
}
