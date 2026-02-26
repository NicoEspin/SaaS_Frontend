"use client";

import { Download, Loader2, Plus, SlidersHorizontal, Upload } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { AttributeDefinitionsManager } from "@/components/products/AttributeDefinitionsManager";
import { ConfirmDialog } from "@/components/products/ConfirmDialog";
import { ExportProductsDialog } from "@/components/products/ExportProductsDialog";
import { ImportProductsDialog } from "@/components/products/ImportProductsDialog";
import { ProductFilters, type ProductsUiFilters } from "@/components/products/ProductFilters";
import { ProductForm } from "@/components/products/ProductForm";
import { ProductTable } from "@/components/products/ProductTable";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { Product, ProductsListQuery } from "@/lib/products/types";
import { useAttributeDefinitions } from "@/lib/products/hooks/use-attribute-definitions";
import { useProductMutations } from "@/lib/products/hooks/use-product-mutations";
import { useProductsList } from "@/lib/products/hooks/use-products-list";
import { getAxiosErrorMessage } from "@/lib/products/utils";

const EMPTY_UI_FILTERS: ProductsUiFilters = {
  q: "",
  code: "",
  name: "",
  categoryId: "",
  categoryName: "",
  isActive: "all",
};

function uiToQueryFilters(ui: ProductsUiFilters): Omit<ProductsListQuery, "limit" | "cursor"> {
  return {
    q: ui.q.trim() ? ui.q.trim() : undefined,
    code: ui.code.trim() ? ui.code.trim() : undefined,
    name: ui.name.trim() ? ui.name.trim() : undefined,
    categoryId: ui.categoryId.trim() ? ui.categoryId.trim() : undefined,
    categoryName: ui.categoryName.trim() ? ui.categoryName.trim() : undefined,
    isActive:
      ui.isActive === "active" ? true : ui.isActive === "inactive" ? false : undefined,
  };
}

export function ProductsClient() {
  const t = useTranslations("Products");
  const tc = useTranslations("Common");

  const [uiFilters, setUiFilters] = useState<ProductsUiFilters>(EMPTY_UI_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<
    Omit<ProductsListQuery, "limit" | "cursor">
  >({});

  const list = useProductsList({ limit: 10, initialFilters: appliedFilters });

  const activeCategoryId = appliedFilters.categoryId ?? null;
  const defs = useAttributeDefinitions(activeCategoryId);
  const dynamicColumns = defs.visibleInTable;

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<Product | null>(null);
  const [formKey, setFormKey] = useState(0);

  const [attrOpen, setAttrOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportKey, setExportKey] = useState(0);

  const deleteMut = useProductMutations();
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  const exportDefinitions = useMemo(() => defs.items, [defs.items]);

  const hasActiveFilters = Boolean(
    appliedFilters.q ||
      appliedFilters.code ||
      appliedFilters.name ||
      appliedFilters.categoryId ||
      appliedFilters.categoryName ||
      typeof appliedFilters.isActive === "boolean"
  );

  function applyFilters() {
    const next = uiToQueryFilters(uiFilters);
    setAppliedFilters(next);
    list.setFilters(next);
  }

  function resetFilters() {
    setUiFilters(EMPTY_UI_FILTERS);
    setAppliedFilters({});
    list.setFilters({});
  }

  function openCreate() {
    setEditing(null);
    setFormMode("create");
    setFormKey((k) => k + 1);
    setFormOpen(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setFormMode("edit");
    setFormKey((k) => k + 1);
    setFormOpen(true);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteMut.deleteProduct(deleteTarget.id);
      toast.success(t("success.deleted"));
      setDeleteTarget(null);
      await list.refresh();
    } catch (err) {
      toast.error(getAxiosErrorMessage(err) ?? tc("errors.generic"));
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button variant="outline" onClick={() => setAttrOpen(true)}>
          <SlidersHorizontal className="h-4 w-4" />
          {t("actions.manageAttributes")}
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setExportKey((k) => k + 1);
            setExportOpen(true);
          }}
        >
          <Download className="h-4 w-4" />
          {t("actions.export")}
        </Button>
        <Button variant="outline" onClick={() => setImportOpen(true)}>
          <Upload className="h-4 w-4" />
          {t("actions.import")}
        </Button>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          {t("actions.new")}
        </Button>
      </div>

      <ProductFilters
        value={uiFilters}
        onChange={setUiFilters}
        onApply={applyFilters}
        onReset={resetFilters}
        loading={list.loading}
      />

      <ProductTable
        items={list.items}
        loading={list.loading}
        error={list.error}
        dynamicColumns={dynamicColumns}
        onEdit={openEdit}
        onDelete={(p) => setDeleteTarget(p)}
        hasFilters={hasActiveFilters}
        onClearFilters={resetFilters}
        onCreate={openCreate}
      />

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {list.nextCursor ? t("pagination.moreAvailable") : t("pagination.end")}
        </div>
        <Button
          variant="outline"
          onClick={() => void list.loadMore()}
          disabled={!list.canLoadMore}
        >
          {list.loadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {list.loadingMore ? tc("actions.loading") : t("pagination.loadMore")}
        </Button>
      </div>

      <ProductForm
        key={`product-form-${formKey}`}
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={formMode}
        product={editing}
        onSaved={() => void list.refresh()}
      />

      <AttributeDefinitionsManager open={attrOpen} onOpenChange={setAttrOpen} />

      <ImportProductsDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImported={() => void list.refresh()}
      />

      <ExportProductsDialog
        key={`export-products-${exportKey}`}
        open={exportOpen}
        onOpenChange={setExportOpen}
        filters={appliedFilters}
        attributeDefinitions={exportDefinitions}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title={t("delete.title")}
        description={
          deleteTarget
            ? t("delete.description", { name: deleteTarget.name, code: deleteTarget.code })
            : undefined
        }
        confirmLabel={t("delete.confirm")}
        destructive
        loading={deleteMut.submitting}
        onConfirm={confirmDelete}
      />

      {deleteMut.error ? (
        <Alert variant="destructive" className="border-destructive/30 bg-destructive/10">
          <AlertDescription>{deleteMut.error}</AlertDescription>
        </Alert>
      ) : null}
    </section>
  );
}
