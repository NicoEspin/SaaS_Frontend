"use client";

import { Loader2, Plus, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { SupplierFilters, type SuppliersUiFilters } from "@/components/suppliers/SupplierFilters";
import { SupplierForm } from "@/components/suppliers/SupplierForm";
import { SuppliersTable } from "@/components/suppliers/SuppliersTable";
import { Button } from "@/components/ui/button";
import type { SuppliersListQuery } from "@/lib/suppliers/types";
import { useSuppliersList } from "@/lib/suppliers/hooks/use-suppliers-list";
import type { Supplier } from "@/lib/suppliers/types";

const EMPTY_UI_FILTERS: SuppliersUiFilters = {
  q: "",
  isActive: "all",
};

function uiToQueryFilters(ui: SuppliersUiFilters): Omit<SuppliersListQuery, "limit" | "cursor"> {
  return {
    q: ui.q.trim() ? ui.q.trim() : undefined,
    isActive: ui.isActive === "active" ? true : ui.isActive === "inactive" ? false : undefined,
  };
}

export function SuppliersClient() {
  const t = useTranslations("Suppliers");
  const tc = useTranslations("Common");

  const [uiFilters, setUiFilters] = useState<SuppliersUiFilters>(EMPTY_UI_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<Omit<SuppliersListQuery, "limit" | "cursor">>({});

  const list = useSuppliersList({ limit: 10, initialFilters: appliedFilters });

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<string | null>(null);

  const hasActiveFilters = Boolean(appliedFilters.q || typeof appliedFilters.isActive === "boolean");

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
    setFormMode("create");
    setEditingId(null);
    setFormOpen(true);
  }

  function openEdit(supplier: Supplier) {
    setFormMode("edit");
    setEditingId(supplier.id);
    setFormOpen(true);
  }

  const showTopCreate = !(list.items.length === 0 && !list.loading && !hasActiveFilters);

  const refreshLabel = useMemo(
    () => (list.loading ? tc("actions.loading") : tc("actions.refresh")),
    [list.loading, tc]
  );

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button variant="outline" onClick={() => void list.refresh()} disabled={list.loading}>
          {list.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          {refreshLabel}
        </Button>

        {showTopCreate ? (
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            {t("actions.new")}
          </Button>
        ) : null}
      </div>

      <SupplierFilters value={uiFilters} onChange={setUiFilters} onApply={applyFilters} onReset={resetFilters} loading={list.loading} />

      <SuppliersTable
        items={list.items}
        loading={list.loading}
        error={list.error}
        onEdit={openEdit}
        hasFilters={hasActiveFilters}
        onClearFilters={resetFilters}
        onCreate={openCreate}
      />

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {list.nextCursor ? t("pagination.moreAvailable") : t("pagination.end")}
        </div>
        <Button variant="outline" onClick={() => void list.loadMore()} disabled={!list.canLoadMore}>
          {list.loadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {list.loadingMore ? tc("actions.loading") : t("pagination.loadMore")}
        </Button>
      </div>

      <SupplierForm
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={formMode}
        supplierId={editingId}
        onSaved={() => void list.refresh()}
      />
    </section>
  );
}
