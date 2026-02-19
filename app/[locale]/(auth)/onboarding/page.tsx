"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useRouter } from "@/i18n/navigation";
import { normalizeTenantSlug, isValidEmail, isValidPassword, isValidTenantSlug } from "@/lib/validators";
import { useAuthStore, isAxiosError } from "@/stores/auth-store";
import { useOnboardingDraftStore } from "@/stores/onboarding-draft-store";

type FieldErrors = Partial<
  Record<"tenantName" | "tenantSlug" | "adminEmail" | "adminPassword", string>
>;

function getBackendMessage(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  if ("message" in data && typeof (data as { message?: unknown }).message === "string") {
    return (data as { message: string }).message;
  }
  return null;
}

export default function OnboardingPage() {
  const t = useTranslations("Auth");
  const router = useRouter();
  const onboardingInitial = useAuthStore((s) => s.onboardingInitial);

  const draftAdmin = useOnboardingDraftStore((s) => s.admin);
  const clearDraft = useOnboardingDraftStore((s) => s.clear);

  const [tenantName, setTenantName] = useState("");
  const [tenantSlug, setTenantSlug] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!draftAdmin) return;
    setAdminEmail((prev) => prev || draftAdmin.email);
    setAdminPassword((prev) => prev || draftAdmin.password);
  }, [draftAdmin]);

  // If user is already authenticated, middleware redirects away from this page.

  function validate() {
    const nextErrors: FieldErrors = {};
    if (!tenantName.trim()) nextErrors.tenantName = t("onboarding.validation.tenantNameRequired");
    if (!tenantSlug.trim()) {
      nextErrors.tenantSlug = t("onboarding.validation.tenantSlugRequired");
    } else if (!isValidTenantSlug(tenantSlug)) {
      nextErrors.tenantSlug = t("onboarding.validation.tenantSlugInvalid");
    }
    if (!isValidEmail(adminEmail)) nextErrors.adminEmail = t("common.validation.invalidEmail");
    if (!isValidPassword(adminPassword))
      nextErrors.adminPassword = t("common.validation.passwordMin", { min: 8 });
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      await onboardingInitial({
        tenant: { name: tenantName.trim(), slug: normalizeTenantSlug(tenantSlug) },
        admin: { email: adminEmail.trim(), password: adminPassword },
      });
      clearDraft();
      router.replace("/");
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 409) {
        const message = getBackendMessage(err.response.data);
        setFormError(message ?? t("onboarding.errors.conflict"));
      } else {
        setFormError(t("common.errors.generic"));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("onboarding.title")}</CardTitle>
        <CardDescription>{t("onboarding.subtitle")}</CardDescription>
      </CardHeader>

      <CardContent>
        <form className="space-y-5" onSubmit={onSubmit}>
          <div className="space-y-3">
            <div className="text-sm font-semibold tracking-tight">{t("onboarding.sections.tenant")}</div>

            <div className="space-y-2">
              <Label htmlFor="tenantName">{t("fields.tenantName")}</Label>
              <Input
                id="tenantName"
                name="tenantName"
                autoComplete="organization"
                value={tenantName}
                onChange={(e) => setTenantName(e.target.value)}
                aria-invalid={Boolean(errors.tenantName)}
              />
              {errors.tenantName ? (
                <p className="text-sm text-destructive" role="alert">
                  {errors.tenantName}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tenantSlug">{t("fields.tenantSlug")}</Label>
              <Input
                id="tenantSlug"
                name="tenantSlug"
                autoComplete="off"
                value={tenantSlug}
                onChange={(e) => setTenantSlug(e.target.value)}
                aria-invalid={Boolean(errors.tenantSlug)}
              />
              {errors.tenantSlug ? (
                <p className="text-sm text-destructive" role="alert">
                  {errors.tenantSlug}
                </p>
              ) : null}
              <p className="text-xs text-muted-foreground">{t("onboarding.hints.slug")}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-sm font-semibold tracking-tight">{t("onboarding.sections.admin")}</div>

            <div className="space-y-2">
              <Label htmlFor="adminEmail">{t("fields.email")}</Label>
              <Input
                id="adminEmail"
                name="adminEmail"
                type="email"
                autoComplete="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                aria-invalid={Boolean(errors.adminEmail)}
              />
              {errors.adminEmail ? (
                <p className="text-sm text-destructive" role="alert">
                  {errors.adminEmail}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="adminPassword">{t("fields.password")}</Label>
              <Input
                id="adminPassword"
                name="adminPassword"
                type="password"
                autoComplete="new-password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                aria-invalid={Boolean(errors.adminPassword)}
              />
              {errors.adminPassword ? (
                <p className="text-sm text-destructive" role="alert">
                  {errors.adminPassword}
                </p>
              ) : null}
            </div>
          </div>

          {formError ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
              {formError}
            </div>
          ) : null}

          <Button className="w-full" type="submit" disabled={submitting}>
            {submitting ? t("common.actions.loading") : t("onboarding.actions.submit")}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          <Link className="text-primary underline-offset-4 hover:underline" href="/login">
            {t("onboarding.actions.backToLogin")}
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
