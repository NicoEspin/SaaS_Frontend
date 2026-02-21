import { getTranslations } from "next-intl/server";

import { ProductsClient } from "@/components/products/ProductsClient";

export default async function ProductsPage() {
  const t = await getTranslations("Pages");

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("productsTitle")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("productsSubtitle")}</p>
      </div>

      <ProductsClient />
    </section>
  );
}
