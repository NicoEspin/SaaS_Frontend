"use client";

import { Loader2, Plus, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { CreatePurchaseOrderDialog } from "@/components/purchase-orders/CreatePurchaseOrderDialog";
import { PurchaseOrdersFilters, type PurchaseOrdersUiFilters } from "@/components/purchase-orders/PurchaseOrdersFilters";
import { PurchaseOrdersTable } from "@/components/purchase-orders/PurchaseOrdersTable";
import { Button } from "@/components/ui/button";
import type { PurchaseOrdersListQuery } from "@/lib/purchase-orders/types";
import { usePurchaseOrdersList } from "@/lib/purchase-orders/hooks/use-purchase-orders-list";

const EMPTY_UI_FILTERS: PurchaseOrdersUiFilters = {
  status: "all",
  supplierId: null,
  branchId: null,
};

function uiToQueryFilters(ui: PurchaseOrdersUiFilters): Omit<PurchaseOrdersListQuery, "limit" | "cursor"> {
  return {
    status: ui.status === "all" ? undefined : ui.status,
    supplierId: ui.supplierId ?? undefined,
    branchId: ui.branchId ?? undefined,
  };
}

export function PurchaseOrdersClient() {
  const t = useTranslations("PurchaseOrders");
  const tc = useTranslations("Common");

  const [uiFilters, setUiFilters] = useState<PurchaseOrdersUiFilters>(EMPTY_UI_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<Omit<PurchaseOrdersListQuery, "limit" | "cursor">>({});

  const list = usePurchaseOrdersList({ limit: 10, initialFilters: appliedFilters });

  const [createOpen, setCreateOpen] = useState(false);

  const hasActiveFilters = useMemo(
    () => Boolean(appliedFilters.status || appliedFilters.supplierId || appliedFilters.branchId),
    [appliedFilters.branchId, appliedFilters.status, appliedFilters.supplierId]
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

  const refreshLabel = useMemo(() => (list.loading ? tc("actions.loading") : tc("actions.refresh")), [list.loading, tc]);

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button variant="outline" onClick={() => void list.refresh()} disabled={list.loading}>
          {list.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          {refreshLabel}
        </Button>

        <Button type="button" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          {t("actions.new")}
        </Button>
      </div>

      <PurchaseOrdersFilters
        value={uiFilters}
        onChange={setUiFilters}
        onApply={applyFilters}
        onReset={resetFilters}
        loading={list.loading}
      />

      <PurchaseOrdersTable
        items={list.items}
        loading={list.loading}
        error={list.error}
        hasFilters={hasActiveFilters}
        onClearFilters={resetFilters}
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

      <CreatePurchaseOrderDialog open={createOpen} onOpenChange={setCreateOpen} />
    </section>
  );
}
