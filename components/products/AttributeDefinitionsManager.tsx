"use client";

import { Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { ConfirmDialog } from "@/components/products/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { isValidAttributeKey } from "@/lib/validators";
import { categoriesApi } from "@/lib/categories/api";
import { useCategories } from "@/lib/categories/hooks/use-categories";
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

type DraftAttribute = {
  id: string;
  key: string;
  label: string;
  type: ProductAttributeDefinitionType;
  options: string[] | null;
  unit: string | null;
  isRequired: boolean;
  isVisibleInTable: boolean;
  sortOrder: number;
};

type DraftFormState = {
  id: string | null;
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

function emptyDraftForm(): DraftFormState {
  return {
    id: null,
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

function toDraftForm(d: DraftAttribute): DraftFormState {
  return {
    id: d.id,
    key: d.key,
    label: d.label,
    type: d.type,
    optionsText: (d.options ?? []).join("\n"),
    unit: d.unit ?? "",
    isRequired: d.isRequired,
    isVisibleInTable: d.isVisibleInTable,
    sortOrder: String(d.sortOrder),
  };
}

function createLocalId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function AttributeDefinitionsManager({ open, onOpenChange }: Props) {
  const t = useTranslations("Attributes");
  const tc = useTranslations("Common");

  const [view, setView] = useState<"manage" | "createCategory">("manage");

  const [categoryQueryInput, setCategoryQueryInput] = useState("");
  const [categoryQuery, setCategoryQuery] = useState("");

  const categories = useCategories({ limit: 100, q: categoryQuery, enabled: open });

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const selectedCategory = useMemo(
    () => categories.items.find((c) => c.id === selectedCategoryId) ?? null,
    [categories.items, selectedCategoryId]
  );

  const [newCategoryName, setNewCategoryName] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);

  const [categoryNameDraft, setCategoryNameDraft] = useState("");
  const [updatingCategory, setUpdatingCategory] = useState(false);

  const [categoryError, setCategoryError] = useState<string | null>(null);

  const [deleteCategoryTargetId, setDeleteCategoryTargetId] = useState<string | null>(null);
  const [deletingCategory, setDeletingCategory] = useState(false);

  const [drafts, setDrafts] = useState<DraftAttribute[]>([]);
  const [draftForm, setDraftForm] = useState<DraftFormState>(emptyDraftForm());
  const [draftError, setDraftError] = useState<string | null>(null);

  const {
    items,
    loading,
    error,
    refresh,
    createDefinition,
    updateDefinition,
    deleteDefinition,
  } = useAttributeDefinitions(selectedCategoryId);

  const [form, setForm] = useState<FormState>(emptyForm(""));
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<ProductAttributeDefinition | null>(null);
  const [deleting, setDeleting] = useState(false);

  const sorted = useMemo(
    () => items.slice().sort((a, b) => a.sortOrder - b.sortOrder),
    [items]
  );

  const sortedDrafts = useMemo(
    () => drafts.slice().sort((a, b) => a.sortOrder - b.sortOrder),
    [drafts]
  );

  useEffect(() => {
    if (!open) return;
    setCategoryError(null);
    setDraftError(null);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (selectedCategoryId) return;
    if (categories.items.length === 0) return;
    setSelectedCategoryId(categories.items[0]?.id ?? null);
  }, [categories.items, open, selectedCategoryId]);

  useEffect(() => {
    if (!open) return;
    if (!selectedCategory) {
      setCategoryNameDraft("");
      return;
    }
    setCategoryNameDraft(selectedCategory.name);
  }, [open, selectedCategory]);

  useEffect(() => {
    if (!open) return;
    setForm(emptyForm(selectedCategoryId ?? ""));
    setFormError(null);
  }, [open, selectedCategoryId]);

  function openCreateCategory() {
    setCategoryError(null);
    setDraftError(null);
    setView("createCategory");
    setNewCategoryName("");
    setDrafts([]);
    setDraftForm(emptyDraftForm());
  }

  function cancelCreateCategory() {
    setCategoryError(null);
    setDraftError(null);
    setView("manage");
    setNewCategoryName("");
    setDrafts([]);
    setDraftForm(emptyDraftForm());
  }

  function upsertDraftFromForm() {
    setDraftError(null);

    const keyRaw = draftForm.key.trim().toLowerCase();
    if (!keyRaw || !isValidAttributeKey(keyRaw)) {
      setDraftError(t("errors.invalidKey"));
      return;
    }

    const label = draftForm.label.trim();
    if (!label) {
      setDraftError(t("errors.labelRequired"));
      return;
    }

    const sortOrder = Number(draftForm.sortOrder);
    if (Number.isNaN(sortOrder)) {
      setDraftError(t("errors.sortOrderInvalid"));
      return;
    }

    const options = draftForm.type === "ENUM" ? parseOptions(draftForm.optionsText) : null;
    if (draftForm.type === "ENUM" && (!options || options.length === 0)) {
      setDraftError(t("errors.enumOptionsRequired"));
      return;
    }

    setDrafts((prev) => {
      const nextId = draftForm.id ?? createLocalId("draft");
      const duplicate = prev.some(
        (d) => d.key === keyRaw && d.id !== nextId
      );
      if (duplicate) {
        setDraftError(t("categories.createPanel.errors.duplicateKey", { key: keyRaw }));
        return prev;
      }

      const next: DraftAttribute = {
        id: nextId,
        key: keyRaw,
        label,
        type: draftForm.type,
        options,
        unit: draftForm.unit.trim() ? draftForm.unit.trim() : null,
        isRequired: draftForm.isRequired,
        isVisibleInTable: draftForm.isVisibleInTable,
        sortOrder,
      };

      const replaced = prev.some((d) => d.id === nextId)
        ? prev.map((d) => (d.id === nextId ? next : d))
        : [...prev, next];

      return replaced.sort((a, b) => a.sortOrder - b.sortOrder);
    });

    setDraftForm(emptyDraftForm());
  }

  function removeDraft(id: string) {
    setDrafts((prev) => prev.filter((d) => d.id !== id));
    setDraftError(null);
    if (draftForm.id === id) setDraftForm(emptyDraftForm());
  }

  async function onCreateCategoryWithDrafts() {
    setCategoryError(null);
    setDraftError(null);

    const name = newCategoryName.trim();
    if (!name) {
      setCategoryError(t("categories.createPanel.errors.nameRequired"));
      return;
    }

    setCreatingCategory(true);
    try {
      const created = await categoriesApi.create({
        name,
        attributeDefinitions: drafts.map((d) => ({
          key: d.key,
          label: d.label,
          type: d.type,
          options: d.options ?? undefined,
          unit: d.unit,
          isRequired: d.isRequired,
          isVisibleInTable: d.isVisibleInTable,
          sortOrder: d.sortOrder,
        })),
      });

      setCategoryQueryInput("");
      setCategoryQuery("");
      setNewCategoryName("");
      setDrafts([]);
      setDraftForm(emptyDraftForm());
      setView("manage");

      await categories.refresh();
      setSelectedCategoryId(created.id);
    } catch (err) {
      setCategoryError(getAxiosErrorMessage(err) ?? tc("errors.generic"));
    } finally {
      setCreatingCategory(false);
    }
  }

  async function onUpdateCategoryName() {
    if (!selectedCategory) return;
    setCategoryError(null);
    const name = categoryNameDraft.trim();
    if (!name) return;

    setUpdatingCategory(true);
    try {
      await categoriesApi.update(selectedCategory.id, { name });
      await categories.refresh();
    } catch (err) {
      setCategoryError(getAxiosErrorMessage(err) ?? tc("errors.generic"));
    } finally {
      setUpdatingCategory(false);
    }
  }

  async function confirmDeleteCategory() {
    if (!deleteCategoryTargetId) return;
    setCategoryError(null);
    setDeletingCategory(true);
    try {
      await categoriesApi.remove(deleteCategoryTargetId);
      setDeleteCategoryTargetId(null);
      await categories.refresh();
      if (selectedCategoryId === deleteCategoryTargetId) {
        setSelectedCategoryId(null);
      }
    } catch (err) {
      setCategoryError(getAxiosErrorMessage(err) ?? tc("errors.generic"));
    } finally {
      setDeletingCategory(false);
    }
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const cleanCategoryId = selectedCategoryId?.trim() ? selectedCategoryId.trim() : "";
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
      setForm(emptyForm(selectedCategoryId ?? ""));
    } finally {
      setDeleting(false);
    }
  }

  const categoriesPanel = (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>{t("categories.title")}</CardTitle>
        <CardDescription>{t("categories.subtitle")}</CardDescription>
        <CardAction className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void categories.refresh()}
            disabled={categories.loading}
          >
            {categories.loading ? tc("actions.loading") : tc("actions.refresh")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void categories.loadMore()}
            disabled={!categories.canLoadMore}
          >
            {categories.loadingMore ? tc("actions.loading") : t("categories.actions.loadMore")}
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="adm_categoryQuery">{t("categories.search")}</Label>
          <div className="flex gap-2">
            <Input
              id="adm_categoryQuery"
              value={categoryQueryInput}
              onChange={(e) => setCategoryQueryInput(e.target.value)}
              placeholder={t("categories.searchPlaceholder")}
              autoComplete="off"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => setCategoryQuery(categoryQueryInput)}
              disabled={categories.loading}
            >
              {tc("actions.apply")}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="adm_categorySelect">{t("categories.select")}</Label>
          <Select
            value={selectedCategoryId ?? undefined}
            onValueChange={(value) => {
              setSelectedCategoryId(value);
              setView("manage");
              setDraftError(null);
              setCategoryError(null);
            }}
          >
            <SelectTrigger id="adm_categorySelect" className="w-full">
              <SelectValue placeholder={t("categories.selectPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              {categories.items.length === 0 ? (
                <SelectItem value="__empty__" disabled>
                  {t("categories.empty")}
                </SelectItem>
              ) : null}

              {categories.items
                .slice()
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <span className="flex w-full items-center justify-between gap-2">
                      <span className="truncate">{c.name}</span>
                      <span className="font-mono text-xs text-muted-foreground">{c.id.slice(0, 6)}</span>
                    </span>
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          {!selectedCategory ? (
            <div className="text-xs text-muted-foreground">{t("categories.noneSelected")}</div>
          ) : (
            <div className="text-xs text-muted-foreground">
              <span className="font-mono">{selectedCategory.id}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]">
          <Button type="button" onClick={openCreateCategory} disabled={creatingCategory}>
            <Plus className="h-4 w-4" />
            {t("categories.actions.new")}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setView("manage");
              setSelectedCategoryId(null);
            }}
          >
            {t("categories.actions.clear")}
          </Button>
        </div>

        <div className="space-y-2">
          <Label htmlFor="adm_categoryName">{t("categories.edit")}</Label>
          <div className="flex flex-wrap gap-2">
            <Input
              id="adm_categoryName"
              value={categoryNameDraft}
              onChange={(e) => setCategoryNameDraft(e.target.value)}
              placeholder={t("categories.editPlaceholder")}
              autoComplete="off"
              disabled={!selectedCategory}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => void onUpdateCategoryName()}
              disabled={
                updatingCategory ||
                !selectedCategory ||
                !categoryNameDraft.trim() ||
                categoryNameDraft.trim() === selectedCategory.name
              }
            >
              {updatingCategory ? tc("actions.loading") : tc("actions.save")}
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={t("categories.actions.delete")}
                  onClick={() =>
                    selectedCategory ? setDeleteCategoryTargetId(selectedCategory.id) : null
                  }
                  disabled={!selectedCategory}
                  className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">{t("categories.actions.delete")}</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {categories.error || categoryError ? (
          <Alert variant="destructive" className="border-destructive/30 bg-destructive/10">
            <AlertDescription>{categories.error ?? categoryError}</AlertDescription>
          </Alert>
        ) : null}
      </CardContent>
    </Card>
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-h-[90vh] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-6xl">
          <div className="border-b border-border px-4 py-4 pr-12 sm:px-6 sm:py-5">
            <DialogHeader className="gap-1">
              <DialogTitle>{t("title")}</DialogTitle>
              <DialogDescription>{t("subtitle")}</DialogDescription>
            </DialogHeader>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
            {view === "createCategory" ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-5">
                <div className="space-y-6 md:col-span-2">{categoriesPanel}</div>
                <div className="md:col-span-3">
                  <Card>
                    <CardHeader className="border-b">
                      <CardTitle>{t("categories.createPanel.title")}</CardTitle>
                      <CardDescription>{t("categories.createPanel.subtitle")}</CardDescription>
                      <CardAction className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={cancelCreateCategory}
                          disabled={creatingCategory}
                        >
                          {tc("actions.cancel")}
                        </Button>
                        <Button
                          type="button"
                          onClick={() => void onCreateCategoryWithDrafts()}
                          disabled={creatingCategory}
                        >
                          {creatingCategory ? tc("actions.loading") : tc("actions.create")}
                        </Button>
                      </CardAction>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-2 sm:col-span-2">
                          <Label htmlFor="cat_create_name">{t("categories.createPanel.name")}</Label>
                          <Input
                            id="cat_create_name"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            placeholder={t("categories.createPlaceholder")}
                            autoComplete="off"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-end justify-between gap-2">
                          <div>
                            <div className="text-sm font-semibold">{t("categories.createPanel.attributesTitle")}</div>
                            <div className="text-xs text-muted-foreground">{t("categories.createPanel.attributesSubtitle")}</div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {t("categories.createPanel.attributesCount", { count: drafts.length })}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
                          <div className="xl:col-span-3">
                            <div className="rounded-xl border border-border">
                              <div className="max-h-[40vh] overflow-auto">
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
                                    {sortedDrafts.length === 0 ? (
                                      <TableRow>
                                        <TableCell colSpan={7}>
                                          <div className="py-10 text-center text-sm text-muted-foreground">
                                            {t("categories.createPanel.attributesEmpty")}
                                          </div>
                                        </TableCell>
                                      </TableRow>
                                    ) : null}

                                    {sortedDrafts.map((d) => (
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
                                              type="button"
                                              variant="outline"
                                              size="sm"
                                              onClick={() => {
                                                setDraftError(null);
                                                setDraftForm(toDraftForm(d));
                                              }}
                                            >
                                              {tc("actions.edit")}
                                            </Button>
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <Button
                                                  type="button"
                                                  variant="ghost"
                                                  size="icon"
                                                  aria-label={t("actions.delete")}
                                                  onClick={() => removeDraft(d.id)}
                                                  className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                                >
                                                  <Trash2 className="h-4 w-4" />
                                                </Button>
                                              </TooltipTrigger>
                                              <TooltipContent side="top">
                                                {t("actions.delete")}
                                              </TooltipContent>
                                            </Tooltip>
                                          </div>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            </div>
                          </div>

                          <div className="xl:col-span-2">
                            <form
                              className="space-y-4 rounded-xl border border-border p-4"
                              onSubmit={(e) => {
                                e.preventDefault();
                                upsertDraftFromForm();
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <div className="text-sm font-semibold">
                                  {draftForm.id
                                    ? t("categories.createPanel.editor.edit")
                                    : t("categories.createPanel.editor.create")}
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setDraftError(null);
                                    setDraftForm(emptyDraftForm());
                                  }}
                                >
                                  <Plus className="h-4 w-4" />
                                  {t("categories.createPanel.editor.new")}
                                </Button>
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="draft_key">{t("fields.key")}</Label>
                                <Input
                                  id="draft_key"
                                  value={draftForm.key}
                                  onChange={(e) =>
                                    setDraftForm((s) => ({ ...s, key: e.target.value }))
                                  }
                                  placeholder={t("keyPlaceholder")}
                                  autoComplete="off"
                                />
                                <p className="text-xs text-muted-foreground">{t("keyHint")}</p>
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="draft_label">{t("fields.label")}</Label>
                                <Input
                                  id="draft_label"
                                  value={draftForm.label}
                                  onChange={(e) =>
                                    setDraftForm((s) => ({ ...s, label: e.target.value }))
                                  }
                                  autoComplete="off"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="draft_type">{t("fields.type")}</Label>
                                <Select
                                  value={draftForm.type}
                                  onValueChange={(value) =>
                                    setDraftForm((s) => ({
                                      ...s,
                                      type: value as ProductAttributeDefinitionType,
                                    }))
                                  }
                                >
                                  <SelectTrigger id="draft_type" className="w-full">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="TEXT">{t("types.TEXT")}</SelectItem>
                                    <SelectItem value="NUMBER">{t("types.NUMBER")}</SelectItem>
                                    <SelectItem value="BOOLEAN">{t("types.BOOLEAN")}</SelectItem>
                                    <SelectItem value="DATE">{t("types.DATE")}</SelectItem>
                                    <SelectItem value="ENUM">{t("types.ENUM")}</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              {draftForm.type === "ENUM" ? (
                                <div className="space-y-2">
                                  <Label htmlFor="draft_options">{t("fields.options")}</Label>
                                  <Textarea
                                    id="draft_options"
                                    value={draftForm.optionsText}
                                    onChange={(e) =>
                                      setDraftForm((s) => ({
                                        ...s,
                                        optionsText: e.target.value,
                                      }))
                                    }
                                    placeholder={t("optionsPlaceholder")}
                                  />
                                  <p className="text-xs text-muted-foreground">{t("optionsHint")}</p>
                                </div>
                              ) : null}

                              <div className="space-y-2">
                                <Label htmlFor="draft_unit">{t("fields.unit")}</Label>
                                <Input
                                  id="draft_unit"
                                  value={draftForm.unit}
                                  onChange={(e) =>
                                    setDraftForm((s) => ({ ...s, unit: e.target.value }))
                                  }
                                  placeholder={t("unitPlaceholder")}
                                  autoComplete="off"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="draft_sortOrder">{t("fields.sortOrder")}</Label>
                                <Input
                                  id="draft_sortOrder"
                                  type="number"
                                  value={draftForm.sortOrder}
                                  onChange={(e) =>
                                    setDraftForm((s) => ({ ...s, sortOrder: e.target.value }))
                                  }
                                />
                              </div>

                              <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                  <Switch
                                    id="draft_isRequired"
                                    checked={draftForm.isRequired}
                                    onCheckedChange={(checked) =>
                                      setDraftForm((s) => ({ ...s, isRequired: checked }))
                                    }
                                  />
                                  <Label htmlFor="draft_isRequired">{t("fields.required")}</Label>
                                </div>

                                <div className="flex items-center gap-2">
                                  <Switch
                                    id="draft_isVisibleInTable"
                                    checked={draftForm.isVisibleInTable}
                                    onCheckedChange={(checked) =>
                                      setDraftForm((s) => ({
                                        ...s,
                                        isVisibleInTable: checked,
                                      }))
                                    }
                                  />
                                  <Label htmlFor="draft_isVisibleInTable">{t("fields.visibleInTable")}</Label>
                                </div>
                              </div>

                              {draftError ? (
                                <Alert
                                  variant="destructive"
                                  className="border-destructive/30 bg-destructive/10"
                                >
                                  <AlertDescription>{draftError}</AlertDescription>
                                </Alert>
                              ) : null}

                              <Button type="submit" className="w-full">
                                {draftForm.id ? tc("actions.save") : t("categories.createPanel.actions.addAttribute")}
                              </Button>
                            </form>
                          </div>
                        </div>
                      </div>

                      {categoryError ? (
                        <Alert variant="destructive" className="border-destructive/30 bg-destructive/10">
                          <AlertDescription>{categoryError}</AlertDescription>
                        </Alert>
                      ) : null}
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-5">
                  <div className="space-y-6 md:col-span-2">{categoriesPanel}</div>
                  <div className="md:col-span-3">
                    <Card>
                      <CardHeader className="border-b">
                        <CardTitle>
                          {form.id ? t("editor.edit") : t("editor.create")}
                        </CardTitle>
                        <CardDescription>
                          {selectedCategory
                            ? t("definitions.forCategory", { name: selectedCategory.name })
                            : t("definitions.noCategory")}
                        </CardDescription>
                        <CardAction>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setForm(emptyForm(selectedCategoryId ?? ""))}
                            disabled={!selectedCategoryId}
                          >
                            <Plus className="h-4 w-4" />
                            {t("editor.new")}
                          </Button>
                        </CardAction>
                      </CardHeader>

                      <CardContent>
                        <form className="space-y-4" onSubmit={onSave}>
                            <div className="space-y-2">
                              <Label htmlFor="def_key">{t("fields.key")}</Label>
                              <Input
                                id="def_key"
                                value={form.key}
                                onChange={(e) => setForm((s) => ({ ...s, key: e.target.value }))}
                                placeholder={t("keyPlaceholder")}
                                autoComplete="off"
                                disabled={!selectedCategoryId}
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
                                disabled={!selectedCategoryId}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="def_type">{t("fields.type")}</Label>
                              <Select
                                value={form.type}
                                onValueChange={(value) =>
                                  setForm((s) => ({
                                    ...s,
                                    type: value as ProductAttributeDefinitionType,
                                  }))
                                }
                                disabled={!selectedCategoryId}
                              >
                                <SelectTrigger id="def_type" className="w-full">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="TEXT">{t("types.TEXT")}</SelectItem>
                                  <SelectItem value="NUMBER">{t("types.NUMBER")}</SelectItem>
                                  <SelectItem value="BOOLEAN">{t("types.BOOLEAN")}</SelectItem>
                                  <SelectItem value="DATE">{t("types.DATE")}</SelectItem>
                                  <SelectItem value="ENUM">{t("types.ENUM")}</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {form.type === "ENUM" ? (
                              <div className="space-y-2">
                                <Label htmlFor="def_options">{t("fields.options")}</Label>
                                <Textarea
                                  id="def_options"
                                  value={form.optionsText}
                                  onChange={(e) =>
                                    setForm((s) => ({ ...s, optionsText: e.target.value }))
                                  }
                                  placeholder={t("optionsPlaceholder")}
                                  disabled={!selectedCategoryId}
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
                                disabled={!selectedCategoryId}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="def_sortOrder">{t("fields.sortOrder")}</Label>
                              <Input
                                id="def_sortOrder"
                                type="number"
                                value={form.sortOrder}
                                onChange={(e) =>
                                  setForm((s) => ({ ...s, sortOrder: e.target.value }))
                                }
                                disabled={!selectedCategoryId}
                              />
                            </div>

                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <Switch
                                  id="def_isRequired"
                                  checked={form.isRequired}
                                  onCheckedChange={(checked) =>
                                    setForm((s) => ({ ...s, isRequired: checked }))
                                  }
                                  disabled={!selectedCategoryId}
                                />
                                <Label htmlFor="def_isRequired">{t("fields.required")}</Label>
                              </div>

                              <div className="flex items-center gap-2">
                                <Switch
                                  id="def_isVisibleInTable"
                                  checked={form.isVisibleInTable}
                                  onCheckedChange={(checked) =>
                                    setForm((s) => ({ ...s, isVisibleInTable: checked }))
                                  }
                                  disabled={!selectedCategoryId}
                                />
                                <Label htmlFor="def_isVisibleInTable">{t("fields.visibleInTable")}</Label>
                              </div>
                            </div>

                            {!selectedCategoryId ? (
                              <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
                                {t("definitions.noCategoryEmpty")}
                              </div>
                            ) : null}

                            {formError ? (
                              <Alert variant="destructive" className="border-destructive/30 bg-destructive/10">
                                <AlertDescription>{formError}</AlertDescription>
                              </Alert>
                            ) : null}

                            <Button
                              type="submit"
                              disabled={saving || !selectedCategoryId}
                              className="w-full"
                            >
                              {saving
                                ? tc("actions.loading")
                                : form.id
                                  ? tc("actions.save")
                                  : tc("actions.create")}
                            </Button>
                          </form>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <Card>
                  <CardHeader className="border-b">
                    <CardTitle>{t("definitions.title")}</CardTitle>
                    <CardDescription>
                      {selectedCategory
                        ? t("definitions.forCategory", { name: selectedCategory.name })
                        : t("definitions.noCategory")}
                    </CardDescription>
                    <CardAction>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => refresh()}
                        disabled={!selectedCategoryId || loading}
                      >
                        {loading ? tc("actions.loading") : tc("actions.refresh")}
                      </Button>
                    </CardAction>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {error ? (
                      <Alert variant="destructive" className="border-destructive/30 bg-destructive/10">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    ) : null}

                    <div className="rounded-xl border border-border">
                      <div className="max-h-[55vh] overflow-auto">
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
                                    {selectedCategory ? t("empty") : t("definitions.noCategoryEmpty")}
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
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          aria-label={t("actions.delete")}
                                          onClick={() => setDeleteTarget(d)}
                                          className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent side="top">{t("actions.delete")}</TooltipContent>
                                    </Tooltip>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          <DialogFooter className="border-t border-border bg-background/80 px-4 py-4 backdrop-blur sm:px-6">
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

      <ConfirmDialog
        open={Boolean(deleteCategoryTargetId)}
        onOpenChange={(v) => !v && setDeleteCategoryTargetId(null)}
        title={t("categories.delete.title")}
        description={
          deleteCategoryTargetId
            ? t("categories.delete.description", {
                id: deleteCategoryTargetId,
                name:
                  categories.items.find((c) => c.id === deleteCategoryTargetId)?.name ??
                  deleteCategoryTargetId,
              })
            : undefined
        }
        confirmLabel={t("categories.delete.confirm")}
        destructive
        loading={deletingCategory}
        onConfirm={confirmDeleteCategory}
      />
    </>
  );
}
