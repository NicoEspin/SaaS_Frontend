import { getTranslations } from "next-intl/server";

import { PurchaseOrdersClient } from "@/components/purchase-orders/PurchaseOrdersClient";

export default async function PurchaseOrdersPage() {
  const t = await getTranslations("Pages");

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">{t("purchaseOrdersTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("purchaseOrdersSubtitle")}</p>
      </div>

      <PurchaseOrdersClient />
    </section>
  );
}
