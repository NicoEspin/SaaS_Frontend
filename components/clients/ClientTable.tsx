"use client";

import { CheckCircle2, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { Customer } from "@/lib/clients/types";

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

function statusBadgeClassName(isActive: boolean) {
  return isActive
    ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800"
    : "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-900/40 dark:text-zinc-300 dark:border-zinc-700";
}

type Props = {
  items: Customer[];
  loading: boolean;
  error: string | null;
  onEdit: (customer: Customer) => void;
  onDeactivate: (customer: Customer) => void;
  onActivate: (customer: Customer) => void;
  hasFilters?: boolean;
  onClearFilters?: () => void;
  onCreate?: () => void;
};

export function ClientTable({
  items,
  loading,
  error,
  onEdit,
  onDeactivate,
  onActivate,
  hasFilters,
  onClearFilters,
  onCreate,
}: Props) {
  const t = useTranslations("Clients");
  const tc = useTranslations("Common");

  const labels = useMemo(
    () => ({ none: tc("labels.none"), active: tc("labels.active"), inactive: tc("labels.inactive") }),
    [tc]
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t("table.title")}</CardTitle>
        <div className="text-xs text-muted-foreground">{t("table.count", { count: items.length })}</div>
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
          <Alert variant="destructive" className="mb-4 border-destructive/30 bg-destructive/10">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <div className="rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>{t("fields.code")}</TableHead>
                <TableHead>{t("fields.name")}</TableHead>
                <TableHead>{t("fields.type")}</TableHead>
                <TableHead>{t("fields.taxId")}</TableHead>
                <TableHead>{t("fields.email")}</TableHead>
                <TableHead>{t("fields.phone")}</TableHead>
                <TableHead>{t("fields.isActive")}</TableHead>
                <TableHead>{t("fields.updatedAt")}</TableHead>
                <TableHead className="w-[72px] text-right">{tc("labels.actions")}</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {items.length === 0 && !loading ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={9} className="h-64">
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

              {items.map((c) => {
                return (
                  <TableRow key={c.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-mono text-xs">{c.code ?? labels.none}</TableCell>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{t(`enums.type.${c.type}`)}</Badge>
                    </TableCell>
                    <TableCell className={cn("font-mono text-xs", !c.taxId && "text-muted-foreground")}>
                      {c.taxId ?? labels.none}
                    </TableCell>
                    <TableCell className={cn("text-sm", !c.email && "text-muted-foreground")}>
                      {c.email ?? labels.none}
                    </TableCell>
                    <TableCell className={cn("text-sm", !c.phone && "text-muted-foreground")}>
                      {c.phone ?? labels.none}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("font-medium", statusBadgeClassName(c.isActive))}>
                        {c.isActive ? labels.active : labels.inactive}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <time dateTime={c.updatedAt}>{formatDate(c.updatedAt)}</time>
                    </TableCell>
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
                        <DropdownMenuContent align="end" className="w-52">
                          <DropdownMenuItem onSelect={() => onEdit(c)}>
                            <Pencil className="h-4 w-4" />
                            {tc("actions.edit")}
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          {c.isActive ? (
                            <DropdownMenuItem variant="destructive" onSelect={() => onDeactivate(c)}>
                              <Trash2 className="h-4 w-4" />
                              {t("actions.deactivate")}
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onSelect={() => onActivate(c)}>
                              <CheckCircle2 className="h-4 w-4" />
                              {t("actions.activate")}
                            </DropdownMenuItem>
                          )}
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
