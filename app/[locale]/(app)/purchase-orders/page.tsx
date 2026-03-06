import { getTranslations } from "next-intl/server";

import { PurchaseOrdersClient } from "@/components/purchase-orders/PurchaseOrdersClient";

type Props = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function PurchaseOrdersPage({ searchParams }: Props) {
  const t = await getTranslations("Pages");

  const supplierId = typeof searchParams?.supplierId === "string" ? searchParams.supplierId : null;

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">{t("purchaseOrdersTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("purchaseOrdersSubtitle")}</p>
      </div>

      <PurchaseOrdersClient initialSupplierId={supplierId} />
    </section>
  );
}
