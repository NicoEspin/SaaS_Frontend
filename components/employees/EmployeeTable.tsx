"use client";

import { MoreHorizontal, Pencil } from "lucide-react";
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
import type { EmployeeRecord, MembershipRole } from "@/lib/employees/types";

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

function roleBadgeClassName(role: MembershipRole) {
  switch (role) {
    case "OWNER":
      return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800";
    case "ADMIN":
      return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800";
    case "MANAGER":
      return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800";
    case "CASHIER":
      return "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-900/40 dark:text-zinc-300 dark:border-zinc-700";
  }
}

type Props = {
  items: EmployeeRecord[];
  loading: boolean;
  error: string | null;
  onEdit: (id: string) => void;
  hasFilters?: boolean;
  onClearFilters?: () => void;
  onCreate?: () => void;
};

export function EmployeeTable({
  items,
  loading,
  error,
  onEdit,
  hasFilters,
  onClearFilters,
  onCreate,
}: Props) {
  const t = useTranslations("Employees");
  const tc = useTranslations("Common");

  const labels = useMemo(
    () => ({ none: tc("labels.none"), actions: tc("labels.actions") }),
    [tc]
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t("table.title")}</CardTitle>
        <div className="text-xs text-muted-foreground">
          {loading ? <Skeleton className="h-4 w-20" /> : t("table.count", { count: items.length })}
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
          <Alert variant="destructive" className="mb-4 border-destructive/30 bg-destructive/10">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <div className="rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>{t("fields.fullName")}</TableHead>
                <TableHead>{t("fields.email")}</TableHead>
                <TableHead>{t("fields.role")}</TableHead>
                <TableHead>{t("fields.branch")}</TableHead>
                <TableHead className="hidden md:table-cell">{t("fields.createdAt")}</TableHead>
                <TableHead className="w-[72px] text-right">{labels.actions}</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {items.length === 0 && !loading ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={6} className="h-64">
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

              {items.map((e) => {
                const branchName = e.activeBranch?.name ?? labels.none;
                return (
                  <TableRow
                    key={e.membership.id}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    <TableCell className="font-medium">{e.user.fullName}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{e.user.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("font-medium", roleBadgeClassName(e.membership.role))}>
                        {t(`roles.${e.membership.role}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className={cn("text-sm", !e.activeBranch && "text-muted-foreground")}>
                      {branchName}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      <time dateTime={e.membership.createdAt}>{formatDate(e.membership.createdAt)}</time>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon-sm" aria-label={labels.actions}>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                          </TooltipTrigger>
                          <TooltipContent side="top">{labels.actions}</TooltipContent>
                        </Tooltip>
                        <DropdownMenuContent align="end" className="w-52">
                          <DropdownMenuItem onSelect={() => onEdit(e.membership.id)}>
                            <Pencil className="h-4 w-4" />
                            {tc("actions.edit")}
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
