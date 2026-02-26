"use client";

import { RefreshCcw, SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { AdjustStockDialog } from "@/components/inventory/AdjustStockDialog";
import { InventoryTable } from "@/components/inventory/InventoryTable";
import { TransferStockDialog } from "@/components/inventory/TransferStockDialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { BranchInventoryItem } from "@/lib/inventory/types";
import { useInventoryList } from "@/lib/inventory/hooks/use-inventory-list";
import { useAuthStore } from "@/stores/auth-store";

export function InventoryClient() {
  const t = useTranslations("Inventory");
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

  const list = useInventoryList(activeBranch?.id ?? null, { limit: 25 });

  const [adjustOpen, setAdjustOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<BranchInventoryItem | null>(null);

  const otherBranches = useMemo(() => {
    const fromId = activeBranch?.id ?? "";
    return branches.filter((b) => b.id !== fromId);
  }, [activeBranch?.id, branches]);

  function openAdjust(item: BranchInventoryItem) {
    setSelectedItem(item);
    setAdjustOpen(true);
  }

  function openTransfer(item: BranchInventoryItem) {
    setSelectedItem(item);
    setTransferOpen(true);
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-background/60 p-4 backdrop-blur md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div className="text-sm font-medium text-foreground">{t("activeBranchLabel")}</div>
          {sessionLoading ? (
            <Skeleton className="h-7 w-[340px] max-w-full" />
          ) : activeBranch ? (
            <Badge variant="secondary" className="max-w-full truncate">
              {activeBranch.name}
            </Badge>
          ) : (
            <div className="text-sm text-muted-foreground">{t("noBranchSelected")}</div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => void hydrateSession()}
            disabled={sessionLoading}
          >
            <RefreshCcw className="h-4 w-4" />
            {sessionLoading ? tc("actions.loading") : t("actions.refreshBranches")}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => void list.refresh()}
            disabled={!activeBranch || list.loading}
          >
            <SlidersHorizontal className="h-4 w-4" />
            {list.loading ? tc("actions.loading") : t("actions.refreshInventory")}
          </Button>
        </div>
      </div>

      {sessionError ? (
        <Alert variant="destructive" className="border-destructive/30 bg-destructive/10">
          <AlertDescription>{tc("errors.generic")}</AlertDescription>
        </Alert>
      ) : null}

      <InventoryTable
        branchSelected={Boolean(activeBranch)}
        items={list.items}
        loading={list.loading}
        error={list.error}
        onAdjust={openAdjust}
        onTransfer={openTransfer}
      />

      <AdjustStockDialog
        open={adjustOpen}
        onOpenChange={(v) => {
          setAdjustOpen(v);
          if (!v) setSelectedItem(null);
        }}
        branchId={activeBranch?.id ?? null}
        item={selectedItem}
        onSuccess={async () => {
          await list.refresh();
        }}
      />

      <TransferStockDialog
        open={transferOpen}
        onOpenChange={(v) => {
          setTransferOpen(v);
          if (!v) setSelectedItem(null);
        }}
        fromBranchId={activeBranch?.id ?? null}
        branches={otherBranches}
        item={selectedItem}
        onSuccess={async () => {
          await list.refresh();
        }}
      />
    </section>
  );
}
