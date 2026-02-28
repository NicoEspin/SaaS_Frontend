"use client";

import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { PurchaseOrderStatus } from "@/lib/purchase-orders/types";

function statusBadgeClassName(status: PurchaseOrderStatus) {
  switch (status) {
    case "DRAFT":
      return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800";
    case "CONFIRMED":
      return "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/30 dark:text-sky-400 dark:border-sky-800";
    case "PARTIALLY_RECEIVED":
      return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800";
    case "COMPLETED":
      return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800";
    case "CANCELLED":
      return "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800";
  }
}

export function PurchaseOrderStatusBadge({ status }: { status: PurchaseOrderStatus }) {
  const t = useTranslations("PurchaseOrders");

  return (
    <Badge variant="outline" className={cn("font-medium", statusBadgeClassName(status))}>
      {t(`enums.status.${status}`)}
    </Badge>
  );
}
