"use client";

import { Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { ConfirmDialog } from "@/components/products/ConfirmDialog";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { isValidAttributeKey } from "@/lib/validators";
import { useAttributeDefinitions } from "@/lib/products/hooks/use-attribute-definitions";
import type {
  ProductAttributeDefinition,
  ProductAttributeDefinitionType,
} from "@/lib/products/types";
import { getAxiosErrorMessage } from "@/lib/products/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type FormState = {
  id: string | null;
  categoryId: string;
  key: string;
  label: string;
  type: ProductAttributeDefinitionType;
  optionsText: string;
  unit: string;
  isRequired: boolean;
  isVisibleInTable: boolean;
  sortOrder: string;
};

function parseOptions(text: string): string[] {
  const raw = text
    .split(/\r?\n|,/g)
    .map((s) => s.trim())
    .filter(Boolean);
  return Array.from(new Set(raw));
}

function toForm(def: ProductAttributeDefinition): FormState {
  return {
    id: def.id,
    categoryId: def.categoryId,
    key: def.key,
    label: def.label,
    type: def.type,
    optionsText: (def.options ?? []).join("\n"),
    unit: def.unit ?? "",
    isRequired: def.isRequired,
    isVisibleInTable: def.isVisibleInTable,
    sortOrder: String(def.sortOrder),
  };
}

function emptyForm(categoryId: string): FormState {
  return {
    id: null,
    categoryId,
    key: "",
    label: "",
    type: "TEXT",
    optionsText: "",
    unit: "",
    isRequired: false,
    isVisibleInTable: true,
    sortOrder: "0",
  };
}

