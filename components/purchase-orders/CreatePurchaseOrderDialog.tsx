"use client";

import { Loader2, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { BranchSelect } from "@/components/branches/BranchSelect";
import { EmptyState } from "@/components/empty-state/EmptyState";
import { ProductForm } from "@/components/products/ProductForm";
import { ProductSelect } from "@/components/products/ProductSelect";
import { SupplierSelect } from "@/components/suppliers/SupplierSelect";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "@/i18n/navigation";
import {
  purchaseOrderCreateDtoSchema,
  type PurchaseOrderCreateDto,
  type PurchaseOrderCreateItem,
} from "@/lib/purchase-orders/types";
import { getAxiosErrorMessage } from "@/lib/products/utils";
import { usePurchaseOrderMutations } from "@/lib/purchase-orders/hooks/use-purchase-order-mutations";

type LineMode = "existing" | "new";

type LineDraft = {
  key: string;
  mode: LineMode;
  productId: string | null;
  quantityOrdered: string;
  agreedUnitCost: string;
};

type LineErrors = Partial<{
  productId: string;
  quantityOrdered: string;
  agreedUnitCost: string;
  newProduct: string;
}>;

type FieldErrors = {
  supplierId?: string;
  branchId?: string;
  lines?: string;
  byLine: Record<string, LineErrors>;
};

const MODE_VALUES = ["existing", "new"] as const;

function isModeValue(value: string): value is LineMode {
  return (MODE_VALUES as readonly string[]).includes(value as (typeof MODE_VALUES)[number]);
}

function newKey() {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function toIsoFromDatetimeLocal(value: string) {
  const s = value.trim();
  if (!s) return null;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function coerceInt(value: string) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.floor(n));
}

function coerceNumber(value: string) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return n;
}

