"use client";

import { Loader2, Plus, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { EmployeeFilters, type EmployeesUiFilters } from "@/components/employees/EmployeeFilters";
import { EmployeeForm } from "@/components/employees/EmployeeForm";
import { EmployeeTable } from "@/components/employees/EmployeeTable";
import { Button } from "@/components/ui/button";
import { useEmployeesList } from "@/lib/employees/hooks/use-employees-list";
import type { EmployeesListQuery, MembershipRole } from "@/lib/employees/types";
import { MEMBERSHIP_ROLES } from "@/lib/employees/types";
import { getAxiosErrorMessage } from "@/lib/products/utils";

const EMPTY_UI_FILTERS: EmployeesUiFilters = {
  q: "",
  role: "all",
  branchId: "all",
};

function isMembershipRole(value: string): value is MembershipRole {
  return (MEMBERSHIP_ROLES as readonly string[]).includes(value);
}

function uiToQueryFilters(ui: EmployeesUiFilters): Omit<EmployeesListQuery, "limit" | "cursor"> {
  const q = ui.q.trim();
  const role = ui.role;
  const branchId = ui.branchId;

  return {
    q: q ? q : undefined,
    role: role !== "all" && isMembershipRole(role) ? role : undefined,
    branchId: branchId !== "all" ? branchId : undefined,
  };
}

export function EmployeesClient() {
  const t = useTranslations("Employees");
  const tc = useTranslations("Common");

  const [uiFilters, setUiFilters] = useState<EmployeesUiFilters>(EMPTY_UI_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<
    Omit<EmployeesListQuery, "limit" | "cursor">
  >({});

  const list = useEmployeesList({ limit: 20, initialFilters: appliedFilters });

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<string | null>(null);

  const hasActiveFilters = Boolean(
    appliedFilters.q || appliedFilters.role || appliedFilters.branchId
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
    setFormMode("create");
    setEditingId(null);
    setFormOpen(true);
  }

  function openEdit(id: string) {
    setFormMode("edit");
    setEditingId(id);
    setFormOpen(true);
  }

  const refreshLabel = useMemo(
    () => (list.loading ? tc("actions.loading") : tc("actions.refresh")),
    [list.loading, tc]
  );

  async function refreshSafely() {
    try {
      await list.refresh();
    } catch (err) {
      toast.error(getAxiosErrorMessage(err) ?? tc("errors.generic"));
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button variant="outline" onClick={() => void refreshSafely()} disabled={list.loading}>
          {list.loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          {refreshLabel}
        </Button>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          {t("actions.new")}
        </Button>
      </div>

      <EmployeeFilters
        value={uiFilters}
        onChange={setUiFilters}
        onApply={applyFilters}
        onReset={resetFilters}
        loading={list.loading}
      />

      <EmployeeTable
        items={list.items}
        loading={list.loading}
        error={list.error}
        hasFilters={hasActiveFilters}
        onClearFilters={resetFilters}
        onCreate={openCreate}
        onEdit={(id: string) => openEdit(id)}
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

      <EmployeeForm
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={formMode}
        employeeId={editingId}
        onSaved={() => void list.refresh()}
      />
    </section>
  );
}