export function AttributeDefinitionsManager({ open, onOpenChange }: Props) {
  const t = useTranslations("Attributes");
  const tc = useTranslations("Common");

  const [categoryId, setCategoryId] = useState("");
  const {
    items,
    loading,
    error,
    refresh,
    createDefinition,
    updateDefinition,
    deleteDefinition,
  } = useAttributeDefinitions(categoryId.trim() ? categoryId.trim() : null);

  const [form, setForm] = useState<FormState>(emptyForm(""));
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<ProductAttributeDefinition | null>(null);
  const [deleting, setDeleting] = useState(false);

  const sorted = useMemo(
    () => items.slice().sort((a, b) => a.sortOrder - b.sortOrder),
    [items]
  );

  useEffect(() => {
    if (!open) return;
    setForm(emptyForm(categoryId.trim()));
    setFormError(null);
  }, [categoryId, open]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const cleanCategoryId = categoryId.trim();
    if (!cleanCategoryId) {
      setFormError(t("errors.categoryRequired"));
      return;
    }

    const key = form.key.trim();
    if (!key || !isValidAttributeKey(key)) {
      setFormError(t("errors.invalidKey"));
      return;
    }

    const label = form.label.trim();
    if (!label) {
      setFormError(t("errors.labelRequired"));
      return;
    }

    const sortOrder = Number(form.sortOrder);
    if (Number.isNaN(sortOrder)) {
      setFormError(t("errors.sortOrderInvalid"));
      return;
    }

    const options = form.type === "ENUM" ? parseOptions(form.optionsText) : null;
    if (form.type === "ENUM" && (!options || options.length === 0)) {
      setFormError(t("errors.enumOptionsRequired"));
      return;
    }

    setSaving(true);
    try {
      if (form.id) {
        await updateDefinition(form.id, {
          key,
          label,
          type: form.type,
          options,
          unit: form.unit.trim() ? form.unit.trim() : null,
          isRequired: form.isRequired,
          isVisibleInTable: form.isVisibleInTable,
          sortOrder,
        });
      } else {
        await createDefinition({
          categoryId: cleanCategoryId,
          key,
          label,
          type: form.type,
          options,
          unit: form.unit.trim() ? form.unit.trim() : null,
          isRequired: form.isRequired,
          isVisibleInTable: form.isVisibleInTable,
          sortOrder,
        });
      }

      setForm(emptyForm(cleanCategoryId));
      await refresh();
    } catch (err) {
      setFormError(getAxiosErrorMessage(err) ?? tc("errors.generic"));
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteDefinition(deleteTarget.id);
      setDeleteTarget(null);
      setForm(emptyForm(categoryId.trim()));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>{t("title")}</DialogTitle>
            <DialogDescription>{t("subtitle")}</DialogDescription>
          </DialogHeader>

          <DialogBody>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-5">
              <div className="md:col-span-3 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="adm_categoryId">{t("categoryId")}</Label>
                  <div className="flex gap-2">
                    <Input
                      id="adm_categoryId"
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      placeholder={t("categoryIdPlaceholder")}
                      autoComplete="off"
                    />
                    <Button
                      variant="outline"
                      onClick={() => refresh()}
                      disabled={!categoryId.trim() || loading}
                    >
                      {tc("actions.refresh")}
                    </Button>
                  </div>
                  {error ? (
                    <p className="text-sm text-destructive" role="alert">
                      {error}
                    </p>
                  ) : null}
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("fields.key")}</TableHead>
                      <TableHead>{t("fields.label")}</TableHead>
                      <TableHead>{t("fields.type")}</TableHead>
                      <TableHead>{t("fields.visibleInTable")}</TableHead>
                      <TableHead>{t("fields.required")}</TableHead>
                      <TableHead>{t("fields.sortOrder")}</TableHead>
                      <TableHead className="w-[110px]">{tc("labels.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sorted.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7}>
                          <div className="py-10 text-center text-sm text-muted-foreground">
                            {t("empty")}
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : null}

                    {sorted.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="font-mono text-xs">{d.key}</TableCell>
                        <TableCell className="font-medium">{d.label}</TableCell>
                        <TableCell>{t(`types.${d.type}`)}</TableCell>
                        <TableCell>{d.isVisibleInTable ? tc("labels.yes") : tc("labels.no")}</TableCell>
                        <TableCell>{d.isRequired ? tc("labels.yes") : tc("labels.no")}</TableCell>
                        <TableCell>{d.sortOrder}</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setForm(toForm(d))}
                            >
                              {tc("actions.edit")}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={t("actions.delete")}
                              onClick={() => setDeleteTarget(d)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="md:col-span-2">
                <form className="space-y-4 rounded-xl border border-border p-4" onSubmit={onSave}>
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold">
                      {form.id ? t("editor.edit") : t("editor.create")}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setForm(emptyForm(categoryId.trim()))}
                    >
                      <Plus className="h-4 w-4" />
                      {t("editor.new")}
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="def_key">{t("fields.key")}</Label>
                    <Input
                      id="def_key"
                      value={form.key}
                      onChange={(e) => setForm((s) => ({ ...s, key: e.target.value }))}
                      placeholder={t("keyPlaceholder")}
                      autoComplete="off"
                    />
                    <p className="text-xs text-muted-foreground">{t("keyHint")}</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="def_label">{t("fields.label")}</Label>
                    <Input
                      id="def_label"
                      value={form.label}
                      onChange={(e) => setForm((s) => ({ ...s, label: e.target.value }))}
                      autoComplete="off"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="def_type">{t("fields.type")}</Label>
                    <Select
                      id="def_type"
                      value={form.type}
                      onChange={(e) =>
                        setForm((s) => ({
                          ...s,
                          type: e.target.value as ProductAttributeDefinitionType,
                        }))
                      }
                    >
                      <option value="TEXT">{t("types.TEXT")}</option>
                      <option value="NUMBER">{t("types.NUMBER")}</option>
                      <option value="BOOLEAN">{t("types.BOOLEAN")}</option>
                      <option value="DATE">{t("types.DATE")}</option>
                      <option value="ENUM">{t("types.ENUM")}</option>
                    </Select>
                  </div>

                  {form.type === "ENUM" ? (
                    <div className="space-y-2">
                      <Label htmlFor="def_options">{t("fields.options")}</Label>
                      <Textarea
                        id="def_options"
                        value={form.optionsText}
                        onChange={(e) => setForm((s) => ({ ...s, optionsText: e.target.value }))}
                        placeholder={t("optionsPlaceholder")}
                      />
                      <p className="text-xs text-muted-foreground">{t("optionsHint")}</p>
                    </div>
                  ) : null}

                  <div className="space-y-2">
                    <Label htmlFor="def_unit">{t("fields.unit")}</Label>
                    <Input
                      id="def_unit"
                      value={form.unit}
                      onChange={(e) => setForm((s) => ({ ...s, unit: e.target.value }))}
                      placeholder={t("unitPlaceholder")}
                      autoComplete="off"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="def_sortOrder">{t("fields.sortOrder")}</Label>
                    <Input
                      id="def_sortOrder"
                      type="number"
                      value={form.sortOrder}
                      onChange={(e) => setForm((s) => ({ ...s, sortOrder: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-3">
                    <Switch
                      checked={form.isRequired}
                      onChange={(e) => setForm((s) => ({ ...s, isRequired: e.target.checked }))}
                      label={t("fields.required")}
                    />
                    <Switch
                      checked={form.isVisibleInTable}
                      onChange={(e) =>
                        setForm((s) => ({ ...s, isVisibleInTable: e.target.checked }))
                      }
                      label={t("fields.visibleInTable")}
                    />
                  </div>

                  {formError ? (
                    <div
                      className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                      role="alert"
                    >
                      {formError}
                    </div>
                  ) : null}

                  <Button type="submit" disabled={saving || !categoryId.trim()} className="w-full">
                    {saving ? tc("actions.loading") : form.id ? tc("actions.save") : tc("actions.create")}
                  </Button>
                </form>
              </div>
            </div>
          </DialogBody>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {tc("actions.close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title={t("delete.title")}
        description={
          deleteTarget
            ? t("delete.description", { label: deleteTarget.label, key: deleteTarget.key })
            : undefined
        }
        confirmLabel={t("delete.confirm")}
        destructive
        loading={deleting}
        onConfirm={confirmDelete}
      />
    </>
  );
}
