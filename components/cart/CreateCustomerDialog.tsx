"use client";

import { Loader2, UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { useCart } from "@/components/cart/cart-context";
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
import { getAxiosErrorMessage } from "@/lib/products/utils";
import { useCartUiStore } from "@/stores/cart-ui-store";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  disabled?: boolean;
};

export function CreateCustomerDialog({ open, onOpenChange, disabled }: Props) {
  const t = useTranslations("Cart");
  const tc = useTranslations("Common");

  const { createCustomerQuick } = useCart();
  const setSelectedCustomerId = useCartUiStore((s) => s.setSelectedCustomerId);

  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setName("");
      setSubmitting(false);
      setError(null);
    }
  }, [open]);

  const canSubmit = useMemo(() => {
    if (disabled) return false;
    return Boolean(name.trim()) && !submitting;
  }, [disabled, name, submitting]);

  async function submit() {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSubmitting(true);
    setError(null);
    try {
      const created = await createCustomerQuick({ name: trimmed });
      setSelectedCustomerId(created.id);
      toast.success(t("customerCreate.success"));
      onOpenChange(false);
    } catch (err) {
      setError(getAxiosErrorMessage(err) ?? tc("errors.generic"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            {t("customerCreate.title")}
          </DialogTitle>
          <DialogDescription>{t("customerCreate.subtitle")}</DialogDescription>
        </DialogHeader>

        {error ? (
          <Alert variant="destructive" className="border-destructive/30 bg-destructive/10">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="cart-create-customer-name">{t("customerCreate.fields.name")}</Label>
          <Input
            id="cart-create-customer-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("customerCreate.fields.namePlaceholder")}
            disabled={disabled || submitting}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void submit();
              }
            }}
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {tc("actions.cancel")}
          </Button>
          <Button type="button" onClick={() => void submit()} disabled={!canSubmit}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {submitting ? tc("actions.loading") : tc("actions.create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
