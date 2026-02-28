"use client";

import { Loader2, Plus } from "lucide-react";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import axios from "axios";
import { toast } from "sonner";

import { CategoryCreatePanel } from "@/components/products/CategoryCreatePanel";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { categoriesApi } from "@/lib/categories/api";
import { useCategories } from "@/lib/categories/hooks/use-categories";
import type { Category } from "@/lib/categories/types";
import { useAttributeDefinitions } from "@/lib/products/hooks/use-attribute-definitions";
import { useProductMutations } from "@/lib/products/hooks/use-product-mutations";
import type {
  Product,
  ProductAttributeDefinition,
  ProductAttributeValue,
  ProductCreateDto,
  ProductUpdateDto,
} from "@/lib/products/types";
import { getAxiosErrorMessage } from "@/lib/products/utils";
import { useAuthStore } from "@/stores/auth-store";

type Mode = "create" | "edit";

type FormTab = "details" | "attributes" | "stock";

const FORM_TAB_VALUES = ["details", "attributes", "stock"] as const;

function isFormTab(value: string): value is FormTab {
  return (FORM_TAB_VALUES as readonly string[]).includes(value);
}

const UNSET_SELECT_VALUE = "__unset__";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: Mode;
  product: Product | null;
  onSaved: () => void;
};

type FieldErrors = Record<string, string>;

function definitionSort(a: ProductAttributeDefinition, b: ProductAttributeDefinition) {
  if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
  return a.key.localeCompare(b.key);
}

function coerceInitialAttrValue(v: ProductAttributeValue | undefined) {
  if (typeof v === "string" && v.includes("T") && /^\d{4}-\d{2}-\d{2}T/.test(v)) {
    return v.slice(0, 10);
  }
  return v;
}

