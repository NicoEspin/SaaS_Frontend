"use client";

import axios from "axios";
import {
  Ban,
  ClipboardList,
  Loader2,
  PackagePlus,
  RefreshCw,
  ShieldAlert,
  SquareCheck,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { EmptyState } from "@/components/empty-state/EmptyState";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDialog } from "@/components/products/ConfirmDialog";
import { CreateReceiptDialog } from "@/components/purchase-orders/CreateReceiptDialog";
import { PurchaseOrderStatusBadge } from "@/components/purchase-orders/PurchaseOrderStatusBadge";
import { Link } from "@/i18n/navigation";
import { usePurchaseOrder } from "@/lib/purchase-orders/hooks/use-purchase-order";
import { usePurchaseOrderMutations } from "@/lib/purchase-orders/hooks/use-purchase-order-mutations";
import type {
  PurchaseOrder,
  PurchaseOrderItem,
  PurchaseReceipt,
  PurchaseReceiptItem,
} from "@/lib/purchase-orders/types";
import { getAxiosErrorMessage } from "@/lib/products/utils";
import { cn } from "@/lib/utils";

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

function formatMoney(value: number) {
  if (!Number.isFinite(value)) return String(value);
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function pendingQty(item: PurchaseOrderItem) {
  const ordered = Number.isFinite(item.quantityOrdered) ? item.quantityOrdered : 0;
  const received = Number.isFinite(item.receivedQty) ? item.receivedQty : 0;
  return Math.max(0, ordered - received);
}

function pendingBadgeClassName(qty: number) {
  return qty > 0
    ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800"
    : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800";
}

function findItemById(po: PurchaseOrder, itemId: string) {
  return po.items.find((it) => it.id === itemId) ?? null;
}

function receiptItemLabel(po: PurchaseOrder, it: PurchaseReceiptItem) {
  const line = findItemById(po, it.purchaseOrderItemId);
  const code = line?.productCodeSnapshot ?? null;
  const name = line?.productNameSnapshot ?? null;
  if (code && name) return `${code} - ${name}`;
  if (name) return name;
  if (code) return code;
  return it.purchaseOrderItemId;
}

export function PurchaseOrderDetailClient({ purchaseOrderId }: { purchaseOrderId: string }) {
  const t = useTranslations("PurchaseOrders");
  const tc = useTranslations("Common");

  const { purchaseOrder, loading, error, refresh } = usePurchaseOrder(purchaseOrderId);
  const muts = usePurchaseOrderMutations();

  const [cancelOpen, setCancelOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const labels = useMemo(() => ({ none: tc("labels.none") }), [tc]);

  const headerTitle = useMemo(() => {
    if (!purchaseOrder) return t("detail.titleFallback");
    return t("detail.title", { id: purchaseOrder.id });
  }, [purchaseOrder, t]);

  const canConfirm = purchaseOrder?.status === "DRAFT";

  const pendingTotal = useMemo(() => {
    if (!purchaseOrder) return 0;
    return purchaseOrder.items.reduce((sum, it) => sum + pendingQty(it), 0);
  }, [purchaseOrder]);

  const canCreateReceipt = Boolean(
    purchaseOrder &&
      (purchaseOrder.status === "CONFIRMED" || purchaseOrder.status === "PARTIALLY_RECEIVED") &&
      pendingTotal > 0
  );

  const hasReceipts = Boolean(purchaseOrder?.receipts && purchaseOrder.receipts.length > 0);
  const hasReceivedQty = Boolean(
    purchaseOrder?.items.some((it) => Number.isFinite(it.receivedQty) && it.receivedQty > 0)
  );

  const canCancel = Boolean(
    purchaseOrder &&
      (purchaseOrder.status === "DRAFT" || purchaseOrder.status === "CONFIRMED") &&
      !hasReceipts &&
      !hasReceivedQty
  );

  async function confirmPurchaseOrder() {
    if (!purchaseOrder) return;
    if (confirming || cancelling) return;
    setConfirming(true);
    try {
      await muts.confirmPurchaseOrder(purchaseOrder.id);
      toast.success(t("success.confirmed"));
      await refresh();
    } catch (err) {
      const status = axios.isAxiosError(err) ? (err.response?.status ?? null) : null;
      if (status === 409) {
        toast.error(getAxiosErrorMessage(err) ?? t("errors.conflict"));
        return;
      }
      toast.error(getAxiosErrorMessage(err) ?? tc("errors.generic"));
    } finally {
      setConfirming(false);
    }
  }

  async function cancelPurchaseOrder() {
    if (!purchaseOrder) return;
    if (confirming || cancelling) return;
    setCancelling(true);
    try {
      await muts.cancelPurchaseOrder(purchaseOrder.id);
      toast.success(t("success.cancelled"));
      setCancelOpen(false);
      await refresh();
    } catch (err) {
      const status = axios.isAxiosError(err) ? (err.response?.status ?? null) : null;
      if (status === 409 || status === 400) {
        toast.error(getAxiosErrorMessage(err) ?? t("errors.cannotCancel"));
        return;
      }
      toast.error(getAxiosErrorMessage(err) ?? tc("errors.generic"));
    } finally {
      setCancelling(false);
    }
  }

  const pending = confirming || cancelling || Boolean(muts.submitting);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{headerTitle}</h1>
            {purchaseOrder ? <PurchaseOrderStatusBadge status={purchaseOrder.status} /> : null}
          </div>
          <p className="text-sm text-muted-foreground">{t("detail.subtitle")}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/purchase-orders">{t("actions.backToList")}</Link>
          </Button>

          <Button type="button" variant="outline" onClick={() => void refresh()} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {loading ? tc("actions.loading") : tc("actions.refresh")}
          </Button>

          {canCreateReceipt ? (
            <Button type="button" onClick={() => setReceiptOpen(true)} disabled={pending}>
              <PackagePlus className="h-4 w-4" />
              {t("actions.createReceipt")}
            </Button>
          ) : canConfirm ? (
            <Button type="button" onClick={() => void confirmPurchaseOrder()} disabled={pending}>
              <SquareCheck className="h-4 w-4" />
              {confirming ? t("actions.confirming") : t("actions.confirm")}
            </Button>
          ) : null}

          {canCancel ? (
            <Button type="button" variant="destructive" onClick={() => setCancelOpen(true)} disabled={pending}>
              <Ban className="h-4 w-4" />
              {cancelling ? t("actions.cancelling") : t("actions.cancel")}
            </Button>
          ) : null}
        </div>
      </div>

      {error ? (
        <Alert variant="destructive" className="border-destructive/30 bg-destructive/10">
          <AlertDescription className="flex items-start gap-2">
            <ShieldAlert className="mt-0.5 h-4 w-4" />
            <span>{error}</span>
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t("detail.sections.overview")}</CardTitle>
          <ClipboardList className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        </CardHeader>
        <CardContent>
          {loading && !purchaseOrder ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : purchaseOrder ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-1 rounded-md border border-border p-4">
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("detail.fields.supplier")}</div>
                <div className={cn("text-sm font-medium", !purchaseOrder.supplier && !purchaseOrder.supplierId && "text-muted-foreground")}>
                  {purchaseOrder.supplier?.name ?? purchaseOrder.supplierId ?? labels.none}
                </div>
                <div className="text-xs text-muted-foreground font-mono">{purchaseOrder.supplierId ?? labels.none}</div>
              </div>

              <div className="space-y-1 rounded-md border border-border p-4">
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("detail.fields.branch")}</div>
                <div className={cn("text-sm font-medium", !purchaseOrder.branch && !purchaseOrder.branchId && "text-muted-foreground")}>
                  {purchaseOrder.branch?.name ?? purchaseOrder.branchId ?? labels.none}
                </div>
                <div className="text-xs text-muted-foreground font-mono">{purchaseOrder.branchId ?? labels.none}</div>
              </div>

              <div className="space-y-1 rounded-md border border-border p-4">
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("detail.fields.expectedAt")}</div>
                <div className={cn("text-sm font-medium", !purchaseOrder.expectedAt && "text-muted-foreground")}>
                  {purchaseOrder.expectedAt ? formatDateTime(purchaseOrder.expectedAt) : labels.none}
                </div>
                <div className="text-xs text-muted-foreground">{t("detail.fields.updatedAt")}: {formatDateTime(purchaseOrder.updatedAt)}</div>
              </div>
            </div>
          ) : null}

          {purchaseOrder ? (
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-md border border-border p-4">
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("detail.fields.notes")}</div>
                <div className={cn("mt-1 text-sm", !purchaseOrder.notes && "text-muted-foreground")}>
                  {purchaseOrder.notes ?? labels.none}
                </div>
              </div>
              <div className="rounded-md border border-border p-4">
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("detail.fields.createdAt")}</div>
                <div className="mt-1 text-sm font-medium">{formatDateTime(purchaseOrder.createdAt)}</div>
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
          {loading && !purchaseOrder ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : purchaseOrder ? (
            <div className="rounded-md border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>{t("detail.lines.columns.product")}</TableHead>
                    <TableHead className="text-right">{t("detail.lines.columns.quantityOrdered")}</TableHead>
                    <TableHead className="text-right">{t("detail.lines.columns.receivedQty")}</TableHead>
                    <TableHead className="text-right">{t("detail.lines.columns.pendingQty")}</TableHead>
                    <TableHead className="text-right">{t("detail.lines.columns.agreedUnitCost")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchaseOrder.items.length === 0 ? (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={5} className="h-40">
                        <EmptyState title={t("detail.lines.emptyTitle")} description={t("detail.lines.emptyDescription")} />
                      </TableCell>
                    </TableRow>
                  ) : (
                    purchaseOrder.items.map((it) => {
                      const pending = pendingQty(it);
                      const code = it.productCodeSnapshot ?? null;
                      const name = it.productNameSnapshot ?? null;
                      const label = code && name ? `${code} - ${name}` : name ?? code ?? it.productId ?? it.id;

                      return (
                        <TableRow key={it.id} className="hover:bg-muted/50 transition-colors">
                          <TableCell>
                            <div className="min-w-0">
                              <div className="truncate text-sm font-medium">{label}</div>
                              <div className="truncate font-mono text-xs text-muted-foreground">{it.id}</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right tabular-nums">{it.quantityOrdered}</TableCell>
                          <TableCell className="text-right tabular-nums">{it.receivedQty}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant="outline" className={cn("tabular-nums", pendingBadgeClassName(pending))}>
                              {pending}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right tabular-nums">{formatMoney(it.agreedUnitCost)}</TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <ReceiptsSection purchaseOrder={purchaseOrder} loading={loading} />

      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title={t("cancel.title")}
        description={t("cancel.description")}
        confirmLabel={t("cancel.confirm")}
        destructive
        loading={cancelling}
        onConfirm={cancelPurchaseOrder}
      />

      {receiptOpen && purchaseOrder ? (
        <CreateReceiptDialog
          open
          onOpenChange={setReceiptOpen}
          purchaseOrder={purchaseOrder}
          onCreated={async () => {
            await refresh();
          }}
        />
      ) : null}
    </section>
  );
}

function ReceiptsSection({ purchaseOrder, loading }: { purchaseOrder: PurchaseOrder | null; loading: boolean }) {
  const t = useTranslations("PurchaseOrders");
  const tc = useTranslations("Common");

  const receipts = purchaseOrder?.receipts ?? [];

  const labels = useMemo(() => ({ none: tc("labels.none") }), [tc]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t("detail.sections.receipts")}</CardTitle>
        {purchaseOrder ? (
          <div className="text-xs text-muted-foreground tabular-nums">
            {t("detail.receipts.count", { count: receipts.length })}
          </div>
        ) : null}
      </CardHeader>
      <CardContent>
        {loading && !purchaseOrder ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : purchaseOrder ? (
          receipts.length === 0 ? (
            <EmptyState
              title={t("detail.receipts.emptyTitle")}
              description={t("detail.receipts.emptyDescription")}
            />
          ) : (
            <Accordion type="multiple" className="w-full">
              {receipts.map((r) => (
                <ReceiptAccordionItem key={r.id} purchaseOrder={purchaseOrder} receipt={r} noneLabel={labels.none} />
              ))}
            </Accordion>
          )
        ) : null}
      </CardContent>
    </Card>
  );
}

function ReceiptAccordionItem({
  purchaseOrder,
  receipt,
  noneLabel,
}: {
  purchaseOrder: PurchaseOrder;
  receipt: PurchaseReceipt;
  noneLabel: string;
}) {
  const t = useTranslations("PurchaseOrders");

  const receivedAtLabel = receipt.receivedAt ? formatDateTime(receipt.receivedAt) : noneLabel;
  const payableIdLabel = receipt.payableId ?? noneLabel;
  const notesLabel = receipt.notes ?? noneLabel;

  const totalLines = receipt.items.length;
  const totalQty = receipt.items.reduce((sum, it) => sum + (Number.isFinite(it.quantityReceived) ? it.quantityReceived : 0), 0);

  return (
    <AccordionItem value={receipt.id} className="border-b">
      <AccordionTrigger>
        <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-2 pr-2 text-left">
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">{t("detail.receipts.receiptTitle", { id: receipt.id })}</div>
            <div className="truncate text-xs text-muted-foreground">{receivedAtLabel}</div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="tabular-nums">{t("detail.receipts.lines", { count: totalLines })}</Badge>
            <Badge variant="secondary" className="tabular-nums">{t("detail.receipts.totalQty", { qty: totalQty })}</Badge>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-md border border-border p-3">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("detail.receipts.fields.receivedAt")}</div>
              <div className="mt-1 text-sm font-medium">{receivedAtLabel}</div>
            </div>
            <div className="rounded-md border border-border p-3">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("detail.receipts.fields.payableId")}</div>
              <div className="mt-1 font-mono text-xs text-muted-foreground break-all">{payableIdLabel}</div>
            </div>
            <div className="rounded-md border border-border p-3">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("detail.receipts.fields.notes")}</div>
              <div className={cn("mt-1 text-sm", notesLabel === noneLabel && "text-muted-foreground")}>{notesLabel}</div>
            </div>
          </div>

          <div className="rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>{t("detail.receipts.columns.item")}</TableHead>
                  <TableHead className="text-right">{t("detail.receipts.columns.quantityReceived")}</TableHead>
                  <TableHead className="text-right">{t("detail.receipts.columns.actualUnitCost")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receipt.items.map((it) => (
                  <TableRow key={it.id ?? `${receipt.id}:${it.purchaseOrderItemId}`} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="text-sm font-medium">{receiptItemLabel(purchaseOrder, it)}</TableCell>
                    <TableCell className="text-right tabular-nums">{it.quantityReceived}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatMoney(it.actualUnitCost)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
