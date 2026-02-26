"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Branch } from "@/lib/branches/types";
import { useInventoryMutations } from "@/lib/inventory/hooks/use-inventory-mutations";
import type { BranchInventoryItem } from "@/lib/inventory/types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fromBranchId: string | null;
  branches: Branch[];
  item: BranchInventoryItem | null;
  onSuccess: () => Promise<void> | void;
};

function parsePositiveInt(value: string): number | null {
  const raw = value.trim();
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  if (!Number.isInteger(n)) return null;
  if (n <= 0) return null;
  return n;
}

export function TransferStockDialog({
  open,
  onOpenChange,
  fromBranchId,
  branches,
  item,
  onSuccess,
}: Props) {
  const t = useTranslations("Inventory");
  const tc = useTranslations("Common");
  const mut = useInventoryMutations();

  const [toBranchId, setToBranchId] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("");

  function handleOpenChange(next: boolean) {
    if (!next) {
      setToBranchId("");
      setQuantity("");
    }
    onOpenChange(next);
  }

  const parsedQuantity = useMemo(() => parsePositiveInt(quantity), [quantity]);

  const canSubmit =
    Boolean(fromBranchId) &&
    Boolean(item) &&
    Boolean(toBranchId.trim()) &&
    parsedQuantity !== null;

  async function submit() {
    if (!fromBranchId || !item) return;
    const toId = toBranchId.trim();
    if (!toId) return;
    const q = parsePositiveInt(quantity);
    if (q === null) return;

    await mut.transferStock(fromBranchId, {
      toBranchId: toId,
      productId: item.productId,
      quantity: q,
    });

    toast.success(t("success.transferred"));
    await onSuccess();
    handleOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("transferDialog.title")}</DialogTitle>
          <DialogDescription>
            {item ? (
              <span className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-foreground">{item.productName}</span>
                <span className="font-mono text-xs text-muted-foreground">{item.productCode}</span>
              </span>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tr_to">{t("transferDialog.toBranch")}</Label>
            <Select
              value={toBranchId.trim() ? toBranchId.trim() : "__unset__"}
              onValueChange={(v) => setToBranchId(v === "__unset__" ? "" : v)}
              disabled={branches.length === 0}
            >
              <SelectTrigger id="tr_to" className="w-full">
                <SelectValue placeholder={tc("labels.select")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__unset__">{tc("labels.none")}</SelectItem>
                {branches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tr_qty">{t("transferDialog.quantity")}</Label>
            <Input
              id="tr_qty"
              type="number"
              min={1}
              step={1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              inputMode="numeric"
            />
          </div>

          {mut.error ? (
            <Alert variant="destructive" className="border-destructive/30 bg-destructive/10">
              <AlertDescription>{mut.error}</AlertDescription>
            </Alert>
          ) : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {tc("actions.cancel")}
          </Button>
          <Button type="button" onClick={() => void submit()} disabled={!canSubmit || mut.submitting}>
            {mut.submitting ? tc("actions.loading") : t("transferDialog.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
