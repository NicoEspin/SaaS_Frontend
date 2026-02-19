import { getTranslations } from "next-intl/server";

export default async function ReportsPage() {
  const t = await getTranslations("Pages");

  return (
    <section className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">
        {t("reportsTitle")}
      </h1>
      <p className="text-sm text-muted-foreground">{t("reportsSubtitle")}</p>
    </section>
  );
}
