"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import axios from "axios";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAttributeDefinitions } from "@/lib/products/hooks/use-attribute-definitions";
import { useProductMutations } from "@/lib/products/hooks/use-product-mutations";
import type {
  Product,
  ProductAttributeDefinition,
  ProductAttributeValue,
  ProductCreateDto,
} from "@/lib/products/types";
import { getAxiosErrorMessage } from "@/lib/products/utils";

type Mode = "create" | "edit";

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

  const [formError, setFormError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});

  const { items: definitions, loading: defsLoading } = useAttributeDefinitions(
    categoryId.trim() ? categoryId.trim() : null
  );

  const sortedDefinitions = useMemo(
    () => definitions.slice().sort(definitionSort),
    [definitions]
  );

  function setAttr(key: string, value: unknown) {
    setAttrs((s) => ({ ...s, [key]: value }));
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

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!validate()) return;

    const cleanCategoryId = categoryId.trim();

    const attributesPayload: Record<string, unknown> = {};
    for (const def of sortedDefinitions) {
      const v = attrs[def.key];
      if (v === undefined || v === null) continue;
      if (typeof v === "string" && !v.trim()) continue;
      attributesPayload[def.key] = v;
    }

    const basePayload: ProductCreateDto = {
      code: code.trim(),
      name: name.trim(),
      categoryId: cleanCategoryId ? cleanCategoryId : undefined,
      description: description.trim() ? description.trim() : undefined,
      isActive,
      attributes: Object.keys(attributesPayload).length ? attributesPayload : undefined,
    };

    try {
      if (mode === "edit" && product) {
        await updateProduct(product.id, basePayload);
      } else {
        await createProduct(basePayload);
      }
      onOpenChange(false);
      onSaved();
    } catch (err) {
      const msg = getAxiosErrorMessage(err);
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        setFormError(msg ?? t("errors.codeConflict"));
        return;
      }
      setFormError(msg ?? tc("errors.generic"));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? t("form.editTitle") : t("form.createTitle")}
          </DialogTitle>
          <DialogDescription>
            {mode === "edit" ? t("form.editSubtitle") : t("form.createSubtitle")}
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          <form className="space-y-6" onSubmit={onSubmit}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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

              <div className="space-y-2">
                <Label htmlFor="product_categoryId">{t("fields.categoryId")}</Label>
                <Input
                  id="product_categoryId"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  placeholder={t("form.categoryIdHint")}
                  autoComplete="off"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="product_isActive">{t("fields.isActive")}</Label>
                <div className="flex h-10 items-center">
                  <Switch
                    id="product_isActive"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    label={isActive ? tc("labels.active") : tc("labels.inactive")}
                  />
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="product_description">{t("fields.description")}</Label>
                <Textarea
                  id="product_description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t("form.descriptionPlaceholder")}
                />
              </div>
            </div>

            <div className="rounded-xl border border-border p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold">{t("form.attributesTitle")}</div>
                  <div className="text-xs text-muted-foreground">
                    {categoryId.trim()
                      ? t("form.attributesSubtitle")
                      : t("form.attributesNoCategory")}
                  </div>
                </div>
                {defsLoading ? (
                  <div className="text-xs text-muted-foreground">{tc("actions.loading")}</div>
                ) : null}
              </div>

              {sortedDefinitions.length === 0 ? (
                <div className="text-sm text-muted-foreground">{t("form.attributesEmpty")}</div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                            id={fieldId}
                            value={
                              value === true
                                ? "true"
                                : value === false
                                  ? "false"
                                  : ""
                            }
                            onChange={(e) => {
                              const raw = e.target.value;
                              if (!raw) return setAttr(key, undefined);
                              setAttr(key, raw === "true");
                            }}
                            aria-invalid={Boolean(fieldError)}
                          >
                            <option value="">{tc("labels.select")}</option>
                            <option value="true">{tc("labels.yes")}</option>
                            <option value="false">{tc("labels.no")}</option>
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
                            id={fieldId}
                            value={typeof value === "string" ? value : ""}
                            onChange={(e) => setAttr(key, e.target.value)}
                            aria-invalid={Boolean(fieldError)}
                          >
                            <option value="">{tc("labels.select")}</option>
                            {(def.options ?? []).map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
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
            </div>

            {formError ? (
              <div
                className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                role="alert"
              >
                {formError}
              </div>
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
              <Button type="submit" disabled={submitting}>
                {submitting
                  ? tc("actions.loading")
                  : mode === "edit"
                    ? tc("actions.save")
                    : tc("actions.create")}
              </Button>
            </div>
          </form>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
