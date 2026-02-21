"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

export type ProductsUiFilters = {
  q: string;
  code: string;
  name: string;
  categoryId: string;
  categoryName: string;
  isActive: "all" | "active" | "inactive";
};

type Props = {
  value: ProductsUiFilters;
  onChange: (next: ProductsUiFilters) => void;
  onApply: () => void;
  onReset: () => void;
  loading?: boolean;
};

export function ProductFilters({ value, onChange, onApply, onReset, loading }: Props) {
  const t = useTranslations("Products");
  const tc = useTranslations("Common");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("filters.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="grid grid-cols-1 gap-4 md:grid-cols-6"
          onSubmit={(e) => {
            e.preventDefault();
            onApply();
          }}
        >
          <div className="md:col-span-2">
            <Label htmlFor="q">{t("filters.q")}</Label>
            <Input
              id="q"
              value={value.q}
              onChange={(e) => onChange({ ...value, q: e.target.value })}
              placeholder={t("filters.qPlaceholder")}
            />
          </div>

          <div>
            <Label htmlFor="code">{t("filters.code")}</Label>
            <Input
              id="code"
              value={value.code}
              onChange={(e) => onChange({ ...value, code: e.target.value })}
              placeholder={t("filters.codePlaceholder")}
            />
          </div>

          <div>
            <Label htmlFor="name">{t("filters.name")}</Label>
            <Input
              id="name"
              value={value.name}
              onChange={(e) => onChange({ ...value, name: e.target.value })}
              placeholder={t("filters.namePlaceholder")}
            />
          </div>

          <div>
            <Label htmlFor="categoryId">{t("filters.categoryId")}</Label>
            <Input
              id="categoryId"
              value={value.categoryId}
              onChange={(e) => onChange({ ...value, categoryId: e.target.value })}
              placeholder={t("filters.categoryIdPlaceholder")}
              inputMode="text"
              autoComplete="off"
            />
          </div>

          <div>
            <Label htmlFor="categoryName">{t("filters.categoryName")}</Label>
            <Input
              id="categoryName"
              value={value.categoryName}
              onChange={(e) => onChange({ ...value, categoryName: e.target.value })}
              placeholder={t("filters.categoryNamePlaceholder")}
            />
          </div>

          <div>
            <Label htmlFor="isActive">{t("filters.isActive")}</Label>
            <Select
              id="isActive"
              value={value.isActive}
              onChange={(e) =>
                onChange({
                  ...value,
                  isActive: e.target.value as ProductsUiFilters["isActive"],
                })
              }
            >
              <option value="all">{tc("labels.all")}</option>
              <option value="active">{tc("labels.active")}</option>
              <option value="inactive">{tc("labels.inactive")}</option>
            </Select>
          </div>

          <div className="md:col-span-6 flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={onReset} disabled={loading}>
              {tc("actions.reset")}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? tc("actions.loading") : tc("actions.apply")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
