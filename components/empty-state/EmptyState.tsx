"use client";

import type { ComponentType } from "react";

import { PackageOpen, SearchX } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type IconType = ComponentType<{ className?: string }>;

type Props = {
  variant?: "empty" | "noResults";
  title?: string;
  description?: string;
  icon?: IconType;
  action?: {
    label: string;
    onClick: () => void;
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  };
  className?: string;
};

export function EmptyState({
  variant = "empty",
  title,
  description,
  icon,
  action,
  className,
}: Props) {
  const t = useTranslations("EmptyState");

  const Icon = icon ?? (variant === "noResults" ? SearchX : PackageOpen);

  const resolvedTitle =
    title ?? (variant === "noResults" ? t("noResults.title") : t("noRecords.title"));
  const resolvedDescription =
    description ??
    (variant === "noResults" ? t("noResults.description") : t("noRecords.description"));

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-14 text-center",
        className
      )}
    >
      <div
        className={cn(
          "mb-4 grid place-items-center rounded-full border border-dashed border-border bg-muted/10 p-6",
          "motion-safe:animate-pulse"
        )}
        aria-hidden="true"
      >
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>

      <h3 className="text-sm font-semibold text-foreground">{resolvedTitle}</h3>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">{resolvedDescription}</p>

      {action ? (
        <Button size="sm" variant={action.variant ?? "default"} className="mt-6" onClick={action.onClick}>
          {action.label}
        </Button>
      ) : null}
    </div>
  );
}
