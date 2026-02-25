"use client";

import { useState } from "react";
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
import { useOnboardingDraftStore } from "@/stores/onboarding-draft-store";
import { isValidEmail, isValidPassword } from "@/lib/validators";

type FieldErrors = Partial<
  Record<"fullName" | "email" | "password" | "confirmPassword", string>
>;

export default function RegisterPage() {
  const t = useTranslations("Auth");
  const router = useRouter();
  const setDraftAdmin = useOnboardingDraftStore((s) => s.setAdmin);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});

  function validate() {
    const nextErrors: FieldErrors = {};
    if (!fullName.trim())
      nextErrors.fullName = t("register.validation.fullNameRequired");
    if (!isValidEmail(email))
      nextErrors.email = t("common.validation.invalidEmail");
    if (!isValidPassword(password))
      nextErrors.password = t("common.validation.passwordMin", { min: 8 });
    if (confirmPassword !== password)
      nextErrors.confirmPassword = t("register.validation.passwordsMismatch");
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setDraftAdmin({ fullName: fullName.trim(), email: email.trim(), password });
    router.push("/onboarding");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("register.title")}</CardTitle>
        <CardDescription>{t("register.subtitle")}</CardDescription>
      </CardHeader>

      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="fullName">{t("fields.fullName")}</Label>
            <Input
              id="fullName"
              name="fullName"
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              aria-invalid={Boolean(errors.fullName)}
            />
            {errors.fullName ? (
              <p className="text-sm text-destructive" role="alert">
                {errors.fullName}
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
              autoComplete="new-password"
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

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">
              {t("fields.confirmPassword")}
            </Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              aria-invalid={Boolean(errors.confirmPassword)}
            />
            {errors.confirmPassword ? (
              <p className="text-sm text-destructive" role="alert">
                {errors.confirmPassword}
              </p>
            ) : null}
          </div>

          <Button className="w-full" type="submit">
            {t("register.actions.continue")}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          {t("register.actions.haveAccount")}{" "}
          <Link
            className="text-primary underline-offset-4 hover:underline"
            href="/login"
          >
            {t("register.actions.goLogin")}
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
