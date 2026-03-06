"use client";

import { ExternalLink, MoreHorizontal, Pencil } from "lucide-react";
import { useMemo } from "react";
import { useTranslations } from "next-intl";

import { EmptyState } from "@/components/empty-state/EmptyState";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { PurchaseOrderStatusBadge } from "@/components/purchase-orders/PurchaseOrderStatusBadge";
import { Link } from "@/i18n/navigation";
import { purchaseOrderStatusSchema, type PurchaseOrderStatus } from "@/lib/purchase-orders/types";
import type { SupplierWithActivePurchaseOrders } from "@/lib/suppliers/types";
import { cn } from "@/lib/utils";
import { SupplierStatusBadge } from "@/components/suppliers/SupplierStatusBadge";

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
  items: SupplierWithActivePurchaseOrders[];
  loading: boolean;
  error: string | null;
  onEdit: (supplier: SupplierWithActivePurchaseOrders) => void;
  hasFilters?: boolean;
  onClearFilters?: () => void;
  onCreate?: () => void;
};

export function SuppliersTable({
  items,
  loading,
  error,
  onEdit,
  hasFilters,
  onClearFilters,
  onCreate,
}: Props) {
  const t = useTranslations("Suppliers");
  const tc = useTranslations("Common");
  const tpo = useTranslations("PurchaseOrders");

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
                <TableHead>{t("fields.name")}</TableHead>
                <TableHead>{t("fields.email")}</TableHead>
                <TableHead>{t("fields.phone")}</TableHead>
                <TableHead>{t("fields.paymentTerms")}</TableHead>
                <TableHead>{t("fields.isActive")}</TableHead>
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
                          : onCreate
                            ? { label: t("actions.new"), onClick: onCreate }
                            : undefined
                      }
                    />
                  </TableCell>
                </TableRow>
              ) : null}

              {items.map((s) => (
                <TableRow key={s.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="align-top">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{s.name}</span>
                        {s.hasActivePurchaseOrders ? (
                          <Badge
                            variant="outline"
                            className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800"
                          >
                            {t("activePurchaseOrders.badge", { count: s.activePurchaseOrders.length })}
                          </Badge>
                        ) : null}
                      </div>

                      {s.hasActivePurchaseOrders ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                asChild
                                variant="outline"
                                size="xs"
                                aria-label={t("activePurchaseOrders.viewAllAria", { name: s.name })}
                              >
                                <Link href={`/purchase-orders?supplierId=${encodeURIComponent(s.id)}`}>
                                  <ExternalLink className="h-3 w-3" />
                                  {t("activePurchaseOrders.viewAll")}
                                </Link>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top">{t("activePurchaseOrders.viewAll")}</TooltipContent>
                          </Tooltip>

                          <div className="flex flex-wrap items-center gap-2">
                            {s.activePurchaseOrders.map((po) => {
                              const known = purchaseOrderStatusSchema.safeParse(po.status).success;
                              const statusBadge = known ? (
                                <PurchaseOrderStatusBadge status={po.status as PurchaseOrderStatus} />
                              ) : (
                                <Badge variant="outline" className="font-medium">
                                  {po.status}
                                </Badge>
                              );

                              return (
                                <div key={po.id} className="flex flex-wrap items-center gap-1">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        asChild
                                        variant="outline"
                                        size="xs"
                                        className="font-mono"
                                        aria-label={t("activePurchaseOrders.openOrderAria", { number: po.number })}
                                      >
                                        <Link href={`/purchase-orders/${po.id}`}>{po.number}</Link>
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top">{tpo("actions.open")}</TooltipContent>
                                  </Tooltip>

                                  {statusBadge}
                                  <span className="text-xs text-muted-foreground">{po.branch.name}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className={cn("text-sm", !s.email && "text-muted-foreground")}>
                    {s.email ?? labels.none}
                  </TableCell>
                  <TableCell className={cn("text-sm", !s.phone && "text-muted-foreground")}>
                    {s.phone ?? labels.none}
                  </TableCell>
                  <TableCell className={cn("text-sm", !s.paymentTerms && "text-muted-foreground")}>
                    {s.paymentTerms || labels.none}
                  </TableCell>
                  <TableCell>
                    <SupplierStatusBadge isActive={s.isActive} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    <time dateTime={s.updatedAt}>{formatDate(s.updatedAt)}</time>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm" aria-label={tc("labels.actions")}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                        </TooltipTrigger>
                        <TooltipContent side="top">{tc("labels.actions")}</TooltipContent>
                      </Tooltip>
                      <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuItem onSelect={() => onEdit(s)}>
                          <Pencil className="h-4 w-4" />
                          {tc("actions.edit")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
