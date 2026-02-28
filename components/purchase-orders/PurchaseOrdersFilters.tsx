"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { BranchSelect } from "@/components/branches/BranchSelect";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SupplierSelect } from "@/components/suppliers/SupplierSelect";
import type { PurchaseOrderStatus } from "@/lib/purchase-orders/types";

export type PurchaseOrdersUiFilters = {
  status: "all" | PurchaseOrderStatus;
  supplierId: string | null;
  branchId: string | null;
};

type Props = {
  value: PurchaseOrdersUiFilters;
  onChange: (next: PurchaseOrdersUiFilters) => void;
  onApply: () => void;
  onReset: () => void;
  loading?: boolean;
};

const STATUS_VALUES = [
  "all",
  "DRAFT",
  "CONFIRMED",
  "PARTIALLY_RECEIVED",
  "COMPLETED",
  "CANCELLED",
] as const;

function isStatusValue(value: string): value is PurchaseOrdersUiFilters["status"] {
  return (STATUS_VALUES as readonly string[]).includes(value as (typeof STATUS_VALUES)[number]);
}

export function PurchaseOrdersFilters({ value, onChange, onApply, onReset, loading }: Props) {
  const t = useTranslations("PurchaseOrders");
  const tc = useTranslations("Common");

  const activeCount = useMemo(() => {
    const parts = [
      value.status !== "all" ? "status" : "",
      value.supplierId ? "supplier" : "",
      value.branchId ? "branch" : "",
    ];
    return parts.filter(Boolean).length;
  }, [value.branchId, value.status, value.supplierId]);

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
        <div className="flex min-w-0 items-center gap-2">
          <CardTitle className="truncate">{t("filters.title")}</CardTitle>
          {activeCount ? (
            <Badge variant="secondary" className="shrink-0">
              {t("filters.activeCount", { count: activeCount })}
            </Badge>
          ) : null}
        </div>

        <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
          <Button type="button" variant="outline" onClick={onReset} disabled={loading}>
            {tc("actions.reset")}
          </Button>
          <Button type="submit" form="purchase_orders_filters" disabled={loading}>
            {loading ? tc("actions.loading") : tc("actions.apply")}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <form
          id="purchase_orders_filters"
          className="grid grid-cols-1 gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            onApply();
          }}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
            <div className="md:col-span-2">
              <Label htmlFor="po-status">{t("filters.status")}</Label>
              <Select
                value={value.status}
                onValueChange={(next) => {
                  if (!isStatusValue(next)) return;
                  onChange({ ...value, status: next });
                }}
              >
                <SelectTrigger id="po-status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{tc("labels.all")}</SelectItem>
                  <SelectItem value="DRAFT">{t("enums.status.DRAFT")}</SelectItem>
                  <SelectItem value="CONFIRMED">{t("enums.status.CONFIRMED")}</SelectItem>
                  <SelectItem value="PARTIALLY_RECEIVED">{t("enums.status.PARTIALLY_RECEIVED")}</SelectItem>
                  <SelectItem value="COMPLETED">{t("enums.status.COMPLETED")}</SelectItem>
                  <SelectItem value="CANCELLED">{t("enums.status.CANCELLED")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="po-supplier">{t("filters.supplier")}</Label>
              <SupplierSelect
                id="po-supplier"
                value={value.supplierId}
                onChange={(next) => onChange({ ...value, supplierId: next })}
                allowAny
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="po-branch">{t("filters.branch")}</Label>
              <BranchSelect
                id="po-branch"
                value={value.branchId}
                onChange={(next) => onChange({ ...value, branchId: next })}
                allowAny
              />
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
