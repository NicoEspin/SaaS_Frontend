"use client";

import axios from "axios";
import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { suppliersApi } from "@/lib/suppliers/api";
import type { Supplier } from "@/lib/suppliers/types";
import { getAxiosErrorMessage } from "@/lib/products/utils";
import { useSupplierMutations } from "@/lib/suppliers/hooks/use-supplier-mutations";
import { isValidEmail } from "@/lib/validators";

type Mode = "create" | "edit";

type FieldErrors = Record<string, string>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: Mode;
  supplierId: string | null;
  onSaved: () => void;
};

export function SupplierForm({ open, onOpenChange, mode, supplierId, onSaved }: Props) {
  const t = useTranslations("Suppliers");
  const tc = useTranslations("Common");
  const muts = useSupplierMutations();

  const [supplierLoading, setSupplierLoading] = useState(false);
  const [loadedSupplier, setLoadedSupplier] = useState<Supplier | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const loadAbortRef = useRef<AbortController | null>(null);

  const initial = useMemo(() => {
    const s = loadedSupplier;
    if (mode === "edit" && s) {
      return {
        name: s.name,
        email: s.email ?? "",
        phone: s.phone ?? "",
        address: s.address ?? "",
        taxId: s.taxId ?? "",
        paymentTerms: s.paymentTerms ?? "",
        notes: s.notes ?? "",
        isActive: s.isActive,
      };
    }

    return {
      name: "",
      email: "",
      phone: "",
      address: "",
      taxId: "",
      paymentTerms: "",
      notes: "",
      isActive: true,
    };
  }, [loadedSupplier, mode]);

  const [name, setName] = useState(initial.name);
  const [email, setEmail] = useState(initial.email);
  const [phone, setPhone] = useState(initial.phone);
  const [address, setAddress] = useState(initial.address);
  const [taxId, setTaxId] = useState(initial.taxId);
  const [paymentTerms, setPaymentTerms] = useState(initial.paymentTerms);
  const [notes, setNotes] = useState(initial.notes);
  const [isActive, setIsActive] = useState(initial.isActive);

  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    setErrors({});
    setFormError(null);

    if (mode === "create") {
      setLoadedSupplier(null);
      setLoadError(null);
      loadAbortRef.current?.abort();
      setSupplierLoading(false);

      setName("");
      setEmail("");
      setPhone("");
      setAddress("");
      setTaxId("");
      setPaymentTerms("");
      setNotes("");
      setIsActive(true);
      return;
    }

    if (!supplierId) return;

    loadAbortRef.current?.abort();
    const controller = new AbortController();
    loadAbortRef.current = controller;

    setSupplierLoading(true);
    setLoadError(null);
    setLoadedSupplier(null);

    void suppliersApi.suppliers
      .get(supplierId, { signal: controller.signal })
      .then((s) => {
        if (controller.signal.aborted) return;
        setLoadedSupplier(s);

        setName(s.name);
        setEmail(s.email ?? "");
        setPhone(s.phone ?? "");
        setAddress(s.address ?? "");
        setTaxId(s.taxId ?? "");
        setPaymentTerms(s.paymentTerms ?? "");
        setNotes(s.notes ?? "");
        setIsActive(s.isActive);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        const status = axios.isAxiosError(err) ? (err.response?.status ?? null) : null;
        if (status === 404) {
          setLoadError(t("errors.notFound"));
          return;
        }
        setLoadError(getAxiosErrorMessage(err) ?? tc("errors.generic"));
      })
      .finally(() => {
        if (!controller.signal.aborted) setSupplierLoading(false);
      });

    return () => controller.abort();
  }, [mode, open, supplierId, t, tc]);

  function validate() {
    const next: FieldErrors = {};

    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const cleanPaymentTerms = paymentTerms.trim();

    if (!cleanName) next.name = t("validation.nameRequired");
    if (!cleanPaymentTerms) next.paymentTerms = t("validation.paymentTermsRequired");

    if (cleanEmail && !isValidEmail(cleanEmail)) next.email = t("validation.invalidEmail");

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!validate()) return;

    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const cleanPhone = phone.trim();
    const cleanAddress = address.trim();
    const cleanTaxId = taxId.trim();
    const cleanPaymentTerms = paymentTerms.trim();
    const cleanNotes = notes.trim();

    try {
      if (mode === "edit") {
        if (!supplierId) throw new Error("Missing supplierId");
        await muts.updateSupplier(supplierId, {
          name: cleanName,
          email: cleanEmail ? cleanEmail : null,
          phone: cleanPhone ? cleanPhone : null,
          address: cleanAddress ? cleanAddress : null,
          taxId: cleanTaxId ? cleanTaxId : null,
          paymentTerms: cleanPaymentTerms,
          notes: cleanNotes ? cleanNotes : null,
          isActive,
        });
        toast.success(t("success.updated"));
      } else {
        await muts.createSupplier({
          name: cleanName,
          email: cleanEmail ? cleanEmail : undefined,
          phone: cleanPhone ? cleanPhone : undefined,
          address: cleanAddress ? cleanAddress : undefined,
          taxId: cleanTaxId ? cleanTaxId : undefined,
          paymentTerms: cleanPaymentTerms,
          notes: cleanNotes ? cleanNotes : undefined,
          isActive,
        });
        toast.success(t("success.created"));
      }

      onOpenChange(false);
      onSaved();
    } catch (err) {
      const msg = getAxiosErrorMessage(err);
      const text = msg ?? tc("errors.generic");
      setFormError(text);
      toast.error(text);
    }
  }

  const pending = Boolean(muts.submitting) || supplierLoading;
  const title = mode === "edit" ? t("form.editTitle") : t("form.createTitle");
  const subtitle = mode === "edit" ? t("form.editSubtitle") : t("form.createSubtitle");
  const submitLabel = mode === "edit" ? tc("actions.save") : tc("actions.create");

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && pending) return;
        onOpenChange(next);
      }}
    >
      <DialogContent className="flex max-h-[90vh] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <div className="border-b border-border px-4 py-4 pr-12 sm:px-6 sm:py-5">
          <DialogHeader className="gap-1">
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{subtitle}</DialogDescription>
          </DialogHeader>
        </div>

        <form className="flex min-h-0 flex-1 flex-col" onSubmit={onSubmit}>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
            {loadError ? (
              <Alert variant="destructive" className="mb-4 border-destructive/30 bg-destructive/10">
                <AlertDescription>{loadError}</AlertDescription>
              </Alert>
            ) : null}

            {formError ? (
              <Alert variant="destructive" className="mb-4 border-destructive/30 bg-destructive/10">
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            ) : null}

            {supplierLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
              </div>
            ) : (
              <div className="space-y-6">
                <Card>
                  <CardHeader className="border-b">
                    <CardTitle>{t("form.sections.basicsTitle")}</CardTitle>
                    <CardDescription>{t("form.sections.basicsSubtitle")}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="supplier-name">{t("fields.name")}</Label>
                        <Input
                          id="supplier-name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          aria-invalid={Boolean(errors.name)}
                        />
                        {errors.name ? <p className="text-xs text-destructive">{errors.name}</p> : null}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="supplier-paymentTerms">{t("fields.paymentTerms")}</Label>
                        <Input
                          id="supplier-paymentTerms"
                          value={paymentTerms}
                          onChange={(e) => setPaymentTerms(e.target.value)}
                          aria-invalid={Boolean(errors.paymentTerms)}
                          placeholder={t("placeholders.paymentTerms")}
                        />
                        {errors.paymentTerms ? (
                          <p className="text-xs text-destructive">{errors.paymentTerms}</p>
                        ) : (
                          <p className="text-xs text-muted-foreground">{t("hints.paymentTerms")}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="supplier-email">{t("fields.email")}</Label>
                        <Input
                          id="supplier-email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          inputMode="email"
                          autoComplete="off"
                          aria-invalid={Boolean(errors.email)}
                          placeholder={t("placeholders.email")}
                        />
                        {errors.email ? <p className="text-xs text-destructive">{errors.email}</p> : null}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="supplier-phone">{t("fields.phone")}</Label>
                        <Input
                          id="supplier-phone"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          inputMode="tel"
                          autoComplete="off"
                          placeholder={t("placeholders.phone")}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="border-b">
                    <CardTitle>{t("form.sections.detailsTitle")}</CardTitle>
                    <CardDescription>{t("form.sections.detailsSubtitle")}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="supplier-taxId">{t("fields.taxId")}</Label>
                        <Input
                          id="supplier-taxId"
                          value={taxId}
                          onChange={(e) => setTaxId(e.target.value)}
                          placeholder={t("placeholders.taxId")}
                          autoComplete="off"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="supplier-address">{t("fields.address")}</Label>
                        <Input
                          id="supplier-address"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder={t("placeholders.address")}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="supplier-notes">{t("fields.notes")}</Label>
                      <Textarea
                        id="supplier-notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder={t("placeholders.notes")}
                        className="min-h-[110px]"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="border-b">
                    <CardTitle>{t("form.sections.statusTitle")}</CardTitle>
                    <CardDescription>{t("form.sections.statusSubtitle")}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-0.5">
                      <div className="text-sm font-medium">{t("fields.isActive")}</div>
                      <div className="text-xs text-muted-foreground">{t("hints.isActive")}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="supplier-isActive"
                        checked={isActive}
                        onCheckedChange={setIsActive}
                        disabled={pending}
                      />
                      <Label htmlFor="supplier-isActive" className="text-sm">
                        {isActive ? tc("labels.active") : tc("labels.inactive")}
                      </Label>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          <DialogFooter className="border-t border-border px-4 py-3 sm:px-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
              {tc("actions.cancel")}
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {pending ? tc("actions.loading") : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
