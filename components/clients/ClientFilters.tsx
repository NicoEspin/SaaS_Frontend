"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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

export type ClientsUiFilters = {
  q: string;
  code: string;
  name: string;
  taxId: string;
  email: string;
  phone: string;
  isActive: "all" | "active" | "inactive";
};

type Props = {
  value: ClientsUiFilters;
  onChange: (next: ClientsUiFilters) => void;
  onApply: () => void;
  onReset: () => void;
  loading?: boolean;
};

const IS_ACTIVE_VALUES = ["all", "active", "inactive"] as const;

function isIsActiveValue(value: string): value is ClientsUiFilters["isActive"] {
  return (IS_ACTIVE_VALUES as readonly string[]).includes(value);
}

export function ClientFilters({ value, onChange, onApply, onReset, loading }: Props) {
  const t = useTranslations("Clients");
  const tc = useTranslations("Common");

  const activeCount = useMemo(() => {
    const parts = [
      value.q.trim(),
      value.code.trim(),
      value.name.trim(),
      value.taxId.trim(),
      value.email.trim(),
      value.phone.trim(),
      value.isActive !== "all" ? "status" : "",
    ];
    return parts.filter(Boolean).length;
  }, [value.code, value.email, value.isActive, value.name, value.phone, value.q, value.taxId]);

  const hasAdvancedValues = Boolean(
    value.code.trim() ||
      value.name.trim() ||
      value.taxId.trim() ||
      value.email.trim() ||
      value.phone.trim()
  );

  const [advanced, setAdvanced] = useState(() => (hasAdvancedValues ? "advanced" : ""));

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
          <Button type="submit" form="clients_filters" disabled={loading}>
            {loading ? tc("actions.loading") : tc("actions.apply")}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <form
          id="clients_filters"
          className="grid grid-cols-1 gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            onApply();
          }}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
            <div className="md:col-span-4">
              <Label htmlFor="q">{t("filters.q")}</Label>
              <Input
                id="q"
                value={value.q}
                onChange={(e) => onChange({ ...value, q: e.target.value })}
                placeholder={t("filters.qPlaceholder")}
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="isActive">{t("filters.isActive")}</Label>
              <Select
                value={value.isActive}
                onValueChange={(next) => {
                  if (!isIsActiveValue(next)) return;
                  onChange({ ...value, isActive: next });
                }}
              >
                <SelectTrigger id="isActive" className="w-full">
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

          <Accordion type="single" collapsible value={advanced} onValueChange={setAdvanced}>
            <AccordionItem value="advanced" className="border-b-0">
              <AccordionTrigger>{t("filters.advanced")}</AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
                  <div className="md:col-span-2">
                    <Label htmlFor="code">{t("filters.code")}</Label>
                    <Input
                      id="code"
                      value={value.code}
                      onChange={(e) => onChange({ ...value, code: e.target.value })}
                      placeholder={t("filters.codePlaceholder")}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="name">{t("filters.name")}</Label>
                    <Input
                      id="name"
                      value={value.name}
                      onChange={(e) => onChange({ ...value, name: e.target.value })}
                      placeholder={t("filters.namePlaceholder")}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="taxId">{t("filters.taxId")}</Label>
                    <Input
                      id="taxId"
                      value={value.taxId}
                      onChange={(e) => onChange({ ...value, taxId: e.target.value })}
                      placeholder={t("filters.taxIdPlaceholder")}
                      inputMode="numeric"
                      autoComplete="off"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <Label htmlFor="email">{t("filters.email")}</Label>
                    <Input
                      id="email"
                      value={value.email}
                      onChange={(e) => onChange({ ...value, email: e.target.value })}
                      placeholder={t("filters.emailPlaceholder")}
                      inputMode="email"
                      autoComplete="off"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <Label htmlFor="phone">{t("filters.phone")}</Label>
                    <Input
                      id="phone"
                      value={value.phone}
                      onChange={(e) => onChange({ ...value, phone: e.target.value })}
                      placeholder={t("filters.phonePlaceholder")}
                      inputMode="tel"
                      autoComplete="off"
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </form>
      </CardContent>
    </Card>
  );
}
