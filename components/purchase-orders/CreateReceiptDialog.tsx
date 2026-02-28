"use client";

import axios from "axios";
import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import type { PurchaseOrder, PurchaseOrderItem } from "@/lib/purchase-orders/types";
import { purchaseReceiptCreateDtoSchema } from "@/lib/purchase-orders/types";
import { usePurchaseOrderMutations } from "@/lib/purchase-orders/hooks/use-purchase-order-mutations";
import { getAxiosErrorMessage } from "@/lib/products/utils";
import { cn } from "@/lib/utils";

type LineDraft = {
  purchaseOrderItemId: string;
  quantityReceived: string;
  actualUnitCost: string;
};

type LineErrors = Partial<{
  quantityReceived: string;
  actualUnitCost: string;
}>;

function pendingQty(item: PurchaseOrderItem) {
  const ordered = Number.isFinite(item.quantityOrdered) ? item.quantityOrdered : 0;
  const received = Number.isFinite(item.receivedQty) ? item.receivedQty : 0;
  return Math.max(0, ordered - received);
}

function coerceNumber(value: string) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return n;
}

function toIsoFromDatetimeLocal(value: string) {
  const s = value.trim();
  if (!s) return null;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function lineLabel(it: PurchaseOrderItem, fallback: string) {
  const code = it.productCodeSnapshot ?? null;
  const name = it.productNameSnapshot ?? null;
  if (code && name) return `${code} - ${name}`;
  if (name) return name;
  if (code) return code;
  return fallback;
}

function pendingBadgeClassName(qty: number) {
  return qty > 0
    ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800"
    : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800";
}

export function CreateReceiptDialog({
  open,
  onOpenChange,
  purchaseOrder,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchaseOrder: PurchaseOrder;
  onCreated: () => Promise<void> | void;
}) {
  const t = useTranslations("PurchaseOrders");
  const tc = useTranslations("Common");

  const muts = usePurchaseOrderMutations();

  const [receivedAtLocal, setReceivedAtLocal] = useState("");
  const [notes, setNotes] = useState("");
  const [payableId, setPayableId] = useState("");
  const [lines, setLines] = useState<LineDraft[]>([]);
  const [errorsByLine, setErrorsByLine] = useState<Record<string, LineErrors>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const orderItems = purchaseOrder.items;

  useEffect(() => {
    if (!open) return;
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const local = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
    setReceivedAtLocal(local);
    setNotes("");
    setPayableId("");
    setLines(
      orderItems.map((it) => ({
        purchaseOrderItemId: it.id,
        quantityReceived: "0",
        actualUnitCost: String(Number.isFinite(it.agreedUnitCost) ? it.agreedUnitCost : 0),
      }))
    );
    setErrorsByLine({});
    setFormError(null);
    setSaving(false);
  }, [open, orderItems]);

  const pending = saving || muts.submitting;

  const pendingByItemId = useMemo(() => {
    const out: Record<string, number> = {};
    for (const it of orderItems) out[it.id] = pendingQty(it);
    return out;
  }, [orderItems]);

  const totalPending = useMemo(() => orderItems.reduce((sum, it) => sum + pendingQty(it), 0), [orderItems]);

  function setLine(id: string, patch: Partial<LineDraft>) {
    setLines((s) => s.map((ln) => (ln.purchaseOrderItemId === id ? { ...ln, ...patch } : ln)));
  }

  function validate() {
    const nextErrors: Record<string, LineErrors> = {};

    for (const ln of lines) {
      const pendingQtyForLine = pendingByItemId[ln.purchaseOrderItemId] ?? 0;
      const qty = coerceNumber(ln.quantityReceived);
      const cost = coerceNumber(ln.actualUnitCost);
      const le: LineErrors = {};

      if (qty === null || qty < 0) le.quantityReceived = t("receipt.validation.qtyInvalid");
      if (qty !== null && qty > pendingQtyForLine) le.quantityReceived = t("receipt.validation.qtyTooHigh", { max: pendingQtyForLine });

      if (cost === null || cost < 0) le.actualUnitCost = t("receipt.validation.costInvalid");

      if (Object.keys(le).length) nextErrors[ln.purchaseOrderItemId] = le;
    }

    setErrorsByLine(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  const selectedItems = useMemo(() => {
    const out: Array<{ id: string; qty: number; cost: number }> = [];
    for (const ln of lines) {
      const qty = coerceNumber(ln.quantityReceived);
      const cost = coerceNumber(ln.actualUnitCost);
      if (qty === null || cost === null) continue;
      if (qty <= 0) continue;
      out.push({ id: ln.purchaseOrderItemId, qty, cost });
    }
    return out;
  }, [lines]);

  const totalReceiving = useMemo(() => selectedItems.reduce((sum, it) => sum + it.qty, 0), [selectedItems]);

  async function submit() {
    setFormError(null);
    if (!validate()) {
      toast.error(t("receipt.errors.fixForm"));
      return;
    }

    if (selectedItems.length === 0) {
      toast.error(t("receipt.errors.noItems"));
      return;
    }

    const receivedAtIso = toIsoFromDatetimeLocal(receivedAtLocal) ?? new Date().toISOString();
    const cleanNotes = notes.trim();
    const cleanPayableId = payableId.trim();

    const dto = {
      receivedAt: receivedAtIso,
      notes: cleanNotes ? cleanNotes : undefined,
      payableId: cleanPayableId ? cleanPayableId : undefined,
      items: selectedItems.map((it) => ({
        purchaseOrderItemId: it.id,
        quantityReceived: it.qty,
        actualUnitCost: it.cost,
      })),
    };

    const parsed = purchaseReceiptCreateDtoSchema.safeParse(dto);
    if (!parsed.success) {
      toast.error(t("receipt.errors.fixForm"));
      return;
    }

    setSaving(true);
    try {
      await muts.createReceipt(purchaseOrder.id, parsed.data);
      toast.success(t("success.receiptCreated"));
      onOpenChange(false);
      await onCreated();
    } catch (err) {
      const status = axios.isAxiosError(err) ? (err.response?.status ?? null) : null;
      if (status === 409 || status === 400) {
        toast.error(getAxiosErrorMessage(err) ?? t("receipt.errors.cannotReceive"));
        return;
      }
      const text = getAxiosErrorMessage(err) ?? tc("errors.generic");
      setFormError(text);
      toast.error(text);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && pending) return;
        onOpenChange(next);
      }}
    >
      <DialogContent className="flex max-h-[90vh] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-5xl">
        <div className="border-b border-border px-4 py-4 pr-12 sm:px-6 sm:py-5">
          <DialogHeader className="gap-1">
            <DialogTitle>{t("receipt.title")}</DialogTitle>
            <DialogDescription>{t("receipt.subtitle")}</DialogDescription>
          </DialogHeader>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          {formError ? (
            <Alert variant="destructive" className="mb-4 border-destructive/30 bg-destructive/10">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          ) : null}

          <div className="space-y-6">
            <Card>
              <CardHeader className="border-b">
                <CardTitle>{t("receipt.sections.headerTitle")}</CardTitle>
                <CardDescription>{t("receipt.sections.headerSubtitle")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="po-receipt-receivedAt">{t("receipt.fields.receivedAt")}</Label>
                    <Input
                      id="po-receipt-receivedAt"
                      type="datetime-local"
                      value={receivedAtLocal}
                      onChange={(e) => setReceivedAtLocal(e.target.value)}
                      disabled={pending}
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="po-receipt-payable">{t("receipt.fields.payableId")}</Label>
                    <Input
                      id="po-receipt-payable"
                      value={payableId}
                      onChange={(e) => setPayableId(e.target.value)}
                      placeholder={t("receipt.placeholders.payableId")}
                      disabled={pending}
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <div className="text-sm font-medium text-foreground">{t("receipt.fields.pendingTotal")}</div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={cn("tabular-nums", pendingBadgeClassName(totalPending))}>
                        {t("receipt.labels.pendingQty", { qty: totalPending })}
                      </Badge>
                      <Badge variant="secondary" className="tabular-nums">
                        {t("receipt.labels.receivingQty", { qty: totalReceiving })}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">{t("receipt.hints.pending")}</div>
                  </div>
                  <div className="md:col-span-6 space-y-2">
                    <Label htmlFor="po-receipt-notes">{t("receipt.fields.notes")}</Label>
                    <Textarea
                      id="po-receipt-notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder={t("receipt.placeholders.notes")}
                      className="min-h-[96px]"
                      disabled={pending}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="border-b">
                <CardTitle>{t("receipt.sections.linesTitle")}</CardTitle>
                <CardDescription>{t("receipt.sections.linesSubtitle")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead>{t("receipt.columns.item")}</TableHead>
                        <TableHead className="text-right">{t("receipt.columns.pendingQty")}</TableHead>
                        <TableHead className="text-right">{t("receipt.columns.quantityReceived")}</TableHead>
                        <TableHead className="text-right">{t("receipt.columns.actualUnitCost")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orderItems.map((it) => {
                        const pendingQtyForLine = pendingByItemId[it.id] ?? 0;
                        const draft = lines.find((ln) => ln.purchaseOrderItemId === it.id);
                        const lineErr = errorsByLine[it.id] ?? {};

                        if (!draft) return null;

                        const disabledLine = pending || pendingQtyForLine <= 0;
                        const label = lineLabel(it, it.id);

                        return (
                          <TableRow key={it.id} className="hover:bg-muted/50 transition-colors">
                            <TableCell>
                              <div className="min-w-0">
                                <div className="truncate text-sm font-medium">{label}</div>
                                <div className="truncate font-mono text-xs text-muted-foreground">{it.id}</div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge variant="outline" className={cn("tabular-nums", pendingBadgeClassName(pendingQtyForLine))}>
                                {pendingQtyForLine}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="space-y-1">
                                <Input
                                  type="number"
                                  min={0}
                                  max={pendingQtyForLine}
                                  step="1"
                                  inputMode="numeric"
                                  value={draft.quantityReceived}
                                  onChange={(e) => setLine(it.id, { quantityReceived: e.target.value })}
                                  className="h-9 w-[120px] text-right tabular-nums"
                                  disabled={disabledLine}
                                  aria-invalid={Boolean(lineErr.quantityReceived)}
                                />
                                {lineErr.quantityReceived ? (
                                  <div className="text-xs text-destructive">{lineErr.quantityReceived}</div>
                                ) : null}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="space-y-1">
                                <Input
                                  type="number"
                                  min={0}
                                  step="0.01"
                                  inputMode="decimal"
                                  value={draft.actualUnitCost}
                                  onChange={(e) => setLine(it.id, { actualUnitCost: e.target.value })}
                                  className="h-9 w-[140px] text-right tabular-nums"
                                  disabled={pending}
                                  aria-invalid={Boolean(lineErr.actualUnitCost)}
                                />
                                {lineErr.actualUnitCost ? (
                                  <div className="text-xs text-destructive">{lineErr.actualUnitCost}</div>
                                ) : null}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Separator />
          </div>
        </div>

        <DialogFooter className="border-t border-border px-4 py-3 sm:px-6">
          <div className="flex w-full items-center justify-between gap-2">
            <div className="text-xs text-muted-foreground">{t("receipt.footer.selected", { count: selectedItems.length })}</div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
                {tc("actions.cancel")}
              </Button>
              <Button type="button" onClick={() => void submit()} disabled={pending}>
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {pending ? tc("actions.loading") : t("receipt.actions.submit")}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
