import { getTranslations } from "next-intl/server";

export default async function ProductsPage() {
  const t = await getTranslations("Pages");

  return (
    <section className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">
        {t("productsTitle")}
      </h1>
      <p className="text-sm text-muted-foreground">{t("productsSubtitle")}</p>
    </section>
  );
}
