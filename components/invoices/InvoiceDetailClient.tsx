"use client";

import axios from "axios";
import { FileText, Loader2, RefreshCw, ReceiptText } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { ActiveBranchSelect } from "@/components/branches/ActiveBranchSelect";
import { IssueInvoiceDialog } from "@/components/invoices/IssueInvoiceDialog";
import { InvoiceStatusBadge } from "@/components/invoices/InvoiceStatusBadge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
import { invoicesApi } from "@/lib/invoices/api";
import { useInvoice } from "@/lib/invoices/hooks/use-invoice";
import { cn } from "@/lib/utils";
import { getAxiosErrorMessage } from "@/lib/products/utils";
import { useAuthStore } from "@/stores/auth-store";
import { Link } from "@/i18n/navigation";

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
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function formatVatRate(value: string) {
  const n = Number(value);
  if (!Number.isFinite(n)) return value;
  return `${Math.round(n * 100)}%`;
}

type Props = {
  invoiceId: string;
};

export function InvoiceDetailClient({ invoiceId }: Props) {
  const t = useTranslations("Invoices");
  const tc = useTranslations("Common");

  const session = useAuthStore((s) => s.session);
  const sessionLoading = useAuthStore((s) => s.sessionLoading);
  const sessionError = useAuthStore((s) => s.sessionError);
  const hydrateSession = useAuthStore((s) => s.hydrateSession);

  useEffect(() => {
    if (session || sessionLoading) return;
    void hydrateSession();
  }, [hydrateSession, session, sessionLoading]);

  const branches = useMemo(() => session?.branches ?? [], [session?.branches]);
  const activeBranch = useMemo(
    () => session?.activeBranch ?? branches[0] ?? null,
    [branches, session?.activeBranch]
  );

  const { invoice, loading, error, refresh } = useInvoice(activeBranch?.id ?? null, invoiceId);

  const [issueOpen, setIssueOpen] = useState(false);

  const headerTitle = useMemo(() => {
    const fallback = t("detail.titleFallback");
    if (!invoice) return fallback;
    const num = invoice.displayNumber ?? invoice.number;
    return t("detail.title", { number: num });
  }, [invoice, t]);

  async function openPdf() {
    if (!activeBranch) return;
    try {
      const res = await invoicesApi.getPdf(activeBranch.id, invoiceId, { variant: "internal" });
      const url = URL.createObjectURL(res.blob);
      const w = window.open(url, "_blank", "noopener,noreferrer");
      if (!w) toast.error(t("errors.popupBlocked"));
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

  const labels = useMemo(
    () => ({
      none: tc("labels.none"),
      finalConsumer: t("labels.finalConsumer"),
    }),
    [t, tc]
  );

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{headerTitle}</h1>
          <p className="text-sm text-muted-foreground">{t("detail.subtitle")}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/invoices">{t("actions.backToList")}</Link>
          </Button>

          <Button variant="outline" onClick={() => void refresh()} disabled={!activeBranch || loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {loading ? tc("actions.loading") : tc("actions.refresh")}
          </Button>

          {invoice?.status === "DRAFT" ? (
            <Button onClick={() => setIssueOpen(true)} disabled={!activeBranch || loading}>
              <ReceiptText className="h-4 w-4" />
              {t("actions.issue")}
            </Button>
          ) : (
            <Button onClick={() => void openPdf()} disabled={!activeBranch || loading}>
              <FileText className="h-4 w-4" />
              {t("actions.openPdf")}
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-background/60 p-4 backdrop-blur md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div className="text-sm font-medium text-foreground">{t("activeBranchLabel")}</div>
          {sessionLoading ? (
            <Skeleton className="h-7 w-[340px] max-w-full" />
          ) : (
            <div className="max-w-full md:w-[340px]">
              <ActiveBranchSelect />
            </div>
          )}
        </div>
      </div>

      {sessionError ? (
        <Alert variant="destructive" className="border-destructive/30 bg-destructive/10">
          <AlertDescription>{tc("errors.generic")}</AlertDescription>
        </Alert>
      ) : null}

      {error ? (
        <Alert variant="destructive" className="border-destructive/30 bg-destructive/10">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t("detail.sections.overview")}</CardTitle>
          {invoice ? <InvoiceStatusBadge status={invoice.status} /> : null}
        </CardHeader>
        <CardContent>
          {loading && !invoice ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : invoice ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-1 rounded-md border border-border p-4">
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t("detail.fields.displayNumber")}
                </div>
                <div className="text-sm font-medium">{invoice.displayNumber ?? labels.none}</div>
                <div className="font-mono text-xs text-muted-foreground">{invoice.number}</div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">
                    {t("detail.fields.docType")}: {t(`enums.docType.${invoice.docType}`)}
                  </Badge>
                  <Badge variant="secondary">
                    {t("detail.fields.mode")}: {t(`enums.mode.${invoice.mode}`)}
                  </Badge>
                </div>
              </div>
              <div className="space-y-1 rounded-md border border-border p-4">
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t("detail.fields.customer")}
                </div>
                <div className={cn("text-sm font-medium", !invoice.customerNameSnapshot && "text-muted-foreground")}>
                  {invoice.customerNameSnapshot ?? labels.finalConsumer}
                </div>
                <div className="text-xs text-muted-foreground">{invoice.customerTaxIdSnapshot ?? labels.none}</div>
              </div>
              <div className="space-y-1 rounded-md border border-border p-4">
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t("detail.fields.issuedAt")}
                </div>
                <div className="text-sm font-medium">
                  {invoice.issuedAt ? formatDateTime(invoice.issuedAt) : labels.none}
                </div>
                <div className="text-xs text-muted-foreground">
                  {t("detail.fields.createdAt")}: {formatDateTime(invoice.createdAt)}
                </div>
              </div>
            </div>
          ) : null}

          {invoice ? (
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
              <div className="rounded-md border border-border p-4">
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t("detail.fields.subtotal")}
                </div>
                <div className="mt-0.5 text-sm font-medium tabular-nums">{formatMoney(invoice.subtotal)}</div>
              </div>
              <div className="rounded-md border border-border p-4">
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t("detail.fields.netSubtotal")}
                </div>
                <div className="mt-0.5 text-sm font-medium tabular-nums">{formatMoney(invoice.netSubtotal)}</div>
              </div>
              <div className="rounded-md border border-border p-4">
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t("detail.fields.taxTotal")}
                </div>
                <div className="mt-0.5 text-sm font-medium tabular-nums">{formatMoney(invoice.taxTotal)}</div>
              </div>
              <div className="rounded-md border border-border p-4">
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t("detail.fields.total")}
                </div>
                <div className="mt-0.5 text-sm font-medium tabular-nums">{formatMoney(invoice.total)}</div>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("detail.sections.lines")}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && !invoice ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : invoice ? (
            <div className="rounded-md border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>{t("detail.lines.columns.product")}</TableHead>
                    <TableHead>{t("detail.lines.columns.description")}</TableHead>
                    <TableHead className="text-right">{t("detail.lines.columns.quantity")}</TableHead>
                    <TableHead className="text-right">{t("detail.lines.columns.unitPrice")}</TableHead>
                    <TableHead className="text-right">{t("detail.lines.columns.vatRate")}</TableHead>
                    <TableHead className="text-right">{t("detail.lines.columns.netLineTotal")}</TableHead>
                    <TableHead className="text-right">{t("detail.lines.columns.vatAmount")}</TableHead>
                    <TableHead className="text-right">{t("detail.lines.columns.lineTotal")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.lines.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-32 text-center text-sm text-muted-foreground">
                        {t("detail.lines.empty")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    invoice.lines.map((ln) => (
                      <TableRow key={ln.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell className={cn("font-mono text-xs", !ln.productCodeSnapshot && "text-muted-foreground")}>
                          {ln.productCodeSnapshot ?? labels.none}
                        </TableCell>
                        <TableCell className="font-medium">{ln.description}</TableCell>
                        <TableCell className="text-right tabular-nums">{ln.quantity}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatMoney(ln.unitPrice)}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatVatRate(ln.vatRate)}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatMoney(ln.netLineTotal)}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatMoney(ln.vatAmount)}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatMoney(ln.lineTotal)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {issueOpen && invoice ? (
        <IssueInvoiceDialog
          open
          onOpenChange={setIssueOpen}
          branchId={activeBranch?.id ?? null}
          invoiceId={invoice.id}
          customerId={invoice.customerId}
          onIssued={async () => {
            await refresh();
          }}
        />
      ) : null}
    </section>
  );
}
