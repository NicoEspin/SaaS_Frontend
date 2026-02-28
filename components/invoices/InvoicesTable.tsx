"use client";

import { FileText, MoreHorizontal, ReceiptText } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import axios from "axios";

import { EmptyState } from "@/components/empty-state/EmptyState";
import { IssueInvoiceDialog } from "@/components/invoices/IssueInvoiceDialog";
import { InvoiceStatusBadge } from "@/components/invoices/InvoiceStatusBadge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { invoicesApi } from "@/lib/invoices/api";
import type { InvoiceListItem } from "@/lib/invoices/types";
import { cn } from "@/lib/utils";
import { getAxiosErrorMessage } from "@/lib/products/utils";
import { useRouter } from "@/i18n/navigation";

function formatDateTime(value: string) {
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

function formatMoney(value: string) {
  const n = Number(value);
  if (!Number.isFinite(n)) return value;
  return new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

type Props = {
  branchId: string | null;
  items: InvoiceListItem[];
  loading: boolean;
  error: string | null;
  hasFilters?: boolean;
  onClearFilters?: () => void;
  onRefresh?: () => Promise<void> | void;
};

export function InvoicesTable({
  branchId,
  items,
  loading,
  error,
  hasFilters,
  onClearFilters,
  onRefresh,
}: Props) {
  const t = useTranslations("Invoices");
  const tc = useTranslations("Common");
  const router = useRouter();

  const [issueTarget, setIssueTarget] = useState<InvoiceListItem | null>(null);
  const issueTargetId = issueTarget?.id ?? null;

  const labels = useMemo(
    () => ({
      none: tc("labels.none"),
      finalConsumer: t("labels.finalConsumer"),
    }),
    [t, tc]
  );

  async function openPdf(invoiceId: string) {
    if (!branchId) return;
    try {
      const res = await invoicesApi.getPdf(branchId, invoiceId, { variant: "internal" });
      const url = URL.createObjectURL(res.blob);
      const w = window.open(url, "_blank", "noopener,noreferrer");
      if (!w) {
        toast.error(t("errors.popupBlocked"));
      }
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      const status = axios.isAxiosError(err) ? err.response?.status ?? null : null;
      if (status === 501) {
        toast.error(t("errors.notImplemented"));
        return;
      }
      toast.error(getAxiosErrorMessage(err) ?? tc("errors.generic"));
    }
  }

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
                <TableHead>{t("table.columns.number")}</TableHead>
                <TableHead>{t("table.columns.status")}</TableHead>
                <TableHead>{t("table.columns.docType")}</TableHead>
                <TableHead>{t("table.columns.customer")}</TableHead>
                <TableHead className="text-right">{t("table.columns.total")}</TableHead>
                <TableHead>{t("table.columns.issuedAt")}</TableHead>
                <TableHead>{t("table.columns.createdAt")}</TableHead>
                <TableHead className="w-[72px] text-right">{tc("labels.actions")}</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {items.length === 0 && !loading ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={8} className="h-64">
                    <EmptyState
                      variant={hasFilters ? "noResults" : "empty"}
                      action={
                        hasFilters && onClearFilters
                          ? { label: tc("actions.reset"), onClick: onClearFilters }
                          : undefined
                      }
                    />
                  </TableCell>
                </TableRow>
              ) : null}

              {items.map((inv) => {
                const display = inv.displayNumber ?? labels.none;
                const name = inv.customerNameSnapshot ?? labels.finalConsumer;

                return (
                  <TableRow
                    key={inv.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => router.push(`/invoices/${inv.id}`)}
                  >
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium">{display}</span>
                        <span className="font-mono text-xs text-muted-foreground">{inv.number}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <InvoiceStatusBadge status={inv.status} />
                    </TableCell>
                    <TableCell className="font-medium">{t(`enums.docType.${inv.docType}`)}</TableCell>
                    <TableCell className={cn("text-sm", !inv.customerNameSnapshot && "text-muted-foreground")}>
                      {name}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatMoney(inv.total)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {inv.issuedAt ? <time dateTime={inv.issuedAt}>{formatDateTime(inv.issuedAt)}</time> : labels.none}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <time dateTime={inv.createdAt}>{formatDateTime(inv.createdAt)}</time>
                    </TableCell>

                    <TableCell className="text-right">
                      <DropdownMenu>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon-sm" aria-label={tc("labels.actions")}>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                          </TooltipTrigger>
                          <TooltipContent side="top">{tc("labels.actions")}</TooltipContent>
                        </Tooltip>

                        <DropdownMenuContent align="end" className="w-56" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenuItem onSelect={() => router.push(`/invoices/${inv.id}`)}>
                            <ReceiptText className="h-4 w-4" />
                            {t("actions.view")}
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          {inv.status === "DRAFT" ? (
                            <DropdownMenuItem onSelect={() => setIssueTarget(inv)}>
                              <ReceiptText className="h-4 w-4" />
                              {t("actions.issue")}
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onSelect={() => void openPdf(inv.id)}>
                              <FileText className="h-4 w-4" />
                              {t("actions.openPdf")}
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {issueTarget ? (
          <IssueInvoiceDialog
            open
            onOpenChange={(v) => !v && setIssueTarget(null)}
            branchId={branchId}
            invoiceId={issueTargetId}
            customerId={issueTarget.customerId}
            onIssued={async () => {
              await onRefresh?.();
              if (issueTargetId) router.push(`/invoices/${issueTargetId}`);
            }}
          />
        ) : null}
      </CardContent>
    </Card>
  );
}
