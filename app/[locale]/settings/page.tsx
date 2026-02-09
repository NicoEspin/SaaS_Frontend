import { getTranslations } from "next-intl/server";

export default async function SettingsPage() {
  const t = await getTranslations("Pages");

  return (
    <section className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">
        {t("settingsTitle")}
      </h1>
      <p className="text-sm text-muted-foreground">{t("settingsSubtitle")}</p>
    </section>
  );
}
