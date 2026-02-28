"use client";

import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function statusBadgeClassName(isActive: boolean) {
  return isActive
    ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800"
    : "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-900/40 dark:text-zinc-300 dark:border-zinc-700";
}

export function SupplierStatusBadge({ isActive }: { isActive: boolean }) {
  const tc = useTranslations("Common");
  return (
    <Badge variant="outline" className={cn("font-medium", statusBadgeClassName(isActive))}>
      {isActive ? tc("labels.active") : tc("labels.inactive")}
    </Badge>
  );
}
