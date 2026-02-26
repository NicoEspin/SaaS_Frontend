"use client";

import { PencilLine, Truck } from "lucide-react";
import { useMemo } from "react";
import { useTranslations } from "next-intl";

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
import type { BranchInventoryItem } from "@/lib/inventory/types";

function formatPrice(value: number) {
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
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

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("columns.code")}</TableHead>
              <TableHead>{t("columns.name")}</TableHead>
              <TableHead>{t("columns.category")}</TableHead>
              <TableHead className="text-right">{t("columns.stock")}</TableHead>
              <TableHead className="text-right">{t("columns.price")}</TableHead>
              <TableHead className="w-[200px] text-right">{t("columns.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!loading && items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <div className="py-10 text-center text-sm text-muted-foreground">
                    {emptyMessage}
                  </div>
                </TableCell>
              </TableRow>
            ) : null}

            {items.map((it) => (
              <TableRow key={it.id}>
                <TableCell className="font-mono text-xs">{it.productCode}</TableCell>
                <TableCell className="font-medium">{it.productName}</TableCell>
                <TableCell>{it.categoryName ?? tc("labels.none")}</TableCell>
                <TableCell className="text-right tabular-nums">{it.stockOnHand}</TableCell>
                <TableCell className="text-right tabular-nums">{formatPrice(it.price)}</TableCell>
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
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
