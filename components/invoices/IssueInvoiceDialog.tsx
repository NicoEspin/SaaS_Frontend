"use client";

import axios from "axios";
import { Loader2, ReceiptText } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { InvoiceDocType, InvoiceMode } from "@/lib/invoices/types";
import { useInvoiceMutations } from "@/lib/invoices/hooks/use-invoice-mutations";
import { getAxiosErrorMessage } from "@/lib/products/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchId: string | null;
  invoiceId: string | null;
  customerId: string | null;
  onIssued?: () => Promise<void> | void;
};

const DOC_TYPES = ["A", "B"] as const;
const MODES = ["INTERNAL", "ARCA"] as const;

function isDocType(value: string): value is InvoiceDocType {
  return (DOC_TYPES as readonly string[]).includes(value);
}

function isMode(value: string): value is InvoiceMode {
  return (MODES as readonly string[]).includes(value);
}

export function IssueInvoiceDialog({
  open,
  onOpenChange,
  branchId,
  invoiceId,
  customerId,
  onIssued,
}: Props) {
  const t = useTranslations("Invoices");
  const tc = useTranslations("Common");
  const muts = useInvoiceMutations();

  const [docType, setDocType] = useState<InvoiceDocType>("B");
  const [mode, setMode] = useState<InvoiceMode>("INTERNAL");
  const [localError, setLocalError] = useState<string | null>(null);

  const canIssueA = Boolean(customerId);

  const pending = muts.submitting;

  const docTypeHint = useMemo(() => {
    if (canIssueA) return null;
    return t("issueDialog.hints.docTypeARequiresCustomer");
  }, [canIssueA, t]);

  async function submit() {
    if (!branchId || !invoiceId) return;
    if (pending) return;
    if (docType === "A" && !canIssueA) {
      setLocalError(t("errors.docTypeARequiresCustomer"));
      return;
    }

    setLocalError(null);

    try {
      await muts.issueInvoice(branchId, invoiceId, { docType, mode });
      toast.success(t("issueDialog.success"));
      onOpenChange(false);
      await onIssued?.();
    } catch (err) {
      const status = axios.isAxiosError(err) ? err.response?.status ?? null : null;
      if (status === 501) {
        toast.error(t("errors.notImplemented"));
        return;
      }
      toast.error(getAxiosErrorMessage(err) ?? tc("errors.generic"));
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && pending) return;
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ReceiptText className="h-5 w-5 text-muted-foreground" />
            {t("issueDialog.title")}
          </DialogTitle>
          <DialogDescription>{t("issueDialog.description")}</DialogDescription>
        </DialogHeader>

        {localError || muts.error ? (
          <Alert variant="destructive" className="border-destructive/30 bg-destructive/10">
            <AlertDescription>{localError ?? muts.error}</AlertDescription>
          </Alert>
        ) : null}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="issue_docType">{t("issueDialog.fields.docType")}</Label>
            <Select
              value={docType}
              onValueChange={(next) => {
                if (!isDocType(next)) return;
                setDocType(next);
              }}
            >
              <SelectTrigger id="issue_docType" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A" disabled={!canIssueA}>
                  {t("enums.docType.A")}
                </SelectItem>
                <SelectItem value="B">{t("enums.docType.B")}</SelectItem>
              </SelectContent>
            </Select>
            {docTypeHint ? (
              <p className="text-xs text-muted-foreground">{docTypeHint}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="issue_mode">{t("issueDialog.fields.mode")}</Label>
            <Select
              value={mode}
              onValueChange={(next) => {
                if (!isMode(next)) return;
                setMode(next);
              }}
            >
              <SelectTrigger id="issue_mode" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INTERNAL">{t("enums.mode.INTERNAL")}</SelectItem>
                <SelectItem value="ARCA" disabled>
                  {t("enums.mode.ARCA")}
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{t("issueDialog.hints.modeArcaNotAvailable")}</p>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            {tc("actions.cancel")}
          </Button>
          <Button type="button" onClick={() => void submit()} disabled={pending || !branchId || !invoiceId}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {pending ? tc("actions.loading") : t("issueDialog.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
