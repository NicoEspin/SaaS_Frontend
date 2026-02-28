"use client";

import { Loader2, Plus, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { ClientFilters, type ClientsUiFilters } from "@/components/clients/ClientFilters";
import { ClientForm } from "@/components/clients/ClientForm";
import { ClientTable } from "@/components/clients/ClientTable";
import { ConfirmDialog } from "@/components/products/ConfirmDialog";
import { Button } from "@/components/ui/button";
import type { Customer, CustomersListQuery } from "@/lib/clients/types";
import { useClientMutations } from "@/lib/clients/hooks/use-client-mutations";
import { useClientsList } from "@/lib/clients/hooks/use-clients-list";
import { getAxiosErrorMessage } from "@/lib/products/utils";

const EMPTY_UI_FILTERS: ClientsUiFilters = {
  q: "",
  code: "",
  name: "",
  taxId: "",
  email: "",
  phone: "",
  isActive: "all",
};

function uiToQueryFilters(ui: ClientsUiFilters): Omit<CustomersListQuery, "limit" | "cursor"> {
  return {
    q: ui.q.trim() ? ui.q.trim() : undefined,
    code: ui.code.trim() ? ui.code.trim() : undefined,
    name: ui.name.trim() ? ui.name.trim() : undefined,
    taxId: ui.taxId.trim() ? ui.taxId.trim() : undefined,
    email: ui.email.trim() ? ui.email.trim() : undefined,
    phone: ui.phone.trim() ? ui.phone.trim() : undefined,
    isActive: ui.isActive === "active" ? true : ui.isActive === "inactive" ? false : undefined,
  };
}

export function ClientsClient() {
  const t = useTranslations("Clients");
  const tc = useTranslations("Common");

  const [uiFilters, setUiFilters] = useState<ClientsUiFilters>(EMPTY_UI_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<
    Omit<CustomersListQuery, "limit" | "cursor">
  >({});

  const list = useClientsList({ limit: 10, initialFilters: appliedFilters });
  const muts = useClientMutations();

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [deactivateTarget, setDeactivateTarget] = useState<Customer | null>(null);

  const hasActiveFilters = Boolean(
    appliedFilters.q ||
      appliedFilters.code ||
      appliedFilters.name ||
      appliedFilters.taxId ||
      appliedFilters.email ||
      appliedFilters.phone ||
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
    setFormMode("create");
    setEditingId(null);
    setFormOpen(true);
  }

  function openEdit(c: Customer) {
    setFormMode("edit");
    setEditingId(c.id);
    setFormOpen(true);
  }

  async function confirmDeactivate() {
    if (!deactivateTarget) return;
    try {
      await muts.deleteCustomer(deactivateTarget.id);
      toast.success(t("success.deactivated"));
      setDeactivateTarget(null);
      await list.refresh();
    } catch (err) {
      toast.error(getAxiosErrorMessage(err) ?? tc("errors.generic"));
    }
  }

  async function activate(c: Customer) {
    try {
      await muts.updateCustomer(c.id, { isActive: true });
      toast.success(t("success.activated"));
      await list.refresh();
    } catch (err) {
      toast.error(getAxiosErrorMessage(err) ?? tc("errors.generic"));
    }
  }

  const refreshLabel = useMemo(() => (list.loading ? tc("actions.loading") : tc("actions.refresh")), [list.loading, tc]);

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button variant="outline" onClick={() => void list.refresh()} disabled={list.loading}>
          {list.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          {refreshLabel}
        </Button>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          {t("actions.new")}
        </Button>
      </div>

      <ClientFilters
        value={uiFilters}
        onChange={setUiFilters}
        onApply={applyFilters}
        onReset={resetFilters}
        loading={list.loading}
      />

      <ClientTable
        items={list.items}
        loading={list.loading}
        error={list.error}
        onEdit={openEdit}
        onDeactivate={(c) => setDeactivateTarget(c)}
        onActivate={(c) => void activate(c)}
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

      <ClientForm
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={formMode}
        customerId={editingId}
        onSaved={() => void list.refresh()}
      />

      <ConfirmDialog
        open={Boolean(deactivateTarget)}
        onOpenChange={(v) => !v && setDeactivateTarget(null)}
        title={t("deactivate.title")}
        description={
          deactivateTarget
            ? t("deactivate.description", {
                name: deactivateTarget.name,
                code: deactivateTarget.code ?? tc("labels.none"),
              })
            : undefined
        }
        confirmLabel={t("deactivate.confirm")}
        destructive
        loading={muts.submitting}
        onConfirm={confirmDeactivate}
      />
    </section>
  );
}
