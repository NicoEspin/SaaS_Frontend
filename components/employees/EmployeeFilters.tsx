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
import { useAuthStore } from "@/stores/auth-store";
import type { MembershipRole } from "@/lib/employees/types";

export type EmployeesUiFilters = {
  q: string;
  role: "all" | MembershipRole;
  branchId: "all" | string;
};

type Props = {
  value: EmployeesUiFilters;
  onChange: (next: EmployeesUiFilters) => void;
  onApply: () => void;
  onReset: () => void;
  loading?: boolean;
};

const ROLE_VALUES: Array<EmployeesUiFilters["role"]> = [
  "all",
  "OWNER",
  "ADMIN",
  "MANAGER",
  "CASHIER",
];

export function EmployeeFilters({ value, onChange, onApply, onReset, loading }: Props) {
  const t = useTranslations("Employees");
  const tc = useTranslations("Common");

  const session = useAuthStore((s) => s.session);
  const branches = session?.branches ?? [];

  const activeCount = useMemo(() => {
    const parts = [value.q.trim(), value.role !== "all" ? "role" : "", value.branchId !== "all" ? "branch" : ""];
    return parts.filter(Boolean).length;
  }, [value.branchId, value.q, value.role]);

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
          <Button type="submit" form="employees_filters" disabled={loading}>
            {loading ? tc("actions.loading") : tc("actions.apply")}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <form
          id="employees_filters"
          className="grid grid-cols-1 gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            onApply();
          }}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
            <div className="md:col-span-3">
              <Label htmlFor="employees_q">{t("filters.q")}</Label>
              <Input
                id="employees_q"
                value={value.q}
                onChange={(e) => onChange({ ...value, q: e.target.value })}
                placeholder={t("filters.qPlaceholder")}
              />
            </div>

            <div className="md:col-span-1">
              <Label htmlFor="employees_role">{t("filters.role")}</Label>
              <Select
                value={value.role}
                onValueChange={(next) => {
                  if (!ROLE_VALUES.includes(next as EmployeesUiFilters["role"])) return;
                  onChange({ ...value, role: next as EmployeesUiFilters["role"] });
                }}
              >
                <SelectTrigger id="employees_role" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{tc("labels.all")}</SelectItem>
                  <SelectItem value="OWNER">{t("roles.OWNER")}</SelectItem>
                  <SelectItem value="ADMIN">{t("roles.ADMIN")}</SelectItem>
                  <SelectItem value="MANAGER">{t("roles.MANAGER")}</SelectItem>
                  <SelectItem value="CASHIER">{t("roles.CASHIER")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="employees_branch">{t("filters.branch")}</Label>
              <Select
                value={value.branchId}
                onValueChange={(next) => onChange({ ...value, branchId: next })}
                disabled={branches.length === 0}
              >
                <SelectTrigger id="employees_branch" className="w-full">
                  <SelectValue
                    placeholder={branches.length === 0 ? t("filters.branchEmpty") : tc("labels.select")}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("filters.anyBranch")}</SelectItem>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
