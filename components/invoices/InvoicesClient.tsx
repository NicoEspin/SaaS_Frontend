"use client";

import { Loader2, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { ActiveBranchSelect } from "@/components/branches/ActiveBranchSelect";
import { InvoicesFilters, type InvoicesUiFilters } from "@/components/invoices/InvoicesFilters";
import { InvoicesTable } from "@/components/invoices/InvoicesTable";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { InvoicesListQuery } from "@/lib/invoices/types";
import { useInvoicesList } from "@/lib/invoices/hooks/use-invoices-list";
import { useAuthStore } from "@/stores/auth-store";

const EMPTY_UI_FILTERS: InvoicesUiFilters = {
  status: "all",
  customerId: "",
};

function uiToQueryFilters(ui: InvoicesUiFilters): Omit<InvoicesListQuery, "limit" | "cursor"> {
  return {
    status: ui.status === "all" ? undefined : ui.status,
    customerId: ui.customerId.trim() ? ui.customerId.trim() : undefined,
  };
}

export function InvoicesClient() {
  const t = useTranslations("Invoices");
  const tc = useTranslations("Common");

  const session = useAuthStore((s) => s.session);
  const sessionLoading = useAuthStore((s) => s.sessionLoading);
  const sessionError = useAuthStore((s) => s.sessionError);
  const hydrateSession = useAuthStore((s) => s.hydrateSession);

  useEffect(() => {
    if (session || sessionLoading) return;
    void hydrateSession();
  }, [hydrateSession, session, sessionLoading]);

  const branches = useMemo(() => session?.branches ?? [], [session?.branches]);
  const activeBranch = useMemo(
    () => session?.activeBranch ?? branches[0] ?? null,
    [branches, session?.activeBranch]
  );

  const [uiFilters, setUiFilters] = useState<InvoicesUiFilters>(EMPTY_UI_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<
    Omit<InvoicesListQuery, "limit" | "cursor">
  >({});

  const list = useInvoicesList({
    branchId: activeBranch?.id ?? null,
    limit: 10,
    initialFilters: appliedFilters,
  });

  const hasActiveFilters = Boolean(appliedFilters.status || appliedFilters.customerId);

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

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-background/60 p-4 backdrop-blur md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div className="text-sm font-medium text-foreground">{t("activeBranchLabel")}</div>
          {sessionLoading ? (
            <Skeleton className="h-7 w-[340px] max-w-full" />
          ) : (
            <div className="max-w-full md:w-[340px]">
              <ActiveBranchSelect />
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => void hydrateSession()}
            disabled={sessionLoading}
          >
            <RefreshCw className="h-4 w-4" />
            {sessionLoading ? tc("actions.loading") : t("actions.refreshBranches")}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => void list.refresh()}
            disabled={!activeBranch || list.loading}
          >
            {list.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {list.loading ? tc("actions.loading") : t("actions.refreshInvoices")}
          </Button>
        </div>
      </div>

      {sessionError ? (
        <Alert variant="destructive" className="border-destructive/30 bg-destructive/10">
          <AlertDescription>{tc("errors.generic")}</AlertDescription>
        </Alert>
      ) : null}

      <InvoicesFilters
        value={uiFilters}
        onChange={setUiFilters}
        onApply={applyFilters}
        onReset={resetFilters}
        loading={list.loading}
      />

      <InvoicesTable
        branchId={activeBranch?.id ?? null}
        items={list.items}
        loading={list.loading}
        error={list.error}
        hasFilters={hasActiveFilters}
        onClearFilters={resetFilters}
        onRefresh={list.refresh}
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
    </section>
  );
}
