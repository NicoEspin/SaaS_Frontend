"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type {
  ExportColumn,
  ExportProductsFormat,
  ProductAttributeDefinition,
  ProductsListQuery,
} from "@/lib/products/types";
import { EXPORT_BASE_COLUMNS } from "@/lib/products/types";
import { useExportProducts } from "@/lib/products/hooks/use-export-products";
import { isValidAttributeKey } from "@/lib/validators";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: Omit<ProductsListQuery, "limit" | "cursor">;
  attributeDefinitions: ProductAttributeDefinition[];
};

function buildDefaultFilename(format: ExportProductsFormat) {
  const iso = new Date().toISOString().slice(0, 10);
  return `products_${iso}.${format}`;
}

export function ExportProductsDialog({
  open,
  onOpenChange,
  filters,
  attributeDefinitions,
}: Props) {
  const t = useTranslations("ImportExport");
  const tc = useTranslations("Common");

  const exportHook = useExportProducts();

  const [format, setFormat] = useState<ExportProductsFormat>("xlsx");
  const [selected, setSelected] = useState<Set<ExportColumn>>(
    () => new Set<ExportColumn>(["code", "name", "categoryName", "isActive"])
  );

  const [customAttrKey, setCustomAttrKey] = useState("");
  const [customError, setCustomError] = useState<string | null>(null);

  const dynamicColumns = useMemo(() => {
    return attributeDefinitions
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((d) => `attr_${d.key}` as const);
  }, [attributeDefinitions]);

  function toggle(col: ExportColumn) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(col)) next.delete(col);
      else next.add(col);
      return next;
    });
  }

  function addCustomColumn() {
    setCustomError(null);
    const raw = customAttrKey.trim();
    if (!raw) return;
    if (!isValidAttributeKey(raw)) {
      setCustomError(t("export.customInvalid"));
      return;
    }
    const col = `attr_${raw}` as ExportColumn;
    setSelected((s) => new Set([...Array.from(s), col]));
    setCustomAttrKey("");
  }

  async function onExport() {
    const cols = Array.from(selected);
    if (cols.length === 0) {
      setCustomError(t("export.columnsRequired"));
      return;
    }

    try {
      await exportHook.exportProducts({
        format,
        columns: cols,
        filters,
        fallbackFilename: buildDefaultFilename(format),
      });
    } catch {
      // error shown in UI
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t("export.title")}</DialogTitle>
          <DialogDescription>{t("export.subtitle")}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="export_format">{t("export.format")}</Label>
                <Select
                  value={format}
                  onValueChange={(value) => setFormat(value as ExportProductsFormat)}
                >
                  <SelectTrigger id="export_format" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="xlsx">xlsx</SelectItem>
                    <SelectItem value="csv">csv</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t("export.addCustom")}</Label>
                <div className="flex gap-2">
                  <Input
                    value={customAttrKey}
                    onChange={(e) => setCustomAttrKey(e.target.value)}
                    placeholder={t("export.customPlaceholder")}
                    autoComplete="off"
                  />
                  <Button type="button" variant="outline" onClick={addCustomColumn}>
                    {tc("actions.add")}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">{t("export.customHint")}</p>
              </div>

              {exportHook.error ? (
                <Alert variant="destructive" className="border-destructive/30 bg-destructive/10">
                  <AlertDescription>{exportHook.error}</AlertDescription>
                </Alert>
              ) : null}

              {customError ? (
                <Alert variant="destructive" className="border-destructive/30 bg-destructive/10">
                  <AlertDescription>{customError}</AlertDescription>
                </Alert>
              ) : null}
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-border p-4">
                <div className="text-sm font-semibold">{t("export.columns")}</div>
                <div className="mt-3 space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t("export.columnsBase")}
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {EXPORT_BASE_COLUMNS.map((c) => (
                      <div key={c} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          id={`export_col_${c}`}
                          checked={selected.has(c)}
                          onCheckedChange={() => toggle(c)}
                        />
                        <Label htmlFor={`export_col_${c}`} className="font-mono text-xs">
                          {c}
                        </Label>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t("export.columnsDynamic")}
                  </div>

                  {dynamicColumns.length === 0 ? (
                    <div className="text-sm text-muted-foreground">{t("export.columnsDynamicEmpty")}</div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2">
                      {dynamicColumns.map((c) => (
                        <div key={c} className="flex items-center gap-2 text-sm">
                          <Checkbox
                            id={`export_col_${c}`}
                            checked={selected.has(c)}
                            onCheckedChange={() => toggle(c)}
                          />
                          <Label htmlFor={`export_col_${c}`} className="font-mono text-xs">
                            {c}
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={exportHook.loading}>
            {tc("actions.close")}
          </Button>
          <Button onClick={onExport} disabled={exportHook.loading}>
            {exportHook.loading ? tc("actions.loading") : t("export.download")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
