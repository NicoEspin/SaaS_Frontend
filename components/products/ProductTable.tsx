"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useMemo } from "react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Product, ProductAttributeDefinition } from "@/lib/products/types";

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

function renderAttrValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return value;
  return String(value);
}

type Props = {
  items: Product[];
  loading: boolean;
  error: string | null;
  dynamicColumns: ProductAttributeDefinition[];
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
};

export function ProductTable({
  items,
  loading,
  error,
  dynamicColumns,
  onEdit,
  onDelete,
}: Props) {
  const t = useTranslations("Products");
  const tc = useTranslations("Common");

  const showDynamicColumns = dynamicColumns.length > 0;

  const columns = useMemo(() => {
    return dynamicColumns
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((d) => ({ key: d.key, label: d.label }));
  }, [dynamicColumns]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t("table.title")}</CardTitle>
        <div className="text-xs text-muted-foreground">
          {t("table.count", { count: items.length })}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : null}

        {error ? (
          <div
            className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("fields.code")}</TableHead>
              <TableHead>{t("fields.name")}</TableHead>
              <TableHead>{t("fields.category")}</TableHead>
              <TableHead>{t("fields.isActive")}</TableHead>
              <TableHead>{t("fields.updatedAt")}</TableHead>
              {showDynamicColumns ? (
                columns.map((c) => <TableHead key={c.key}>{c.label}</TableHead>)
              ) : (
                <TableHead>{t("fields.attributes")}</TableHead>
              )}
              <TableHead className="w-[120px]">{tc("labels.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 && !loading ? (
              <TableRow>
                <TableCell colSpan={showDynamicColumns ? 6 + columns.length : 7}>
                  <div className="py-10 text-center text-sm text-muted-foreground">
                    {t("table.empty")}
                  </div>
                </TableCell>
              </TableRow>
            ) : null}

            {items.map((p) => {
              return (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs">{p.code}</TableCell>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>{p.category ? p.category.name : tc("labels.none")}</TableCell>
                  <TableCell>
                    {p.isActive ? (
                      <Badge variant="default">{tc("labels.active")}</Badge>
                    ) : (
                      <Badge variant="outline">{tc("labels.inactive")}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(p.updatedAt)}
                  </TableCell>

                  {showDynamicColumns ? (
                    columns.map((c) => (
                      <TableCell key={c.key} className="text-sm">
                        {renderAttrValue(p.attributes[c.key])}
                      </TableCell>
                    ))
                  ) : (
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {p.displayAttributes.slice(0, 4).map((a) => (
                          <Badge key={a.key} variant="outline" className="max-w-[220px] truncate">
                            {a.label}: {renderAttrValue(a.value)}
                          </Badge>
                        ))}
                        {p.displayAttributes.length > 4 ? (
                          <Badge variant="secondary">+{p.displayAttributes.length - 4}</Badge>
                        ) : null}
                      </div>
                    </TableCell>
                  )}

                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={t("actions.edit")}
                        onClick={() => onEdit(p)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={t("actions.delete")}
                        onClick={() => onDelete(p)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
