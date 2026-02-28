"use client";

import { Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { categoriesApi } from "@/lib/categories/api";
import type { Category } from "@/lib/categories/types";
import type { ProductAttributeDefinitionType } from "@/lib/products/types";
import { getAxiosErrorMessage } from "@/lib/products/utils";
import { isValidAttributeKey } from "@/lib/validators";

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

type Props = {
  onCancel: () => void;
  onCreated: (category: Category) => void | Promise<void>;
};

const ATTRIBUTE_TYPES: ProductAttributeDefinitionType[] = [
  "TEXT",
  "NUMBER",
  "BOOLEAN",
  "DATE",
  "ENUM",
];

function parseOptions(text: string): string[] {
  const raw = text
    .split(/\r?\n|,/g)
    .map((s) => s.trim())
    .filter(Boolean);
  return Array.from(new Set(raw));
}

function suggestKeyFromLabel(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 64);
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

export function CategoryCreatePanel({ onCancel, onCreated }: Props) {
  const t = useTranslations("Attributes");
  const tc = useTranslations("Common");

  const [newCategoryName, setNewCategoryName] = useState("");
  const [draftQuery, setDraftQuery] = useState("");
  const [drafts, setDrafts] = useState<DraftAttribute[]>([]);
  const [draftForm, setDraftForm] = useState<DraftFormState>(emptyDraftForm());

  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [creatingCategory, setCreatingCategory] = useState(false);

  const sortedDrafts = useMemo(
    () => drafts.slice().sort((a, b) => a.sortOrder - b.sortOrder),
    [drafts]
  );

  const filteredDrafts = useMemo(() => {
    const q = draftQuery.trim().toLowerCase();
    if (!q) return sortedDrafts;
    return sortedDrafts.filter((d) => {
      const label = d.label.toLowerCase();
      const key = d.key.toLowerCase();
      return label.includes(q) || key.includes(q);
    });
  }, [draftQuery, sortedDrafts]);

  const enumPreview = (text: string) => {
    const opts = parseOptions(text);
    if (opts.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-1">
        {opts.slice(0, 12).map((o) => (
          <span
            key={o}
            className="rounded-md border border-border bg-muted/40 px-2 py-0.5 text-xs text-muted-foreground"
          >
            {o}
          </span>
        ))}
        {opts.length > 12 ? (
          <span className="text-xs text-muted-foreground">+{opts.length - 12}</span>
        ) : null}
      </div>
    );
  };

  function resetPanel() {
    setNewCategoryName("");
    setDraftQuery("");
    setDrafts([]);
    setDraftForm(emptyDraftForm());
    setCategoryError(null);
    setDraftError(null);
  }

  function cancel() {
    if (creatingCategory) return;
    resetPanel();
    onCancel();
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
      const duplicate = prev.some((d) => d.key === keyRaw && d.id !== nextId);
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

      await onCreated(created);
      resetPanel();
      onCancel();
    } catch (err) {
      setCategoryError(getAxiosErrorMessage(err) ?? tc("errors.generic"));
    } finally {
      setCreatingCategory(false);
    }
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>{t("categories.createPanel.title")}</CardTitle>
        <CardDescription>{t("categories.createPanel.subtitle")}</CardDescription>
        <CardAction className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={cancel} disabled={creatingCategory}>
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
        <div className="space-y-2">
          <Label htmlFor="cat_create_name">{t("categories.createPanel.name")}</Label>
          <Input
            id="cat_create_name"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder={t("categories.createPlaceholder")}
            autoComplete="off"
          />
        </div>

        <Card className="border-border">
          <CardHeader className="border-b">
            <CardTitle>{t("categories.createPanel.attributesTitle")}</CardTitle>
            <CardDescription>{t("categories.createPanel.attributesSubtitle")}</CardDescription>
            <CardAction className="flex items-center gap-2">
              <div className="text-xs text-muted-foreground">
                {t("categories.createPanel.attributesCount", { count: drafts.length })}
              </div>
            </CardAction>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
              <div className="space-y-3 xl:col-span-3">
                <div className="space-y-2">
                  <Label htmlFor="draft_search">{t("categories.search")}</Label>
                  <Input
                    id="draft_search"
                    value={draftQuery}
                    onChange={(e) => setDraftQuery(e.target.value)}
                    placeholder={t("categories.searchPlaceholder")}
                    autoComplete="off"
                  />
                </div>

                <div className="rounded-xl border border-border">
                  <div className="max-h-[45vh] overflow-auto">
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
                        {filteredDrafts.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7}>
                              <div className="py-10 text-center text-sm text-muted-foreground">
                                {drafts.length === 0
                                  ? t("categories.createPanel.attributesEmpty")
                                  : t("empty")}
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : null}

                        {filteredDrafts.map((d) => {
                          const isSelected = draftForm.id === d.id;
                          return (
                            <TableRow
                              key={d.id}
                              className={
                                isSelected
                                  ? "bg-muted/50"
                                  : "hover:bg-muted/50 transition-colors"
                              }
                            >
                              <TableCell className="font-mono text-xs">{d.key}</TableCell>
                              <TableCell className="font-medium">{d.label}</TableCell>
                              <TableCell>{t(`types.${d.type}`)}</TableCell>
                              <TableCell>
                                {d.isVisibleInTable ? tc("labels.yes") : tc("labels.no")}
                              </TableCell>
                              <TableCell>
                                {d.isRequired ? tc("labels.yes") : tc("labels.no")}
                              </TableCell>
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
                                    <TooltipContent side="top">{t("actions.delete")}</TooltipContent>
                                  </Tooltip>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
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
                        setDraftForm((s) => ({
                          ...s,
                          key: e.target.value,
                        }))
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
                        setDraftForm((s) => {
                          const nextLabel = e.target.value;
                          const shouldAutoKey = !s.id && !s.key.trim();
                          return {
                            ...s,
                            label: nextLabel,
                            key: shouldAutoKey ? suggestKeyFromLabel(nextLabel) : s.key,
                          };
                        })
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
                      <SelectTrigger id="draft_type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ATTRIBUTE_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {t(`types.${type}`)}
                          </SelectItem>
                        ))}
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
                      {enumPreview(draftForm.optionsText)}
                    </div>
                  ) : null}

                  <div className="space-y-2">
                    <Label htmlFor="draft_unit">{t("fields.unit")}</Label>
                    <Input
                      id="draft_unit"
                      value={draftForm.unit}
                      onChange={(e) =>
                        setDraftForm((s) => ({
                          ...s,
                          unit: e.target.value,
                        }))
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
                        setDraftForm((s) => ({
                          ...s,
                          sortOrder: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Switch
                        id="draft_isRequired"
                        checked={draftForm.isRequired}
                        onCheckedChange={(checked) =>
                          setDraftForm((s) => ({
                            ...s,
                            isRequired: checked,
                          }))
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
                      <Label htmlFor="draft_isVisibleInTable">
                        {t("fields.visibleInTable")}
                      </Label>
                    </div>
                  </div>

                  {draftError ? (
                    <Alert variant="destructive" className="border-destructive/30 bg-destructive/10">
                      <AlertDescription>{draftError}</AlertDescription>
                    </Alert>
                  ) : null}

                  <Button type="submit" className="w-full">
                    {draftForm.id
                      ? tc("actions.save")
                      : t("categories.createPanel.actions.addAttribute")}
                  </Button>
                </form>
              </div>
            </div>

            {categoryError ? (
              <Alert variant="destructive" className="border-destructive/30 bg-destructive/10">
                <AlertDescription>{categoryError}</AlertDescription>
              </Alert>
            ) : null}
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}
