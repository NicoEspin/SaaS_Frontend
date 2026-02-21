"use client";

import axios from "axios";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
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
import { useImportConfirm, useImportPreview } from "@/lib/products/hooks/use-import-products";
import type { ImportProductsMode } from "@/lib/products/types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported: () => void;
};

export function ImportProductsDialog({ open, onOpenChange, onImported }: Props) {
  const t = useTranslations("ImportExport");
  const tc = useTranslations("Common");

  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<ImportProductsMode>("upsert");

  const previewHook = useImportPreview();
  const confirmHook = useImportConfirm();

  const previewId = previewHook.preview?.previewId ?? null;

  const canPreview = Boolean(file) && !previewHook.loading;
  const canConfirm = Boolean(previewId) && !confirmHook.loading;

  const summary = previewHook.preview?.summary ?? null;
  const errors = previewHook.preview?.errors ?? [];
  const sampleRows = useMemo(() => {
    const rows = previewHook.preview?.rows ?? [];
    return rows.slice(0, 10);
  }, [previewHook.preview?.rows]);

  async function runPreview() {
    if (!file) return;
    confirmHook.setResult(null);
    try {
      await previewHook.runPreview(file, mode);
    } catch {
      // error shown in UI
    }
  }

  async function runConfirm() {
    if (!previewId) return;
    try {
      await confirmHook.confirm(previewId);
      onImported();
    } catch (err) {
      const status = axios.isAxiosError(err) ? err.response?.status ?? null : null;
      if (status === 404) {
        previewHook.setPreview(null);
      }
      // error shown in UI
    }
  }

  const fatalError = previewHook.error ?? confirmHook.error ?? null;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) {
          setFile(null);
          setMode("upsert");
          previewHook.setPreview(null);
          confirmHook.setResult(null);
        }
      }}
    >
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>{t("import.title")}</DialogTitle>
          <DialogDescription>{t("import.subtitle")}</DialogDescription>
        </DialogHeader>

        <DialogBody>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="import_file">{t("import.file")}</Label>
                <Input
                  id="import_file"
                  type="file"
                  accept=".csv,.xlsx"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    setFile(f);
                  }}
                />
                <p className="text-xs text-muted-foreground">{t("import.fileHint")}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="import_mode">{t("import.mode")}</Label>
                <Select
                  id="import_mode"
                  value={mode}
                  onChange={(e) => setMode(e.target.value as ImportProductsMode)}
                >
                  <option value="create">{t("import.modes.create")}</option>
                  <option value="update">{t("import.modes.update")}</option>
                  <option value="upsert">{t("import.modes.upsert")}</option>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" disabled={!canPreview} onClick={runPreview}>
                  {previewHook.loading ? tc("actions.loading") : t("import.preview")}
                </Button>
                <Button disabled={!canConfirm} onClick={runConfirm}>
                  {confirmHook.loading ? tc("actions.loading") : t("import.confirm")}
                </Button>
              </div>

              {fatalError ? (
                <div
                  className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                  role="alert"
                >
                  {fatalError}
                </div>
              ) : null}

              {confirmHook.result ? (
                <div className="rounded-xl border border-border p-4">
                  <div className="text-sm font-semibold">{t("import.resultTitle")}</div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                    <div>{t("import.result.processed")}: {confirmHook.result.processed}</div>
                    <div>{t("import.result.created")}: {confirmHook.result.created}</div>
                    <div>{t("import.result.updated")}: {confirmHook.result.updated}</div>
                    <div>{t("import.result.failed")}: {confirmHook.result.failed}</div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="space-y-4">
              {summary ? (
                <div className="rounded-xl border border-border p-4">
                  <div className="text-sm font-semibold">{t("import.summaryTitle")}</div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                    <div>{t("import.summary.totalRows")}: {summary.totalRows}</div>
                    <div>{t("import.summary.validRows")}: {summary.validRows}</div>
                    <div>{t("import.summary.invalidRows")}: {summary.invalidRows}</div>
                    <div>{t("import.summary.willCreate")}: {summary.willCreate}</div>
                    <div>{t("import.summary.willUpdate")}: {summary.willUpdate}</div>
                  </div>
                </div>
              ) : null}

              {errors.length ? (
                <div className="space-y-2">
                  <div className="text-sm font-semibold">{t("import.errorsTitle")}</div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("import.errors.row")}</TableHead>
                        <TableHead>{t("import.errors.column")}</TableHead>
                        <TableHead>{t("import.errors.message")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {errors.slice(0, 25).map((e, idx) => (
                        <TableRow key={`${e.rowNumber}-${e.column}-${idx}`}>
                          <TableCell>{e.rowNumber}</TableCell>
                          <TableCell className="font-mono text-xs">{e.column}</TableCell>
                          <TableCell>{e.message}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {errors.length > 25 ? (
                    <div className="text-xs text-muted-foreground">
                      {t("import.errorsMore", { count: errors.length - 25 })}
                    </div>
                  ) : null}
                </div>
              ) : null}

              {sampleRows.length ? (
                <div className="space-y-2">
                  <div className="text-sm font-semibold">{t("import.rowsTitle")}</div>
                  <div className="rounded-xl border border-border bg-muted/10 p-3">
                    <pre className="max-h-64 overflow-auto text-xs leading-relaxed">
                      {JSON.stringify(sampleRows, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {confirmHook.errorStatus === 404 ? (
            <div
              className="mt-4 rounded-md border border-border bg-muted/30 px-3 py-2 text-sm"
              role="status"
            >
              {t("import.expired")}
            </div>
          ) : null}
        </DialogBody>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {tc("actions.close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
