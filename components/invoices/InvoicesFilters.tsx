"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
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
import type { InvoiceStatus } from "@/lib/invoices/types";
import { CustomerSelect } from "@/components/invoices/CustomerSelect";

export type InvoicesUiFilters = {
  status: "all" | InvoiceStatus;
  customerId: string;
};

type Props = {
  value: InvoicesUiFilters;
  onChange: (next: InvoicesUiFilters) => void;
  onApply: () => void;
  onReset: () => void;
  loading?: boolean;
};

const STATUS_VALUES = ["all", "DRAFT", "ISSUED"] as const;

function isStatusValue(value: string): value is InvoicesUiFilters["status"] {
  return (STATUS_VALUES as readonly string[]).includes(value);
}

export function InvoicesFilters({ value, onChange, onApply, onReset, loading }: Props) {
  const t = useTranslations("Invoices");
  const tc = useTranslations("Common");

  const activeCount = useMemo(() => {
    const parts = [value.status !== "all" ? "status" : "", value.customerId.trim()];
    return parts.filter(Boolean).length;
  }, [value.customerId, value.status]);

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
          <Button type="submit" form="invoices_filters" disabled={loading}>
            {loading ? tc("actions.loading") : tc("actions.apply")}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <form
          id="invoices_filters"
          className="grid grid-cols-1 gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            onApply();
          }}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
            <div className="md:col-span-2">
              <Label htmlFor="invoice_status">{t("filters.status")}</Label>
              <Select
                value={value.status}
                onValueChange={(next) => {
                  if (!isStatusValue(next)) return;
                  onChange({ ...value, status: next });
                }}
              >
                <SelectTrigger id="invoice_status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{tc("labels.all")}</SelectItem>
                  <SelectItem value="DRAFT">{t("enums.status.DRAFT")}</SelectItem>
                  <SelectItem value="ISSUED">{t("enums.status.ISSUED")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-4">
              <Label htmlFor="invoice_customerId">{t("filters.customerId")}</Label>
              <div className="mt-1">
                <CustomerSelect
                  id="invoice_customerId"
                  value={value.customerId.trim() ? value.customerId.trim() : null}
                  onChange={(id) => onChange({ ...value, customerId: id ?? "" })}
                />
              </div>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