export function CreatePurchaseOrderDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useTranslations("PurchaseOrders");
  const tc = useTranslations("Common");

  const router = useRouter();
  const muts = usePurchaseOrderMutations();

  const [supplierId, setSupplierId] = useState<string | null>(null);
  const [branchId, setBranchId] = useState<string | null>(null);
  const [expectedAtLocal, setExpectedAtLocal] = useState("");
  const [notes, setNotes] = useState("");

  const [lines, setLines] = useState<LineDraft[]>([]);
  const [errors, setErrors] = useState<FieldErrors>({ byLine: {} });
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSupplierId(null);
    setBranchId(null);
    setExpectedAtLocal("");
    setNotes("");
    setLines([
      {
        key: newKey(),
        mode: "existing",
        productId: null,
        quantityOrdered: "1",
        agreedUnitCost: "0",
      },
    ]);
    setErrors({ byLine: {} });
    setFormError(null);
    setSaving(false);
  }, [open]);

  const pending = saving || muts.submitting;

  function addLine() {
    setLines((s) => [
      ...s,
      {
        key: newKey(),
        mode: "existing",
        productId: null,
        quantityOrdered: "1",
        agreedUnitCost: "0",
      },
    ]);
  }

  function removeLine(lineKey: string) {
    setLines((s) => s.filter((ln) => ln.key !== lineKey));
    setErrors((e) => {
      const next = { ...e, byLine: { ...e.byLine } };
      delete next.byLine[lineKey];
      return next;
    });
  }

  function setLine(lineKey: string, update: (prev: LineDraft) => LineDraft) {
    setLines((s) => s.map((ln) => (ln.key === lineKey ? update(ln) : ln)));
  }

  function setLineError(lineKey: string, patch: LineErrors) {
    setErrors((e) => ({
      ...e,
      byLine: {
        ...e.byLine,
        [lineKey]: {
          ...(e.byLine[lineKey] ?? {}),
          ...patch,
        },
      },
    }));
  }

  function validate(): boolean {
    const next: FieldErrors = { byLine: {} };
    const cleanSupplierId = supplierId?.trim() ? supplierId.trim() : null;
    const cleanBranchId = branchId?.trim() ? branchId.trim() : null;

    if (!cleanSupplierId) next.supplierId = t("create.validation.supplierRequired");
    if (!cleanBranchId) next.branchId = t("create.validation.branchRequired");

    if (lines.length === 0) {
      next.lines = t("create.validation.linesRequired");
    }

    for (const ln of lines) {
      const le: LineErrors = {};

      const qty = coerceInt(ln.quantityOrdered);
      if (qty === null || qty <= 0) le.quantityOrdered = t("create.validation.qtyRequired");

      const cost = coerceNumber(ln.agreedUnitCost);
      if (cost === null || cost < 0) le.agreedUnitCost = t("create.validation.costRequired");

      if (ln.mode === "existing") {
        const pid = ln.productId?.trim() ? ln.productId.trim() : null;
        if (!pid) le.productId = t("create.validation.productRequired");
      } else {
        le.newProduct = t("create.validation.newProductRequired");
      }

      if (Object.keys(le).length) next.byLine[ln.key] = le;
    }

    setErrors(next);

    const hasAny = Boolean(next.supplierId || next.branchId || next.lines) || Object.keys(next.byLine).length > 0;
    return !hasAny;
  }

  async function submit() {
    setFormError(null);
    if (!validate()) {
      toast.error(t("create.errors.fixForm"));
      return;
    }

    const cleanSupplierId = supplierId!.trim();
    const cleanBranchId = branchId!.trim();
    const expectedAtIso = expectedAtLocal.trim() ? toIsoFromDatetimeLocal(expectedAtLocal) : null;
    const cleanNotes = notes.trim();

    const items: PurchaseOrderCreateItem[] = [];

     for (const ln of lines) {
       const qty = coerceInt(ln.quantityOrdered) ?? 0;
       const cost = coerceNumber(ln.agreedUnitCost) ?? 0;

       if (ln.mode !== "existing") continue;
       items.push({
         productId: ln.productId!.trim(),
         quantityOrdered: qty,
         agreedUnitCost: cost,
       });
     }

    const dto: PurchaseOrderCreateDto = {
      branchId: cleanBranchId,
      supplierId: cleanSupplierId,
      expectedAt: expectedAtIso ?? undefined,
      notes: cleanNotes ? cleanNotes : undefined,
      items,
    };

    const parsed = purchaseOrderCreateDtoSchema.safeParse(dto);
    if (!parsed.success) {
      toast.error(t("create.errors.fixForm"));
      return;
    }

    setSaving(true);
    try {
      const created = await muts.createPurchaseOrder(parsed.data);
      toast.success(t("success.created"));
      onOpenChange(false);
      router.push(`/purchase-orders/${created.id}`);
    } catch (err) {
      const text = getAxiosErrorMessage(err) ?? tc("errors.generic");
      setFormError(text);
      toast.error(text);
    } finally {
      setSaving(false);
    }
  }

  const lineCount = lines.length;
  const canSubmit =
    Boolean(supplierId && branchId && lineCount > 0) &&
    lines.every((ln) => ln.mode === "existing") &&
    !pending;

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
            <DialogTitle>{t("create.title")}</DialogTitle>
            <DialogDescription>{t("create.subtitle")}</DialogDescription>
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
                <CardTitle>{t("create.sections.headerTitle")}</CardTitle>
                <CardDescription>{t("create.sections.headerSubtitle")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
                  <div className="md:col-span-3 space-y-2">
                    <Label htmlFor="po-create-supplier">{t("create.fields.supplier")}</Label>
                    <SupplierSelect
                      id="po-create-supplier"
                      value={supplierId}
                      onChange={setSupplierId}
                      includeInactive={false}
                    />
                    {errors.supplierId ? <p className="text-xs text-destructive">{errors.supplierId}</p> : null}
                  </div>

                  <div className="md:col-span-3 space-y-2">
                    <Label htmlFor="po-create-branch">{t("create.fields.branch")}</Label>
                    <BranchSelect id="po-create-branch" value={branchId} onChange={setBranchId} />
                    {errors.branchId ? <p className="text-xs text-destructive">{errors.branchId}</p> : null}
                  </div>

                  <div className="md:col-span-3 space-y-2">
                    <Label htmlFor="po-create-expected">{t("create.fields.expectedAt")}</Label>
                    <Input
                      id="po-create-expected"
                      type="datetime-local"
                      value={expectedAtLocal}
                      onChange={(e) => setExpectedAtLocal(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">{t("create.hints.expectedAt")}</p>
                  </div>

                  <div className="md:col-span-3 space-y-2">
                    <Label htmlFor="po-create-notes">{t("create.fields.notes")}</Label>
                    <Textarea
                      id="po-create-notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder={t("create.placeholders.notes")}
                      className="min-h-[96px]"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="border-b">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="space-y-1">
                    <CardTitle>{t("create.sections.linesTitle")}</CardTitle>
                    <CardDescription>{t("create.sections.linesSubtitle")}</CardDescription>
                  </div>
                  <Button type="button" variant="outline" onClick={addLine} disabled={pending}>
                    <Plus className="h-4 w-4" />
                    {t("create.actions.addLine")}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {errors.lines ? (
                  <Alert variant="destructive" className="border-destructive/30 bg-destructive/10">
                    <AlertDescription>{errors.lines}</AlertDescription>
                  </Alert>
                ) : null}

                {lines.length === 0 ? (
                  <EmptyState
                    title={t("create.lines.emptyTitle")}
                    description={t("create.lines.emptyDescription")}
                    action={{ label: t("create.actions.addLine"), onClick: addLine }}
                  />
                ) : (
                  <div className="space-y-4">
                    {lines.map((ln, idx) => (
                      <LineEditor
                        key={ln.key}
                        index={idx}
                        line={ln}
                        error={errors.byLine[ln.key] ?? {}}
                        pending={pending}
                        onChange={(updater) => setLine(ln.key, updater)}
                        onRemove={() => removeLine(ln.key)}
                        onFixError={(patch) => setLineError(ln.key, patch)}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <DialogFooter className="border-t border-border px-4 py-3 sm:px-6">
          <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-muted-foreground">
              {t("create.footer.lines", { count: lineCount })}
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
                {tc("actions.cancel")}
              </Button>
              <Button type="button" onClick={() => void submit()} disabled={!canSubmit}>
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {pending ? tc("actions.loading") : t("create.actions.submit")}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LineEditor({
  index,
  line,
  error,
  pending,
  onChange,
  onRemove,
  onFixError,
}: {
  index: number;
  line: LineDraft;
  error: LineErrors;
  pending: boolean;
  onChange: (updater: (prev: LineDraft) => LineDraft) => void;
  onRemove: () => void;
  onFixError: (patch: LineErrors) => void;
}) {
  const t = useTranslations("PurchaseOrders");

  const lineTitle = t("create.lines.lineTitle", { index: index + 1 });

  const [productFormOpen, setProductFormOpen] = useState(false);

  const modeLabel = line.mode === "existing" ? t("create.lines.modeExisting") : t("create.lines.modeNew");

  return (
    <Card className="bg-background/60 backdrop-blur">
      <CardHeader className="border-b">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">{lineTitle}</CardTitle>
              <Badge variant="secondary">{modeLabel}</Badge>
            </div>
            <CardDescription>{t("create.lines.lineSubtitle")}</CardDescription>
          </div>
          <Button type="button" variant="ghost" size="icon-sm" onClick={onRemove} disabled={pending} aria-label={t("create.actions.removeLine")}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
          <div className="md:col-span-3 space-y-2">
            <Label htmlFor={`po-line-${line.key}-mode`}>{t("create.lines.fields.mode")}</Label>
            <Select
              value={line.mode}
              onValueChange={(next) => {
                if (!isModeValue(next)) return;
                onFixError({ productId: undefined, newProduct: undefined });
                onChange((prev) => ({
                  ...prev,
                  mode: next,
                  productId: next === "existing" ? prev.productId : null,
                }));

                if (next === "new") setProductFormOpen(true);
              }}
            >
              <SelectTrigger id={`po-line-${line.key}-mode`} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="existing">{t("create.lines.modeExisting")}</SelectItem>
                <SelectItem value="new">{t("create.lines.modeNew")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-5 space-y-2">
            <Label htmlFor={`po-line-${line.key}-product`}>{t("create.lines.fields.product")}</Label>
            {line.mode === "existing" ? (
              <>
                <ProductSelect
                  id={`po-line-${line.key}-product`}
                  value={line.productId}
                  onChange={(next) => onChange((prev) => ({ ...prev, productId: next }))}
                  includeInactive={false}
                />
                {error.productId ? <p className="text-xs text-destructive">{error.productId}</p> : null}
              </>
            ) : (
              <div className="space-y-2">
                <div className="rounded-md border border-dashed border-border bg-muted/10 p-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm text-muted-foreground">{t("create.lines.newProductHint")}</div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setProductFormOpen(true)}
                      disabled={pending}
                    >
                      <Plus className="h-4 w-4" />
                      {t("create.lines.actions.createProduct")}
                    </Button>
                  </div>
                </div>
                {error.newProduct ? (
                  <p className="text-xs text-destructive" role="alert">
                    {error.newProduct}
                  </p>
                ) : null}
              </div>
            )}
          </div>

          <div className="md:col-span-2 space-y-2">
            <Label htmlFor={`po-line-${line.key}-qty`}>{t("create.lines.fields.quantityOrdered")}</Label>
            <Input
              id={`po-line-${line.key}-qty`}
              type="number"
              min={1}
              inputMode="numeric"
              value={line.quantityOrdered}
              onChange={(e) => onChange((prev) => ({ ...prev, quantityOrdered: e.target.value }))}
              aria-invalid={Boolean(error.quantityOrdered)}
            />
            {error.quantityOrdered ? <p className="text-xs text-destructive">{error.quantityOrdered}</p> : null}
          </div>

          <div className="md:col-span-2 space-y-2">
            <Label htmlFor={`po-line-${line.key}-cost`}>{t("create.lines.fields.agreedUnitCost")}</Label>
            <Input
              id={`po-line-${line.key}-cost`}
              type="number"
              min={0}
              step="0.01"
              inputMode="decimal"
              value={line.agreedUnitCost}
              onChange={(e) => onChange((prev) => ({ ...prev, agreedUnitCost: e.target.value }))}
              aria-invalid={Boolean(error.agreedUnitCost)}
            />
            {error.agreedUnitCost ? <p className="text-xs text-destructive">{error.agreedUnitCost}</p> : null}
          </div>
        </div>

        <ProductForm
          open={productFormOpen}
          onOpenChange={setProductFormOpen}
          mode="create"
          product={null}
          onSaved={() => undefined}
          showInitialStockStep={false}
          onCreated={(created) => {
            onFixError({ newProduct: undefined });
            onChange((prev) => ({
              ...prev,
              mode: "existing",
              productId: created.id,
            }));
          }}
        />
      </CardContent>
    </Card>
  );
}
