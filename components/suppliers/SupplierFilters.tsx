"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type SuppliersUiFilters = {
  q: string;
  isActive: "all" | "active" | "inactive";
};

type Props = {
  value: SuppliersUiFilters;
  onChange: (next: SuppliersUiFilters) => void;
  onApply: () => void;
  onReset: () => void;
  loading?: boolean;
};

const IS_ACTIVE_VALUES = ["all", "active", "inactive"] as const;

function isIsActiveValue(value: string): value is SuppliersUiFilters["isActive"] {
  return (IS_ACTIVE_VALUES as readonly string[]).includes(value);
}

export function SupplierFilters({ value, onChange, onApply, onReset, loading }: Props) {
  const t = useTranslations("Suppliers");
  const tc = useTranslations("Common");

  const activeCount = useMemo(() => {
    const parts = [value.q.trim(), value.isActive !== "all" ? "status" : ""];
    return parts.filter(Boolean).length;
  }, [value.isActive, value.q]);

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
          <Button type="submit" variant="secondary" form="suppliers_filters" disabled={loading}>
            {loading ? tc("actions.loading") : tc("actions.apply")}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <form
          id="suppliers_filters"
          className="grid grid-cols-1 gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            onApply();
          }}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
            <div className="md:col-span-4">
              <Label htmlFor="suppliers-q">{t("filters.q")}</Label>
              <Input
                id="suppliers-q"
                value={value.q}
                onChange={(e) => onChange({ ...value, q: e.target.value })}
                placeholder={t("filters.qPlaceholder")}
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="suppliers-isActive">{t("filters.isActive")}</Label>
              <Select
                value={value.isActive}
                onValueChange={(next) => {
                  if (!isIsActiveValue(next)) return;
                  onChange({ ...value, isActive: next });
                }}
              >
                <SelectTrigger id="suppliers-isActive" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{tc("labels.all")}</SelectItem>
                  <SelectItem value="active">{tc("labels.active")}</SelectItem>
                  <SelectItem value="inactive">{tc("labels.inactive")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