export function ProductForm({ open, onOpenChange, mode, product, onSaved }: Props) {
  const t = useTranslations("Products");
  const tc = useTranslations("Common");
  const ta = useTranslations("Attributes");

  const { submitting, createProduct, updateProduct } = useProductMutations();

  const initial = useMemo(() => {
    if (mode === "edit" && product) {
      const nextAttrs: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(product.attributes)) {
        nextAttrs[k] = coerceInitialAttrValue(v);
      }

      return {
        code: product.code,
        name: product.name,
        categoryId: product.category?.id ?? "",
        description: product.description ?? "",
        isActive: product.isActive,
        attrs: nextAttrs,
      };
    }
    return {
      code: "",
      name: "",
      categoryId: "",
      description: "",
      isActive: true,
      attrs: {},
    };
  }, [mode, product]);

  const [code, setCode] = useState(initial.code);
  const [name, setName] = useState(initial.name);
  const [categoryId, setCategoryId] = useState(initial.categoryId);
  const [description, setDescription] = useState(initial.description);
  const [isActive, setIsActive] = useState(initial.isActive);
  const [attrs, setAttrs] = useState<Record<string, unknown>>(initial.attrs);

  const session = useAuthStore((s) => s.session);
  const sessionLoading = useAuthStore((s) => s.sessionLoading);
  const sessionError = useAuthStore((s) => s.sessionError);
  const hydrateSession = useAuthStore((s) => s.hydrateSession);

  useEffect(() => {
    if (!open || mode !== "create") return;
    if (session || sessionLoading) return;
    void hydrateSession();
  }, [hydrateSession, mode, open, session, sessionLoading]);

  const branches = useMemo(
    () => ({
      items: session?.branches ?? [],
      loading: sessionLoading,
      error: sessionError ? tc("errors.generic") : null,
      refresh: hydrateSession,
    }),
    [hydrateSession, session?.branches, sessionError, sessionLoading, tc]
  );

  type InitialStockRow = {
    key: string;
    branchId: string;
    stockOnHand: string;
    price: string;
  };

  const stockRowSeq = useRef(1);
  const [initialStockEnabled, setInitialStockEnabled] = useState(false);
  const [initialStockRows, setInitialStockRows] = useState<InitialStockRow[]>([
    {
      key: "stock-row-1",
      branchId: "",
      stockOnHand: "",
      price: "",
    },
  ]);

  const categories = useCategories({ limit: 100, enabled: open });
  const [missingCategory, setMissingCategory] = useState<Category | null>(null);
  const [categorySheetOpen, setCategorySheetOpen] = useState(false);

  const categoryOptions = useMemo(() => {
    const seen = new Set<string>();
    const out: Category[] = [];
    for (const c of categories.items) {
      if (seen.has(c.id)) continue;
      seen.add(c.id);
      out.push(c);
    }
    const selectedId = categoryId.trim();
    if (missingCategory && missingCategory.id === selectedId && !seen.has(missingCategory.id)) {
      out.unshift(missingCategory);
    }
    return out;
  }, [categories.items, categoryId, missingCategory]);

  useEffect(() => {
    if (!open) return;
    const id = categoryId.trim();
    if (!id) return;

    const inList = categories.items.some((c) => c.id === id);
    if (inList) return;

    let cancelled = false;
    void (async () => {
      try {
        const fetched = await categoriesApi.get(id);
        if (!cancelled) setMissingCategory(fetched);
      } catch {
        if (!cancelled) setMissingCategory(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [categories.items, categoryId, open]);

  const [formError, setFormError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});

  const [activeTab, setActiveTab] = useState<FormTab>("details");
  const [maxUnlockedTabIndex, setMaxUnlockedTabIndex] = useState(() =>
    mode === "create" ? 0 : 1
  );

  const isCreateWizard = mode === "create";

  function tabIndex(tab: FormTab) {
    if (tab === "details") return 0;
    if (tab === "attributes") return 1;
    return 2;
  }

  function handleDialogOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setCategorySheetOpen(false);
      setActiveTab("details");
      setMaxUnlockedTabIndex(mode === "create" ? 0 : 1);
    }
    onOpenChange(nextOpen);
  }

  const { items: definitions, loading: defsLoading } = useAttributeDefinitions(
    categoryId.trim() ? categoryId.trim() : null
  );

  const sortedDefinitions = useMemo(
    () => definitions.slice().sort(definitionSort),
    [definitions]
  );

  function validateDetailsStep(): boolean {
    const next = { ...errors };
    delete next.code;
    delete next.name;
    if (!code.trim()) next.code = t("validation.codeRequired");
    if (!name.trim()) next.name = t("validation.nameRequired");
    setErrors(next);
    return !next.code && !next.name;
  }

  function validateAttributesStep(): boolean {
    const next: FieldErrors = {};
    for (const [k, v] of Object.entries(errors)) {
      if (k.startsWith("attr.")) continue;
      next[k] = v;
    }

    for (const def of sortedDefinitions) {
      if (!def.isRequired) continue;
      const v = attrs[def.key];
      const missing = v === undefined || v === null || (typeof v === "string" && !v.trim());
      if (missing) next[`attr.${def.key}`] = t("validation.attributeRequired");
    }

    setErrors(next);
    return !Object.keys(next).some((k) => k.startsWith("attr."));
  }

  async function goNext() {
    if (!isCreateWizard) return;
    if (activeTab === "details") {
      if (!validateDetailsStep()) return;
      setMaxUnlockedTabIndex((v) => Math.max(v, 1));
      setActiveTab("attributes");
      return;
    }
    if (activeTab === "attributes") {
      if (defsLoading) return;
      if (!validateAttributesStep()) return;
      setMaxUnlockedTabIndex((v) => Math.max(v, 2));
      setActiveTab("stock");
    }
  }

  function setAttr(key: string, value: unknown) {
    setAttrs((s) => ({ ...s, [key]: value }));
  }

  function addInitialStockRow() {
    stockRowSeq.current += 1;
    setInitialStockRows((rows) => [
      ...rows,
      {
        key: `stock-row-${stockRowSeq.current}`,
        branchId: "",
        stockOnHand: "",
        price: "",
      },
    ]);
  }

  function removeInitialStockRow(key: string) {
    setInitialStockRows((rows) => {
      const next = rows.filter((r) => r.key !== key);
      return next.length ? next : rows;
    });
  }

  function setInitialStockRow(key: string, patch: Partial<InitialStockRow>) {
    setInitialStockRows((rows) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function parseNonNegativeInt(value: string): number | null {
    const raw = value.trim();
    if (!raw) return null;
    const n = Number(raw);
    if (!Number.isFinite(n)) return null;
    if (!Number.isInteger(n)) return null;
    if (n < 0) return null;
    return n;
  }

  function parseNonNegativeNumber(value: string): number | null {
    const raw = value.trim();
    if (!raw) return null;
    const n = Number(raw);
    if (!Number.isFinite(n)) return null;
    if (n < 0) return null;
    return n;
  }

  function buildInitialStockPayload(): ProductCreateDto["initialStock"] {
    if (mode !== "create") return undefined;
    if (!initialStockEnabled) return undefined;

    const deduped = new Map<string, { branchId: string; stockOnHand: number; price: number }>();

    for (const row of initialStockRows) {
      const branchId = row.branchId.trim();
      const stockOnHand = parseNonNegativeInt(row.stockOnHand);
      const price = parseNonNegativeNumber(row.price);
      if (!branchId) continue;
      if (stockOnHand === null || price === null) continue;
      if (deduped.has(branchId)) continue;
      deduped.set(branchId, { branchId, stockOnHand, price });
    }

    const out = Array.from(deduped.values());
    return out.length ? out : undefined;
  }

  function validate(): boolean {
    const next: FieldErrors = {};
    if (!code.trim()) next.code = t("validation.codeRequired");
    if (!name.trim()) next.name = t("validation.nameRequired");

    for (const def of sortedDefinitions) {
      if (!def.isRequired) continue;
      const v = attrs[def.key];
      const missing = v === undefined || v === null || (typeof v === "string" && !v.trim());
      if (missing) next[`attr.${def.key}`] = t("validation.attributeRequired");
    }

    if (mode === "create" && initialStockEnabled) {
      let invalidCount = 0;
      for (const row of initialStockRows) {
        const hasAny = Boolean(
          row.branchId.trim() || row.stockOnHand.trim() || row.price.trim()
        );
        if (!hasAny) continue;

        const branchOk = Boolean(row.branchId.trim());
        const stockOk = parseNonNegativeInt(row.stockOnHand) !== null;
        const priceOk = parseNonNegativeNumber(row.price) !== null;

        if (!branchOk || !stockOk || !priceOk) {
          invalidCount += 1;
          next[`stock.${row.key}`] = t("initialStock.rowInvalid");
        }
      }

      if (invalidCount) {
        next.initialStock = t("initialStock.rowsInvalid", { count: invalidCount });
      }
    }

    setErrors(next);

    if (Object.keys(next).length) {
      if (next.code || next.name) setActiveTab("details");
      else if (Object.keys(next).some((k) => k.startsWith("attr."))) setActiveTab("attributes");
      else if (next.initialStock || Object.keys(next).some((k) => k.startsWith("stock."))) {
        setActiveTab("stock");
      }
      return false;
    }

    return true;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (mode === "create" && activeTab !== "stock") {
      await goNext();
      return;
    }
    if (!validate()) return;

    const cleanCategoryId = categoryId.trim();

    const attributesPayload: Record<string, unknown> = {};
    for (const def of sortedDefinitions) {
      const v = attrs[def.key];
      if (v === undefined || v === null) continue;
      if (typeof v === "string" && !v.trim()) continue;
      attributesPayload[def.key] = v;
    }

    const base = {
      code: code.trim(),
      name: name.trim(),
      categoryId: cleanCategoryId ? cleanCategoryId : undefined,
      description: description.trim() ? description.trim() : undefined,
      isActive,
      attributes: Object.keys(attributesPayload).length ? attributesPayload : undefined,
    };

    try {
      if (mode === "edit" && product) {
        const updatePayload: ProductUpdateDto = base;
        await updateProduct(product.id, updatePayload);
        toast.success(t("success.updated"));
      } else {
        const initialStock = buildInitialStockPayload();
        const createPayload: ProductCreateDto = {
          ...base,
          initialStock,
        };
        await createProduct(createPayload);
        toast.success(t("success.created"));
      }
      onOpenChange(false);
      onSaved();
    } catch (err) {
      const msg = getAxiosErrorMessage(err);
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        const text = msg ?? t("errors.codeConflict");
        setFormError(text);
        toast.error(text);
        return;
      }
      const text = msg ?? tc("errors.generic");
      setFormError(text);
      toast.error(text);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-5xl">
        <div className="border-b border-border px-4 py-4 pr-12 sm:px-6 sm:py-5">
          <DialogHeader className="gap-1">
            <DialogTitle>
              {mode === "edit" ? t("form.editTitle") : t("form.createTitle")}
            </DialogTitle>
            <DialogDescription>
              {mode === "edit" ? t("form.editSubtitle") : t("form.createSubtitle")}
            </DialogDescription>
          </DialogHeader>
        </div>

        <form className="flex min-h-0 flex-1 flex-col" onSubmit={onSubmit}>
          <Tabs
            value={activeTab}
            onValueChange={(v) => {
              if (!isFormTab(v)) return;
              if (isCreateWizard && tabIndex(v) > maxUnlockedTabIndex) return;
              setActiveTab(v);
            }}
            className="flex min-h-0 flex-1 flex-col gap-0"
          >
            <div className="border-b border-border px-4 py-2 sm:px-6">
              <TabsList className="w-full justify-start" variant="line">
                <TabsTrigger
                  value="details"
                  className="after:bg-primary data-[state=active]:text-primary dark:data-[state=active]:text-primary"
                >
                  {t("form.tabs.details")}
                </TabsTrigger>
                {!isCreateWizard || maxUnlockedTabIndex >= 1 ? (
                  <TabsTrigger
                    value="attributes"
                    className="after:bg-primary data-[state=active]:text-primary dark:data-[state=active]:text-primary"
                  >
                    {t("form.tabs.attributes")}
                  </TabsTrigger>
                ) : null}
                {isCreateWizard && maxUnlockedTabIndex >= 2 ? (
                  <TabsTrigger
                    value="stock"
                    className="after:bg-primary data-[state=active]:text-primary dark:data-[state=active]:text-primary"
                  >
                    {t("form.tabs.stock")}
                  </TabsTrigger>
                ) : null}
              </TabsList>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
              <TabsContent value="details" className="space-y-6">
                <Card>
                  <CardHeader className="border-b">
                    <CardTitle>{t("form.sections.basicsTitle")}</CardTitle>
                    <CardDescription>{t("form.sections.basicsSubtitle")}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="product_code">{t("fields.code")}</Label>
                        <Input
                          id="product_code"
                          value={code}
                          onChange={(e) => setCode(e.target.value)}
                          aria-invalid={Boolean(errors.code)}
                          autoComplete="off"
                        />
                        {errors.code ? (
                          <p className="text-sm text-destructive" role="alert">
                            {errors.code}
                          </p>
                        ) : null}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="product_name">{t("fields.name")}</Label>
                        <Input
                          id="product_name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          aria-invalid={Boolean(errors.name)}
                          autoComplete="off"
                        />
                        {errors.name ? (
                          <p className="text-sm text-destructive" role="alert">
                            {errors.name}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="product_isActive">{t("fields.isActive")}</Label>
                      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2">
                        <div className="text-sm text-muted-foreground">
                          {isActive ? tc("labels.active") : tc("labels.inactive")}
                        </div>
                        <Switch
                          id="product_isActive"
                          checked={isActive}
                          onCheckedChange={(checked) => setIsActive(checked)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="border-b">
                    <CardTitle>{t("form.sections.catalogTitle")}</CardTitle>
                    <CardDescription>{t("form.sections.catalogSubtitle")}</CardDescription>
                    <CardAction>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => void categories.refresh()}
                        disabled={categories.loading}
                      >
                        {categories.loading ? tc("actions.loading") : tc("actions.refresh")}
                      </Button>
                    </CardAction>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="product_category">{t("fields.category")}</Label>
                      <Select
                        value={categoryId.trim() ? categoryId.trim() : UNSET_SELECT_VALUE}
                        onValueChange={(value) =>
                          setCategoryId(value === UNSET_SELECT_VALUE ? "" : value)
                        }
                      >
                        <SelectTrigger id="product_category" className="w-full">
                          <SelectValue placeholder={t("form.categorySelectPlaceholder")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={UNSET_SELECT_VALUE}>{tc("labels.none")}</SelectItem>
                          {categoryOptions.length === 0 ? (
                            <SelectItem value="__empty__" disabled>
                              {t("form.categoryEmpty")}
                            </SelectItem>
                          ) : null}
                          {categoryOptions
                            .slice()
                            .sort((a, b) => a.name.localeCompare(b.name))
                            .map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                <span className="flex w-full items-center justify-between gap-2">
                                  <span className="truncate">{c.name}</span>
                                  <span className="font-mono text-xs text-muted-foreground">
                                    {c.id.slice(0, 6)}
                                  </span>
                                </span>
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>{t("form.categoryCreateAction")}</Label>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setCategorySheetOpen(true)}
                      >
                        <Plus className="h-4 w-4" />
                        {t("form.categoryCreateOpen")}
                      </Button>
                    </div>

                    {categories.error ? (
                      <Alert
                        variant="destructive"
                        className="border-destructive/30 bg-destructive/10"
                      >
                        <AlertDescription>{categories.error}</AlertDescription>
                      </Alert>
                    ) : null}

                    <div className="space-y-2">
                      <Label htmlFor="product_description">{t("fields.description")}</Label>
                      <Textarea
                        id="product_description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder={t("form.descriptionPlaceholder")}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="attributes">
                <Card>
                  <CardHeader className="border-b">
                    <CardTitle>{t("form.attributesTitle")}</CardTitle>
                    <CardDescription>
                      {categoryId.trim()
                        ? t("form.attributesSubtitle")
                        : t("form.attributesNoCategory")}
                    </CardDescription>
                    {defsLoading ? (
                      <CardAction>
                        <div className="text-xs text-muted-foreground">{tc("actions.loading")}</div>
                      </CardAction>
                    ) : null}
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {sortedDefinitions.length === 0 ? (
                      <div className="text-sm text-muted-foreground">{t("form.attributesEmpty")}</div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {sortedDefinitions.map((def) => {
                          const key = def.key;
                          const fieldId = `attr_${key}`;
                          const fieldError = errors[`attr.${key}`];
                          const value = attrs[key];

                          return (
                            <div key={def.id} className="space-y-2">
                              <Label htmlFor={fieldId}>
                                {def.label}
                                {def.unit ? (
                                  <span className="text-muted-foreground"> ({def.unit})</span>
                                ) : null}
                                {def.isRequired ? (
                                  <span className="text-destructive"> *</span>
                                ) : null}
                              </Label>

                              {def.type === "TEXT" ? (
                                <Input
                                  id={fieldId}
                                  value={typeof value === "string" ? value : ""}
                                  onChange={(e) => setAttr(key, e.target.value)}
                                  aria-invalid={Boolean(fieldError)}
                                />
                              ) : null}

                              {def.type === "NUMBER" ? (
                                <Input
                                  id={fieldId}
                                  type="number"
                                  value={typeof value === "number" ? String(value) : ""}
                                  onChange={(e) => {
                                    const raw = e.target.value;
                                    if (!raw) return setAttr(key, undefined);
                                    const n = Number(raw);
                                    if (Number.isNaN(n)) return setAttr(key, undefined);
                                    setAttr(key, n);
                                  }}
                                  aria-invalid={Boolean(fieldError)}
                                />
                              ) : null}

                              {def.type === "BOOLEAN" ? (
                                <Select
                                  value={
                                    value === true
                                      ? "true"
                                      : value === false
                                        ? "false"
                                        : UNSET_SELECT_VALUE
                                  }
                                  onValueChange={(raw) => {
                                    if (raw === UNSET_SELECT_VALUE) return setAttr(key, undefined);
                                    setAttr(key, raw === "true");
                                  }}
                                >
                                  <SelectTrigger
                                    id={fieldId}
                                    aria-invalid={Boolean(fieldError)}
                                    className="w-full"
                                  >
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value={UNSET_SELECT_VALUE}>
                                      {tc("labels.select")}
                                    </SelectItem>
                                    <SelectItem value="true">{tc("labels.yes")}</SelectItem>
                                    <SelectItem value="false">{tc("labels.no")}</SelectItem>
                                  </SelectContent>
                                </Select>
                              ) : null}

                              {def.type === "DATE" ? (
                                <Input
                                  id={fieldId}
                                  type="date"
                                  value={typeof value === "string" ? value : ""}
                                  onChange={(e) => setAttr(key, e.target.value)}
                                  aria-invalid={Boolean(fieldError)}
                                />
                              ) : null}

                              {def.type === "ENUM" ? (
                                <Select
                                  value={typeof value === "string" ? value : UNSET_SELECT_VALUE}
                                  onValueChange={(raw) => {
                                    if (raw === UNSET_SELECT_VALUE) return setAttr(key, undefined);
                                    setAttr(key, raw);
                                  }}
                                >
                                  <SelectTrigger
                                    id={fieldId}
                                    aria-invalid={Boolean(fieldError)}
                                    className="w-full"
                                  >
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value={UNSET_SELECT_VALUE}>
                                      {tc("labels.select")}
                                    </SelectItem>
                                    {(def.options ?? []).map((opt) => (
                                      <SelectItem key={opt} value={opt}>
                                        {opt}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : null}

                              {fieldError ? (
                                <p className="text-sm text-destructive" role="alert">
                                  {fieldError}
                                </p>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {mode === "create" ? (
                <TabsContent value="stock" className="space-y-6">
                  <div className="rounded-lg border border-border p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <Label htmlFor="product_initialStock" className="text-sm font-semibold">
                          {t("initialStock.toggle")}
                        </Label>
                        <p className="text-sm text-muted-foreground">{t("initialStock.subtitle")}</p>
                      </div>
                      <Switch
                        id="product_initialStock"
                        checked={initialStockEnabled}
                        onCheckedChange={(checked) => setInitialStockEnabled(checked)}
                      />
                    </div>
                  </div>

                  {errors.initialStock ? (
                    <Alert variant="destructive" className="border-destructive/30 bg-destructive/10">
                      <AlertDescription>{errors.initialStock}</AlertDescription>
                    </Alert>
                  ) : null}

                  {initialStockEnabled ? (
                    <div className="space-y-4">
                      {branches.error ? (
                        <Alert variant="destructive" className="border-destructive/30 bg-destructive/10">
                          <AlertDescription>{branches.error}</AlertDescription>
                        </Alert>
                      ) : null}

                      <div className="rounded-lg border border-border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>{t("initialStock.branch")}</TableHead>
                              <TableHead className="w-[160px]">{t("initialStock.stockOnHand")}</TableHead>
                              <TableHead className="w-[160px]">{t("initialStock.price")}</TableHead>
                              <TableHead className="w-[120px] text-right">{tc("labels.actions")}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {initialStockRows.map((row) => {
                              const selectedByOthers = new Set(
                                initialStockRows
                                  .filter((r) => r.key !== row.key)
                                  .map((r) => r.branchId.trim())
                                  .filter(Boolean)
                              );

                              const branchSelectId = `stock_branch_${row.key}`;
                              const stockId = `stock_onhand_${row.key}`;
                              const priceId = `stock_price_${row.key}`;

                              const rowError = errors[`stock.${row.key}`];

                              return (
                                <Fragment key={row.key}>
                                  <TableRow>
                                    <TableCell className="align-top">
                                      <Label htmlFor={branchSelectId} className="sr-only">
                                        {t("initialStock.branch")}
                                      </Label>
                                      <Select
                                        value={row.branchId.trim() ? row.branchId.trim() : "__unset__"}
                                        onValueChange={(v) =>
                                          setInitialStockRow(row.key, {
                                            branchId: v === "__unset__" ? "" : v,
                                          })
                                        }
                                        disabled={branches.loading || branches.items.length === 0}
                                      >
                                        <SelectTrigger id={branchSelectId} className="w-full">
                                          <SelectValue placeholder={tc("labels.select")} />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="__unset__">{tc("labels.none")}</SelectItem>
                                          {branches.items.map((b) => (
                                            <SelectItem
                                              key={b.id}
                                              value={b.id}
                                              disabled={selectedByOthers.has(b.id)}
                                            >
                                              {b.name}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </TableCell>

                                    <TableCell className="align-top">
                                      <Label htmlFor={stockId} className="sr-only">
                                        {t("initialStock.stockOnHand")}
                                      </Label>
                                      <Input
                                        id={stockId}
                                        type="number"
                                        min={0}
                                        step={1}
                                        inputMode="numeric"
                                        value={row.stockOnHand}
                                        onChange={(e) =>
                                          setInitialStockRow(row.key, { stockOnHand: e.target.value })
                                        }
                                        aria-invalid={Boolean(rowError)}
                                      />
                                    </TableCell>

                                    <TableCell className="align-top">
                                      <Label htmlFor={priceId} className="sr-only">
                                        {t("initialStock.price")}
                                      </Label>
                                      <Input
                                        id={priceId}
                                        type="number"
                                        min={0}
                                        step={0.01}
                                        inputMode="decimal"
                                        value={row.price}
                                        onChange={(e) =>
                                          setInitialStockRow(row.key, { price: e.target.value })
                                        }
                                        aria-invalid={Boolean(rowError)}
                                      />
                                    </TableCell>

                                    <TableCell className="align-top text-right">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => removeInitialStockRow(row.key)}
                                        disabled={initialStockRows.length <= 1}
                                      >
                                        {t("initialStock.remove")}
                                      </Button>
                                    </TableCell>
                                  </TableRow>

                                  {rowError ? (
                                    <TableRow>
                                      <TableCell colSpan={4} className="pt-0">
                                        <p className="text-sm text-destructive" role="alert">
                                          {rowError}
                                        </p>
                                      </TableCell>
                                    </TableRow>
                                  ) : null}
                                </Fragment>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>

                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={addInitialStockRow}
                          disabled={branches.loading}
                        >
                          {t("initialStock.addBranch")}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => void branches.refresh()}
                          disabled={branches.loading}
                        >
                          {branches.loading ? tc("actions.loading") : tc("actions.refresh")}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-border bg-muted/10 p-4 text-sm text-muted-foreground">
                      {t("initialStock.disabledHint")}
                    </div>
                  )}
                </TabsContent>
              ) : null}
            </div>

            <div className="border-t border-border bg-background/80 px-4 py-4 backdrop-blur sm:px-6">
              {formError ? (
                <Alert variant="destructive" className="mb-4 border-destructive/30 bg-destructive/10">
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              ) : null}

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  disabled={submitting}
                  onClick={() => onOpenChange(false)}
                >
                  {tc("actions.cancel")}
                </Button>

                {mode === "create" && activeTab !== "stock" ? (
                  <Button
                    type="button"
                    disabled={submitting || (activeTab === "attributes" && defsLoading)}
                    onClick={() => void goNext()}
                  >
                    {tc("actions.next")}
                  </Button>
                ) : (
                  <Button type="submit" disabled={submitting}>
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {submitting
                      ? tc("actions.loading")
                      : mode === "edit"
                        ? tc("actions.save")
                        : tc("actions.create")}
                  </Button>
                )}
              </div>
            </div>
          </Tabs>
        </form>

        <Sheet open={categorySheetOpen} onOpenChange={setCategorySheetOpen}>
          <SheetContent
            side="right"
            className="w-full gap-0 overflow-hidden sm:max-w-3xl"
          >
            <SheetHeader className="sr-only">
              <SheetTitle>{ta("categories.createPanel.title")}</SheetTitle>
              <SheetDescription>{ta("categories.createPanel.subtitle")}</SheetDescription>
            </SheetHeader>
            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
              <CategoryCreatePanel
                onCancel={() => setCategorySheetOpen(false)}
                onCreated={async (created) => {
                  await categories.refresh();
                  setCategoryId(created.id);
                }}
              />
            </div>
          </SheetContent>
        </Sheet>
      </DialogContent>
    </Dialog>
  );
}
