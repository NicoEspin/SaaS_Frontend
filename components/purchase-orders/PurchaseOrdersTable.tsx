"use client";

import { ExternalLink } from "lucide-react";
import { useMemo } from "react";
import { useTranslations } from "next-intl";

import { EmptyState } from "@/components/empty-state/EmptyState";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Link } from "@/i18n/navigation";
import type { PurchaseOrdersListItem } from "@/lib/purchase-orders/types";
import { cn } from "@/lib/utils";
import { PurchaseOrderStatusBadge } from "@/components/purchase-orders/PurchaseOrderStatusBadge";

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

type Props = {
  items: PurchaseOrdersListItem[];
  loading: boolean;
  error: string | null;
  hasFilters?: boolean;
  onClearFilters?: () => void;
};

export function PurchaseOrdersTable({ items, loading, error, hasFilters, onClearFilters }: Props) {
  const t = useTranslations("PurchaseOrders");
  const tc = useTranslations("Common");

  const labels = useMemo(() => ({ none: tc("labels.none") }), [tc]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t("table.title")}</CardTitle>
        <div className="text-xs text-muted-foreground">{t("table.count", { count: items.length })}</div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : null}

        {error ? (
          <Alert variant="destructive" className="mb-4 border-destructive/30 bg-destructive/10">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <div className="rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>{t("fields.id")}</TableHead>
                <TableHead>{t("fields.status")}</TableHead>
                <TableHead>{t("fields.supplier")}</TableHead>
                <TableHead>{t("fields.branch")}</TableHead>
                <TableHead>{t("fields.expectedAt")}</TableHead>
                <TableHead>{t("fields.updatedAt")}</TableHead>
                <TableHead className="w-[72px] text-right">{tc("labels.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 && !loading ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={7} className="h-64">
                    <EmptyState
                      variant={hasFilters ? "noResults" : "empty"}
                      action={
                        hasFilters && onClearFilters
                          ? { label: tc("actions.reset"), onClick: onClearFilters, variant: "outline" }
                          : undefined
                      }
                    />
                  </TableCell>
                </TableRow>
              ) : null}

              {items.map((po) => {
                const supplierLabel = po.supplier?.name ?? (po.supplierId ?? labels.none);
                const branchLabel = po.branch?.name ?? (po.branchId ?? labels.none);
                const expected = po.expectedAt ? formatDate(po.expectedAt) : "—";
                const updated = po.updatedAt ? formatDate(po.updatedAt) : "—";

                return (
                  <TableRow key={po.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-mono text-xs">{po.id}</TableCell>
                    <TableCell>
                      <PurchaseOrderStatusBadge status={po.status} />
                    </TableCell>
                    <TableCell className={cn("text-sm", !po.supplier && !po.supplierId && "text-muted-foreground")}>
                      {supplierLabel}
                    </TableCell>
                    <TableCell className={cn("text-sm", !po.branch && !po.branchId && "text-muted-foreground")}>
                      {branchLabel}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground tabular-nums">{expected}</TableCell>
                    <TableCell className="text-sm text-muted-foreground tabular-nums">{updated}</TableCell>
                    <TableCell className="text-right">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button asChild variant="ghost" size="icon-sm" aria-label={t("actions.open")}
                          >
                            <Link href={`/purchase-orders/${po.id}`}>
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">{t("actions.open")}</TooltipContent>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
