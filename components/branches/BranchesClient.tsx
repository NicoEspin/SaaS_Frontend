"use client";

import { PencilLine, Plus, RefreshCcw, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/products/ConfirmDialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { branchesApi } from "@/lib/branches/api";
import type { BranchRecord } from "@/lib/branches/types";
import { useBranchesList } from "@/lib/branches/hooks/use-branches-list";
import { getAxiosErrorMessage } from "@/lib/products/utils";
import { useAuthStore } from "@/stores/auth-store";

function formatDateTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

type FormMode = "create" | "edit";

type FormState = {
  mode: FormMode;
  open: boolean;
  target: BranchRecord | null;
};

const EMPTY_FORM_STATE: FormState = { mode: "create", open: false, target: null };

export function BranchesClient() {
  const t = useTranslations("Branches");
  const tc = useTranslations("Common");

  const hydrateSession = useAuthStore((s) => s.hydrateSession);

  const [qInput, setQInput] = useState<string>("");
  const [qApplied, setQApplied] = useState<string>("");

  const list = useBranchesList({ limit: 50, q: qApplied });

  const countLabel = useMemo(() => t("table.count", { count: list.items.length }), [list.items.length, t]);

  const [form, setForm] = useState<FormState>(EMPTY_FORM_STATE);
  const [name, setName] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<BranchRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function applyFilters() {
    setQApplied(qInput.trim());
  }

  function resetFilters() {
    setQInput("");
    setQApplied("");
  }

  function openCreate() {
    setFormError(null);
    setNameError(null);
    setName("");
    setForm({ mode: "create", open: true, target: null });
  }

  function openEdit(target: BranchRecord) {
    setFormError(null);
    setNameError(null);
    setName(target.name);
    setForm({ mode: "edit", open: true, target });
  }

  function closeForm() {
    setFormError(null);
    setNameError(null);
    setName("");
    setSaving(false);
    setForm(EMPTY_FORM_STATE);
  }

  function validateName(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return t("validation.nameRequired");
    if (trimmed.length > 200) return t("validation.nameMax", { max: 200 });
    return null;
  }

  async function submitForm() {
    setFormError(null);
    setNameError(null);
    setDeleteError(null);

    const trimmed = name.trim();
    const vErr = validateName(trimmed);
    if (vErr) {
      setNameError(vErr);
      return;
    }

    setSaving(true);
    try {
      if (form.mode === "create") {
        await branchesApi.create({ name: trimmed });
        toast.success(t("success.created"));
      } else {
        const target = form.target;
        if (!target) return;
        const nextName = trimmed;
        if (nextName === target.name) {
          setFormError(t("validation.noChanges"));
          return;
        }
        await branchesApi.update(target.id, { name: nextName });
        toast.success(t("success.updated"));
      }

      await list.refresh();
      await hydrateSession();
      closeForm();
    } catch (err) {
      setFormError(getAxiosErrorMessage(err) ?? tc("errors.generic"));
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleteError(null);
    setDeleting(true);
    try {
      await branchesApi.remove(deleteTarget.id);
      toast.success(t("success.deleted"));
      setDeleteTarget(null);
      await list.refresh();
      await hydrateSession();
    } catch (err) {
      setDeleteError(getAxiosErrorMessage(err) ?? tc("errors.generic"));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-background/60 p-4 backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <form
            className="w-full max-w-xl space-y-2"
            onSubmit={(e) => {
              e.preventDefault();
              applyFilters();
            }}
          >
            <Label htmlFor="branches_q">{t("filters.q")}</Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                id="branches_q"
                value={qInput}
                onChange={(e) => setQInput(e.target.value)}
                placeholder={t("filters.qPlaceholder")}
              />
              <div className="flex items-center gap-2">
                <Button type="submit" variant="outline" disabled={list.loading}>
                  {tc("actions.apply")}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={resetFilters}
                  disabled={list.loading && !qApplied}
                >
                  {tc("actions.reset")}
                </Button>
              </div>
            </div>
          </form>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => void list.refresh()} disabled={list.loading}>
              <RefreshCcw className="h-4 w-4" />
              {list.loading ? tc("actions.loading") : tc("actions.refresh")}
            </Button>
            <Button type="button" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              {t("actions.new")}
            </Button>
          </div>
        </div>
      </div>

      {list.error ? (
        <Alert variant="destructive" className="border-destructive/30 bg-destructive/10">
          <AlertDescription>{list.error}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t("table.title")}</CardTitle>
          <div className="text-xs text-muted-foreground">
            {list.loading ? <Skeleton className="h-4 w-20" /> : countLabel}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("table.columns.name")}</TableHead>
                <TableHead className="hidden lg:table-cell">{t("table.columns.id")}</TableHead>
                <TableHead className="hidden md:table-cell">{t("table.columns.createdAt")}</TableHead>
                <TableHead className="hidden md:table-cell">{t("table.columns.updatedAt")}</TableHead>
                <TableHead className="w-[220px] text-right">{tc("labels.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.loading ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <div className="space-y-2 py-4">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : list.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <div className="py-10 text-center text-sm text-muted-foreground">
                      {t("table.empty")}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                list.items.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{b.name}</TableCell>
                    <TableCell className="hidden font-mono text-xs text-muted-foreground lg:table-cell">
                      {b.id}
                    </TableCell>
                    <TableCell className="hidden text-xs text-muted-foreground md:table-cell">
                      {formatDateTime(b.createdAt)}
                    </TableCell>
                    <TableCell className="hidden text-xs text-muted-foreground md:table-cell">
                      {formatDateTime(b.updatedAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button type="button" variant="outline" size="sm" onClick={() => openEdit(b)}>
                          <PencilLine className="h-4 w-4" />
                          {tc("actions.edit")}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setDeleteError(null);
                            setDeleteTarget(b);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                          {t("actions.delete")}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {list.nextCursor ? t("pagination.moreAvailable") : t("pagination.end")}
            </div>
            <Button variant="outline" onClick={() => void list.loadMore()} disabled={!list.canLoadMore}>
              {list.loadingMore ? tc("actions.loading") : t("pagination.loadMore")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={form.open}
        onOpenChange={(open) => {
          if (!open) closeForm();
          else setForm((s) => ({ ...s, open }));
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {form.mode === "create" ? t("form.createTitle") : t("form.editTitle")}
            </DialogTitle>
            <DialogDescription>
              {form.mode === "create" ? t("form.createSubtitle") : t("form.editSubtitle")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="branch_name">{t("form.fields.name")}</Label>
              <Input
                id="branch_name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (nameError) setNameError(null);
                }}
                placeholder={t("form.fields.namePlaceholder")}
                autoComplete="off"
              />
              {nameError ? <div className="text-sm text-destructive">{nameError}</div> : null}
            </div>

            {form.mode === "edit" && form.target ? (
              <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                <div className="font-mono">{form.target.id}</div>
              </div>
            ) : null}

            {formError ? (
              <Alert variant="destructive" className="border-destructive/30 bg-destructive/10">
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            ) : null}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeForm} disabled={saving}>
              {tc("actions.cancel")}
            </Button>
            <Button type="button" onClick={() => void submitForm()} disabled={saving}>
              {saving ? tc("actions.loading") : form.mode === "create" ? tc("actions.create") : tc("actions.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title={t("delete.title")}
        description={deleteTarget ? t("delete.description", { name: deleteTarget.name }) : undefined}
        confirmLabel={t("delete.confirm")}
        destructive
        loading={deleting}
        onConfirm={() => void confirmDelete()}
      />

      {deleteError ? (
        <Alert variant="destructive" className="border-destructive/30 bg-destructive/10">
          <AlertDescription>{deleteError}</AlertDescription>
        </Alert>
      ) : null}
    </section>
  );
}
