"use client";

import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { InvoiceStatus } from "@/lib/invoices/types";

function statusBadgeClassName(status: InvoiceStatus) {
  switch (status) {
    case "ISSUED":
      return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800";
    case "DRAFT":
      return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800";
  }
}

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const t = useTranslations("Invoices");

  return (
    <Badge
      variant="outline"
      className={cn("font-medium", statusBadgeClassName(status))}
    >
      {t(`enums.status.${status}`)}
    </Badge>
  );
}
