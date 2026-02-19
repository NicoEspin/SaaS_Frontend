"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
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
import { isValidEmail, isValidPassword } from "@/lib/validators";
import { isAxiosError, useAuthStore } from "@/stores/auth-store";

type FieldErrors = Partial<Record<"tenantSlug" | "email" | "password", string>>;

export default function LoginClient() {
  const t = useTranslations("Auth");
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useAuthStore((s) => s.login);

  const [tenantSlug, setTenantSlug] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [formError, setFormError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});

  const next = useMemo(() => {
    const raw = searchParams.get("next");
    if (!raw) return null;
    return raw.startsWith("/") ? raw : null;
  }, [searchParams]);

  // If user is already authenticated, middleware redirects away from this page.

  const showExpired = useMemo(
    () => searchParams.get("reason") === "expired",
    [searchParams]
  );

  function validate() {
    const nextErrors: FieldErrors = {};
    if (!tenantSlug.trim()) nextErrors.tenantSlug = t("login.validation.tenantRequired");
    if (!isValidEmail(email)) nextErrors.email = t("common.validation.invalidEmail");
    if (!isValidPassword(password))
      nextErrors.password = t("common.validation.passwordMin", { min: 8 });
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      await login({
        tenantSlug: tenantSlug.trim(),
        email: email.trim(),
        password,
      });
      router.replace(next ?? "/");
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 401) {
        setFormError(t("login.errors.invalidCredentials"));
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
        <CardTitle>{t("login.title")}</CardTitle>
        <CardDescription>{t("login.subtitle")}</CardDescription>
      </CardHeader>

      <CardContent>
        {showExpired ? (
          <div
            className="mb-4 rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-foreground"
            role="status"
          >
            {t("login.errors.sessionExpired")}
          </div>
        ) : null}

        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="tenantSlug">{t("fields.tenantSlug")}</Label>
            <Input
              id="tenantSlug"
              name="tenantSlug"
              autoComplete="organization"
              value={tenantSlug}
              onChange={(e) => setTenantSlug(e.target.value)}
              aria-invalid={Boolean(errors.tenantSlug)}
            />
            {errors.tenantSlug ? (
              <p className="text-sm text-destructive" role="alert">
                {errors.tenantSlug}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t("fields.email")}</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={Boolean(errors.email)}
            />
            {errors.email ? (
              <p className="text-sm text-destructive" role="alert">
                {errors.email}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{t("fields.password")}</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={Boolean(errors.password)}
            />
            {errors.password ? (
              <p className="text-sm text-destructive" role="alert">
                {errors.password}
              </p>
            ) : null}
          </div>

          {formError ? (
            <div
              className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              role="alert"
            >
              {formError}
            </div>
          ) : null}

          <Button className="w-full" type="submit" disabled={submitting}>
            {submitting ? t("common.actions.loading") : t("login.actions.submit")}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          {t("login.actions.noAccount")} {" "}
          <Link
            className="text-primary underline-offset-4 hover:underline"
            href="/register"
          >
            {t("login.actions.goRegister")}
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
