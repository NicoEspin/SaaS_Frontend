"use client";

import { Loader2, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { BranchSelect } from "@/components/branches/BranchSelect";
import { EmptyState } from "@/components/empty-state/EmptyState";
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
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "@/i18n/navigation";
import { useCategories } from "@/lib/categories/hooks/use-categories";
import type { Category } from "@/lib/categories/types";
import { useAttributeDefinitions } from "@/lib/products/hooks/use-attribute-definitions";
import type { ProductAttributeDefinition } from "@/lib/products/types";
import {
  purchaseOrderCreateDtoSchema,
  type PurchaseOrderCreateDto,
  type PurchaseOrderCreateItem,
  type PurchaseOrderNewProduct,
} from "@/lib/purchase-orders/types";
import { getAxiosErrorMessage } from "@/lib/products/utils";
import { usePurchaseOrderMutations } from "@/lib/purchase-orders/hooks/use-purchase-order-mutations";
import { cn } from "@/lib/utils";

type LineMode = "existing" | "new";

type LineDraft = {
  key: string;
  mode: LineMode;
  productId: string | null;
  quantityOrdered: string;
  agreedUnitCost: string;
  newProduct: {
    code: string;
    name: string;
    categoryId: string;
    isActive: boolean;
    attributes: Record<string, unknown>;
    customAttributesJson: string;
  };
};

type LineErrors = Partial<{
  productId: string;
  quantityOrdered: string;
  agreedUnitCost: string;
  newCode: string;
  newName: string;
  customAttributesJson: string;
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

const UNSET_SELECT_VALUE = "__unset__";

export function CreatePurchaseOrderDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useTranslations("PurchaseOrders");
  const tc = useTranslations("Common");

  const router = useRouter();
  const muts = usePurchaseOrderMutations();
  const categories = useCategories({ limit: 200, enabled: open });

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
        newProduct: {
          code: "",
          name: "",
          categoryId: "",
          isActive: true,
          attributes: {},
          customAttributesJson: "",
        },
      },
    ]);
    setErrors({ byLine: {} });
    setFormError(null);
    setSaving(false);
  }, [open]);

  const sortedCategories = useMemo(() => {
    const out = categories.items.slice();
    out.sort((a, b) => a.name.localeCompare(b.name));
    return out;
  }, [categories.items]);

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
        newProduct: {
          code: "",
          name: "",
          categoryId: "",
          isActive: true,
          attributes: {},
          customAttributesJson: "",
        },
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
        const code = ln.newProduct.code.trim();
        const name = ln.newProduct.name.trim();
        if (!code) le.newCode = t("create.validation.newCodeRequired");
        if (!name) le.newName = t("create.validation.newNameRequired");

        const json = ln.newProduct.customAttributesJson.trim();
        if (json) {
          try {
            const parsed = JSON.parse(json) as unknown;
            if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
              le.customAttributesJson = t("create.validation.customAttributesInvalid");
            }
          } catch {
            le.customAttributesJson = t("create.validation.customAttributesInvalid");
          }
        }
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

      if (ln.mode === "existing") {
        items.push({
          productId: ln.productId!.trim(),
          quantityOrdered: qty,
          agreedUnitCost: cost,
        });
      } else {
        let mergedAttrs: Record<string, unknown> = { ...ln.newProduct.attributes };
        const json = ln.newProduct.customAttributesJson.trim();
        if (json) {
          const parsed = JSON.parse(json) as Record<string, unknown>;
          mergedAttrs = { ...mergedAttrs, ...parsed };
        }

        const newProduct: PurchaseOrderNewProduct = {
          code: ln.newProduct.code.trim(),
          name: ln.newProduct.name.trim(),
          isActive: ln.newProduct.isActive,
          categoryId: ln.newProduct.categoryId.trim() ? ln.newProduct.categoryId.trim() : undefined,
          attributes: Object.keys(mergedAttrs).length ? mergedAttrs : undefined,
        };

        items.push({
          newProduct,
          quantityOrdered: qty,
          agreedUnitCost: cost,
        });
      }
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
  const canSubmit = Boolean(supplierId && branchId && lineCount > 0) && !pending;

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
                        categories={sortedCategories}
                        categoriesLoading={categories.loading}
                        categoriesError={categories.error}
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
  categories,
  categoriesLoading,
  categoriesError,
  onChange,
  onRemove,
  onFixError,
}: {
  index: number;
  line: LineDraft;
  error: LineErrors;
  pending: boolean;
  categories: Category[];
  categoriesLoading: boolean;
  categoriesError: string | null;
  onChange: (updater: (prev: LineDraft) => LineDraft) => void;
  onRemove: () => void;
  onFixError: (patch: LineErrors) => void;
}) {
  const t = useTranslations("PurchaseOrders");
  const tc = useTranslations("Common");
  const tp = useTranslations("Products");

  const lineTitle = t("create.lines.lineTitle", { index: index + 1 });

  const attributeDefinitions = useAttributeDefinitions(line.mode === "new" ? (line.newProduct.categoryId.trim() || null) : null);

  function setAttr(key: string, value: unknown) {
    onChange((prev) => ({
      ...prev,
      newProduct: {
        ...prev.newProduct,
        attributes: {
          ...prev.newProduct.attributes,
          [key]: value,
        },
      },
    }));
  }

  function clearAttr(key: string) {
    onChange((prev) => {
      const nextAttrs = { ...prev.newProduct.attributes };
      delete nextAttrs[key];
      return {
        ...prev,
        newProduct: {
          ...prev.newProduct,
          attributes: nextAttrs,
        },
      };
    });
  }

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
                onFixError({ productId: undefined, newCode: undefined, newName: undefined });
                onChange((prev) => ({
                  ...prev,
                  mode: next,
                  productId: next === "existing" ? prev.productId : null,
                }));
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
              <div className="rounded-md border border-dashed border-border bg-muted/10 p-3 text-sm text-muted-foreground">
                {t("create.lines.newProductHint")}
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

        {line.mode === "new" ? (
          <>
            <Separator />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
              <div className="md:col-span-3 space-y-2">
                <Label htmlFor={`po-line-${line.key}-new-code`}>{tp("fields.code")}</Label>
                <Input
                  id={`po-line-${line.key}-new-code`}
                  value={line.newProduct.code}
                  onChange={(e) => onChange((prev) => ({ ...prev, newProduct: { ...prev.newProduct, code: e.target.value } }))}
                  aria-invalid={Boolean(error.newCode)}
                />
                {error.newCode ? <p className="text-xs text-destructive">{error.newCode}</p> : null}
              </div>
              <div className="md:col-span-5 space-y-2">
                <Label htmlFor={`po-line-${line.key}-new-name`}>{tp("fields.name")}</Label>
                <Input
                  id={`po-line-${line.key}-new-name`}
                  value={line.newProduct.name}
                  onChange={(e) => onChange((prev) => ({ ...prev, newProduct: { ...prev.newProduct, name: e.target.value } }))}
                  aria-invalid={Boolean(error.newName)}
                />
                {error.newName ? <p className="text-xs text-destructive">{error.newName}</p> : null}
              </div>
              <div className="md:col-span-4 space-y-2">
                <Label htmlFor={`po-line-${line.key}-new-category`}>{tp("fields.category")}</Label>
                {categoriesLoading ? (
                  <Skeleton className="h-9 w-full" />
                ) : categoriesError ? (
                  <Alert variant="destructive" className="border-destructive/30 bg-destructive/10">
                    <AlertDescription>{categoriesError}</AlertDescription>
                  </Alert>
                ) : (
                  <Select
                    value={line.newProduct.categoryId.trim() ? line.newProduct.categoryId : UNSET_SELECT_VALUE}
                    onValueChange={(next) => {
                      const nextId = next === UNSET_SELECT_VALUE ? "" : next;
                      onChange((prev) => ({
                        ...prev,
                        newProduct: { ...prev.newProduct, categoryId: nextId, attributes: {} },
                      }));
                    }}
                  >
                    <SelectTrigger id={`po-line-${line.key}-new-category`} className="w-full">
                      <SelectValue placeholder={tp("form.categorySelectPlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={UNSET_SELECT_VALUE}>{tc("labels.none")}</SelectItem>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-md border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-0.5">
                <div className="text-sm font-medium">{tp("fields.isActive")}</div>
                <div className="text-xs text-muted-foreground">{t("create.lines.newProductActiveHint")}</div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id={`po-line-${line.key}-new-active`}
                  checked={line.newProduct.isActive}
                  onCheckedChange={(checked) => onChange((prev) => ({ ...prev, newProduct: { ...prev.newProduct, isActive: checked } }))}
                  disabled={pending}
                />
                <Label htmlFor={`po-line-${line.key}-new-active`} className="text-sm">
                  {line.newProduct.isActive ? tc("labels.active") : tc("labels.inactive")}
                </Label>
              </div>
            </div>

            {line.newProduct.categoryId.trim() ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">{tp("fields.attributes")}</div>
                  {attributeDefinitions.loading ? (
                    <div className="text-xs text-muted-foreground">{tc("actions.loading")}</div>
                  ) : null}
                </div>

                {attributeDefinitions.error ? (
                  <Alert variant="destructive" className="border-destructive/30 bg-destructive/10">
                    <AlertDescription>{attributeDefinitions.error}</AlertDescription>
                  </Alert>
                ) : null}

                {!attributeDefinitions.loading && attributeDefinitions.items.length === 0 ? (
                  <div className="rounded-md border border-dashed border-border bg-muted/10 p-3 text-sm text-muted-foreground">
                    {t("create.lines.noAttributes")}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
                    {attributeDefinitions.items
                      .slice()
                      .sort((a, b) => a.sortOrder - b.sortOrder)
                      .map((def) => (
                        <AttributeField
                          key={def.id}
                          definition={def}
                          idPrefix={`po-line-${line.key}`}
                          value={line.newProduct.attributes[def.key]}
                          onChange={(v) => setAttr(def.key, v)}
                          onClear={() => clearAttr(def.key)}
                          disabled={pending}
                        />
                      ))}
                  </div>
                )}
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor={`po-line-${line.key}-custom-attrs`}>{t("create.lines.fields.customAttributes")}</Label>
              <Textarea
                id={`po-line-${line.key}-custom-attrs`}
                value={line.newProduct.customAttributesJson}
                onChange={(e) => onChange((prev) => ({ ...prev, newProduct: { ...prev.newProduct, customAttributesJson: e.target.value } }))}
                placeholder={t("create.lines.placeholders.customAttributes")}
                className="min-h-[96px] font-mono text-xs"
                aria-invalid={Boolean(error.customAttributesJson)}
              />
              {error.customAttributesJson ? (
                <p className="text-xs text-destructive">{error.customAttributesJson}</p>
              ) : (
                <p className="text-xs text-muted-foreground">{t("create.lines.hints.customAttributes")}</p>
              )}
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}

function AttributeField({
  definition,
  idPrefix,
  value,
  onChange,
  onClear,
  disabled,
}: {
  definition: ProductAttributeDefinition;
  idPrefix: string;
  value: unknown;
  onChange: (value: unknown) => void;
  onClear: () => void;
  disabled: boolean;
}) {
  const t = useTranslations("PurchaseOrders");

  const id = `${idPrefix}_attr_${definition.id}`;
  const required = definition.isRequired;
  const label = definition.label;

  const helper = required ? t("create.lines.attributes.required") : t("create.lines.attributes.optional");

  const containerClass = "md:col-span-6";

  if (definition.type === "BOOLEAN") {
    const checked = typeof value === "boolean" ? value : false;
    const hasValue = typeof value === "boolean";
    return (
      <div className={cn(containerClass, "space-y-2")}
      >
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor={id}>{label}</Label>
          <Button type="button" variant="ghost" size="xs" disabled={disabled || !hasValue} onClick={onClear}>
            {t("create.actions.clear")}
          </Button>
        </div>
        <div className="flex items-center justify-between rounded-md border border-border p-3">
          <div className="text-xs text-muted-foreground">{helper}</div>
          <Switch id={id} checked={checked} onCheckedChange={(v) => onChange(v)} disabled={disabled} />
        </div>
      </div>
    );
  }

  if (definition.type === "ENUM") {
    const v = typeof value === "string" ? value : "";
    const opts = definition.options ?? [];
    return (
      <div className={cn(containerClass, "space-y-2")}
      >
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor={id}>{label}</Label>
          <Button type="button" variant="ghost" size="xs" disabled={disabled || !v} onClick={onClear}>
            {t("create.actions.clear")}
          </Button>
        </div>
        <Select
          value={v ? v : UNSET_SELECT_VALUE}
          onValueChange={(next) => {
            if (next === UNSET_SELECT_VALUE) onClear();
            else onChange(next);
          }}
          disabled={disabled}
        >
          <SelectTrigger id={id} className="w-full">
            <SelectValue placeholder={t("create.lines.attributes.pickOne")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={UNSET_SELECT_VALUE}>{t("create.lines.attributes.unset")}</SelectItem>
            {opts.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">{helper}</p>
      </div>
    );
  }

  if (definition.type === "NUMBER") {
    const v = typeof value === "number" ? String(value) : typeof value === "string" ? value : "";
    return (
      <div className={cn(containerClass, "space-y-2")}
      >
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor={id}>{label}</Label>
          <Button type="button" variant="ghost" size="xs" disabled={disabled || !v} onClick={onClear}>
            {t("create.actions.clear")}
          </Button>
        </div>
        <Input
          id={id}
          type="number"
          inputMode="decimal"
          value={v}
          onChange={(e) => {
            const raw = e.target.value;
            if (!raw.trim()) {
              onClear();
              return;
            }
            const n = Number(raw);
            if (!Number.isFinite(n)) return;
            onChange(n);
          }}
          disabled={disabled}
        />
        <p className="text-xs text-muted-foreground">{helper}</p>
      </div>
    );
  }

  if (definition.type === "DATE") {
    const v = typeof value === "string" ? value : "";
    return (
      <div className={cn(containerClass, "space-y-2")}
      >
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor={id}>{label}</Label>
          <Button type="button" variant="ghost" size="xs" disabled={disabled || !v} onClick={onClear}>
            {t("create.actions.clear")}
          </Button>
        </div>
        <Input
          id={id}
          type="date"
          value={v}
          onChange={(e) => {
            const next = e.target.value;
            if (!next.trim()) onClear();
            else onChange(next);
          }}
          disabled={disabled}
        />
        <p className="text-xs text-muted-foreground">{helper}</p>
      </div>
    );
  }

  // TEXT and fallback
  const v = typeof value === "string" ? value : value === undefined ? "" : String(value);
  return (
    <div className={cn(containerClass, "space-y-2")}
    >
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={id}>{label}</Label>
        <Button type="button" variant="ghost" size="xs" disabled={disabled || !v} onClick={onClear}>
          {t("create.actions.clear")}
        </Button>
      </div>
      <Input
        id={id}
        value={v}
        onChange={(e) => {
          const next = e.target.value;
          if (!next.trim()) onClear();
          else onChange(next);
        }}
        disabled={disabled}
      />
      <p className="text-xs text-muted-foreground">{helper}</p>
    </div>
  );
}
