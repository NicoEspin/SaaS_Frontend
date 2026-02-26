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
import { Textarea } from "@/components/ui/textarea";
import { useInventoryMutations } from "@/lib/inventory/hooks/use-inventory-mutations";
import type { BranchInventoryItem } from "@/lib/inventory/types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchId: string | null;
  item: BranchInventoryItem | null;
  onSuccess: () => Promise<void> | void;
};

function parseSignedInt(value: string): number | null {
  const raw = value.trim();
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  if (!Number.isInteger(n)) return null;
  return n;
}

export function AdjustStockDialog({ open, onOpenChange, branchId, item, onSuccess }: Props) {
  const t = useTranslations("Inventory");
  const tc = useTranslations("Common");
  const mut = useInventoryMutations();

  const [quantity, setQuantity] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  function handleOpenChange(next: boolean) {
    if (!next) {
      setQuantity("");
      setNotes("");
    }
    onOpenChange(next);
  }

  const parsedQuantity = useMemo(() => parseSignedInt(quantity), [quantity]);

  const canSubmit = Boolean(branchId) && Boolean(item) && parsedQuantity !== null;

  async function submit() {
    if (!branchId || !item) return;
    const q = parseSignedInt(quantity);
    if (q === null) return;

    await mut.adjustStock(branchId, {
      productId: item.productId,
      quantity: q,
      notes: notes.trim() ? notes.trim() : undefined,
    });

    toast.success(t("success.adjusted"));
    await onSuccess();
    handleOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("adjustDialog.title")}</DialogTitle>
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
            <Label htmlFor="adj_qty">{t("adjustDialog.quantity")}</Label>
            <Input
              id="adj_qty"
              type="number"
              step={1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              inputMode="numeric"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="adj_notes">{t("adjustDialog.notes")}</Label>
            <Textarea
              id="adj_notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
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
            {mut.submitting ? tc("actions.loading") : t("adjustDialog.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
