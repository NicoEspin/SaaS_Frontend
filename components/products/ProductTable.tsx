"use client";

import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useMemo } from "react";
import { useTranslations } from "next-intl";

import { EmptyState } from "@/components/empty-state/EmptyState";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { Product, ProductAttributeDefinition } from "@/lib/products/types";

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function renderAttrValue(value: unknown, labels: { yes: string; no: string; none: string }) {
  if (value === null || value === undefined) return { text: labels.none, muted: true };
  if (typeof value === "boolean") return { text: value ? labels.yes : labels.no, muted: false };
  if (typeof value === "number") return { text: String(value), muted: false };
  if (typeof value === "string") {
    const s = value.trim();
    return s ? { text: s, muted: false } : { text: labels.none, muted: true };
  }
  const s = String(value).trim();
  return s ? { text: s, muted: false } : { text: labels.none, muted: true };
}

function statusBadgeClassName(isActive: boolean) {
  return isActive
    ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800"
    : "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-900/40 dark:text-zinc-300 dark:border-zinc-700";
}

type Props = {
  items: Product[];
  loading: boolean;
  error: string | null;
  dynamicColumns: ProductAttributeDefinition[];
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  hasFilters?: boolean;
  onClearFilters?: () => void;
  onCreate?: () => void;
};

export function ProductTable({
  items,
  loading,
  error,
  dynamicColumns,
  onEdit,
  onDelete,
  hasFilters,
  onClearFilters,
  onCreate,
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

  const labels = useMemo(
    () => ({ yes: tc("labels.yes"), no: tc("labels.no"), none: tc("labels.none") }),
    [tc]
  );

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
          <Alert
            variant="destructive"
            className="mb-4 border-destructive/30 bg-destructive/10"
          >
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <div className="rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
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
                <TableHead className="w-[72px] text-right">{tc("labels.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 && !loading ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={showDynamicColumns ? 6 + columns.length : 7} className="h-64">
                    <EmptyState
                      variant={hasFilters ? "noResults" : "empty"}
                      action={
                        hasFilters && onClearFilters
                          ? { label: tc("actions.reset"), onClick: onClearFilters }
                          : onCreate
                            ? { label: t("actions.new"), onClick: onCreate }
                            : undefined
                      }
                    />
                  </TableCell>
                </TableRow>
              ) : null}

              {items.map((p) => {
                return (
                  <TableRow key={p.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-mono text-xs">{p.code}</TableCell>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>{p.category ? p.category.name : tc("labels.none")}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("font-medium", statusBadgeClassName(p.isActive))}>
                        {p.isActive ? tc("labels.active") : tc("labels.inactive")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <time dateTime={p.updatedAt}>{formatDate(p.updatedAt)}</time>
                    </TableCell>

                    {showDynamicColumns ? (
                      columns.map((c) => {
                        const rendered = renderAttrValue(p.attributes[c.key], labels);
                        return (
                          <TableCell key={c.key} className={cn("text-sm", rendered.muted && "text-muted-foreground")}>
                            {rendered.text}
                          </TableCell>
                        );
                      })
                    ) : (
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {p.displayAttributes.slice(0, 4).map((a) => {
                            const rendered = renderAttrValue(a.value, labels);
                            return (
                              <Badge
                                key={a.key}
                                variant="outline"
                                className={cn(
                                  "max-w-[220px] truncate",
                                  rendered.muted && "text-muted-foreground"
                                )}
                              >
                                {a.label}: {rendered.text}
                              </Badge>
                            );
                          })}
                          {p.displayAttributes.length > 4 ? (
                            <Badge variant="secondary">+{p.displayAttributes.length - 4}</Badge>
                          ) : null}
                        </div>
                      </TableCell>
                    )}

                    <TableCell className="text-right">
                      <DropdownMenu>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon-sm" aria-label={tc("labels.actions")}>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                          </TooltipTrigger>
                          <TooltipContent side="top">{tc("labels.actions")}</TooltipContent>
                        </Tooltip>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onSelect={() => onEdit(p)}>
                            <Pencil className="h-4 w-4" />
                            {tc("actions.edit")}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem variant="destructive" onSelect={() => onDelete(p)}>
                            <Trash2 className="h-4 w-4" />
                            {t("actions.delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
