"use client";

import { PencilLine, Truck } from "lucide-react";
import { useMemo } from "react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { BranchInventoryItem, InventoryDisplayAttribute } from "@/lib/inventory/types";
import { cn } from "@/lib/utils";

function formatPrice(value: number) {
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function renderAttrValue(
  value: InventoryDisplayAttribute["value"],
  labels: { yes: string; no: string; none: string }
) {
  if (value === null || value === undefined) return { text: labels.none, muted: true };
  if (typeof value === "boolean") return { text: value ? labels.yes : labels.no, muted: false };
  if (typeof value === "number") return { text: String(value), muted: false };
  if (typeof value === "string") {
    const s = value.trim();
    return s ? { text: s, muted: false } : { text: labels.none, muted: true };
  }
  return { text: labels.none, muted: true };
}

type Props = {
  branchSelected: boolean;
  items: BranchInventoryItem[];
  loading: boolean;
  error: string | null;
  onAdjust: (item: BranchInventoryItem) => void;
  onTransfer: (item: BranchInventoryItem) => void;
};

export function InventoryTable({
  branchSelected,
  items,
  loading,
  error,
  onAdjust,
  onTransfer,
}: Props) {
  const t = useTranslations("Inventory");
  const tc = useTranslations("Common");

  const emptyMessage = useMemo(() => {
    if (!branchSelected) return t("noBranchSelected");
    return t("emptyState");
  }, [branchSelected, t]);

  const labels = useMemo(
    () => ({ yes: tc("labels.yes"), no: tc("labels.no"), none: tc("labels.none") }),
    [tc]
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t("title")}</CardTitle>
        <div className="text-xs text-muted-foreground">{items.length}</div>
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
                <TableHead>{t("columns.code")}</TableHead>
                <TableHead>{t("columns.name")}</TableHead>
                <TableHead>{t("columns.category")}</TableHead>
                <TableHead>{t("columns.attributes")}</TableHead>
                <TableHead className="text-right">{t("columns.stock")}</TableHead>
                <TableHead className="text-right">{t("columns.price")}</TableHead>
                <TableHead className="w-[200px] text-right">{t("columns.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!loading && items.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={7}>
                    <div className="py-10 text-center text-sm text-muted-foreground">
                      {emptyMessage}
                    </div>
                  </TableCell>
                </TableRow>
              ) : null}

              {items.map((it) => {
                const attrs = it.displayAttributes ?? [];
                const extra = attrs.length > 3 ? attrs.slice(3) : [];

                return (
                  <TableRow key={it.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-mono text-xs">{it.productCode}</TableCell>
                    <TableCell className="font-medium">{it.productName}</TableCell>
                    <TableCell>{it.categoryName ?? tc("labels.none")}</TableCell>

                    <TableCell>
                      {attrs.length === 0 ? (
                        <span className="text-sm text-muted-foreground">{tc("labels.none")}</span>
                      ) : extra.length ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className="flex flex-wrap gap-1 cursor-help rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                              tabIndex={0}
                            >
                              {attrs.slice(0, 3).map((a) => {
                                const rendered = renderAttrValue(a.value, labels);
                                return (
                                  <Badge
                                    key={a.key}
                                    variant="outline"
                                    className={cn(
                                      "max-w-[220px] truncate border-primary/20 bg-primary/10 text-primary",
                                      rendered.muted && "text-primary/70"
                                    )}
                                  >
                                    {a.label}: {rendered.text}
                                  </Badge>
                                );
                              })}

                              <Badge
                                variant="outline"
                                className="border-primary/20 bg-primary/10 text-primary"
                              >
                                ...
                              </Badge>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" align="start" className="max-w-[340px]">
                            <div className="grid gap-1">
                              {extra.map((a) => {
                                const rendered = renderAttrValue(a.value, labels);
                                return (
                                  <div
                                    key={a.key}
                                    className={cn(
                                      "max-w-[320px] truncate",
                                      rendered.muted ? "text-background/70" : "text-background"
                                    )}
                                  >
                                    <span className="font-medium">{a.label}:</span> {rendered.text}
                                  </div>
                                );
                              })}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {attrs.slice(0, 3).map((a) => {
                            const rendered = renderAttrValue(a.value, labels);
                            return (
                              <Badge
                                key={a.key}
                                variant="outline"
                                className={cn(
                                  "max-w-[220px] truncate border-primary/20 bg-primary/10 text-primary",
                                  rendered.muted && "text-primary/70"
                                )}
                              >
                                {a.label}: {rendered.text}
                              </Badge>
                            );
                          })}
                        </div>
                      )}
                    </TableCell>

                    <TableCell className="text-right tabular-nums">{it.stockOnHand}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {it.price === null ? tc("labels.none") : formatPrice(it.price)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => onAdjust(it)}
                        >
                          <PencilLine className="h-4 w-4" />
                          {t("adjust")}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => onTransfer(it)}
                        >
                          <Truck className="h-4 w-4" />
                          {t("transfer")}
                        </Button>
                      </div>
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
