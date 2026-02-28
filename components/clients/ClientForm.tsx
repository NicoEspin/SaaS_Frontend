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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { customersApi } from "@/lib/clients/api";
import type { Customer, CustomerType, TaxIdType, VatCondition } from "@/lib/clients/types";
import { useClientMutations } from "@/lib/clients/hooks/use-client-mutations";
import { getAxiosErrorMessage } from "@/lib/products/utils";
import { isValidEmail } from "@/lib/validators";

type Mode = "create" | "edit";

const UNSET_SELECT_VALUE = "__unset__";

type FieldErrors = Record<string, string>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: Mode;
  customerId: string | null;
  onSaved: () => void;
};

const TYPE_VALUES: CustomerType[] = ["RETAIL", "WHOLESALE"];
const TAX_ID_TYPE_VALUES: TaxIdType[] = ["CUIT", "CUIL", "DNI", "PASSPORT", "FOREIGN"];
const VAT_CONDITION_VALUES: VatCondition[] = [
  "REGISTERED",
  "MONOTAX",
  "EXEMPT",
  "FINAL_CONSUMER",
  "FOREIGN",
];

export function ClientForm({ open, onOpenChange, mode, customerId, onSaved }: Props) {
  const t = useTranslations("Clients");
  const tc = useTranslations("Common");
  const { submitting, createCustomer, updateCustomer } = useClientMutations();

  const [customerLoading, setCustomerLoading] = useState(false);
  const [loadedCustomer, setLoadedCustomer] = useState<Customer | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const loadAbortRef = useRef<AbortController | null>(null);

  const initial = useMemo(() => {
    const c = loadedCustomer;
    if (mode === "edit" && c) {
      return {
        code: c.code ?? "",
        type: c.type,
        name: c.name,
        taxId: c.taxId ?? "",
        taxIdType: c.taxIdType ?? UNSET_SELECT_VALUE,
        vatCondition: c.vatCondition ?? UNSET_SELECT_VALUE,
        email: c.email ?? "",
        phone: c.phone ?? "",
        address: c.address ?? "",
        notes: c.notes ?? "",
        isActive: c.isActive,
      };
    }

    return {
      code: "",
      type: "RETAIL" as CustomerType,
      name: "",
      taxId: "",
      taxIdType: UNSET_SELECT_VALUE,
      vatCondition: UNSET_SELECT_VALUE,
      email: "",
      phone: "",
      address: "",
      notes: "",
      isActive: true,
    };
  }, [loadedCustomer, mode]);

  const [code, setCode] = useState(initial.code);
  const [type, setType] = useState<CustomerType>(initial.type);
  const [name, setName] = useState(initial.name);
  const [taxId, setTaxId] = useState(initial.taxId);
  const [taxIdType, setTaxIdType] = useState<string>(initial.taxIdType);
  const [vatCondition, setVatCondition] = useState<string>(initial.vatCondition);
  const [email, setEmail] = useState(initial.email);
  const [phone, setPhone] = useState(initial.phone);
  const [address, setAddress] = useState(initial.address);
  const [notes, setNotes] = useState(initial.notes);
  const [isActive, setIsActive] = useState(initial.isActive);

  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    setFormError(null);
    setErrors({});

    if (mode === "create") {
      setLoadedCustomer(null);
      setLoadError(null);
      setCustomerLoading(false);

      setCode("");
      setType("RETAIL");
      setName("");
      setTaxId("");
      setTaxIdType(UNSET_SELECT_VALUE);
      setVatCondition(UNSET_SELECT_VALUE);
      setEmail("");
      setPhone("");
      setAddress("");
      setNotes("");
      setIsActive(true);
    }
  }, [mode, open]);

  useEffect(() => {
    if (!open || mode !== "edit") return;
    if (!customerId) {
      setLoadError(tc("errors.generic"));
      return;
    }

    loadAbortRef.current?.abort();
    const controller = new AbortController();
    loadAbortRef.current = controller;

    setCustomerLoading(true);
    setLoadError(null);
    setLoadedCustomer(null);

    void (async () => {
      try {
        const c = await customersApi.customers.get(customerId, { signal: controller.signal });
        if (controller.signal.aborted) return;
        setLoadedCustomer(c);

        setCode(c.code ?? "");
        setType(c.type);
        setName(c.name);
        setTaxId(c.taxId ?? "");
        setTaxIdType(c.taxIdType ?? UNSET_SELECT_VALUE);
        setVatCondition(c.vatCondition ?? UNSET_SELECT_VALUE);
        setEmail(c.email ?? "");
        setPhone(c.phone ?? "");
        setAddress(c.address ?? "");
        setNotes(c.notes ?? "");
        setIsActive(c.isActive);
      } catch (err) {
        if (controller.signal.aborted) return;
        setLoadError(getAxiosErrorMessage(err) ?? tc("errors.generic"));
      } finally {
        if (!controller.signal.aborted) setCustomerLoading(false);
      }
    })();

    return () => controller.abort();
  }, [customerId, mode, open, tc]);

  function validate() {
    const next: FieldErrors = {};
    const cleanName = name.trim();
    const cleanEmail = email.trim();

    if (!cleanName) next.name = t("validation.nameRequired");
    else if (cleanName.length > 200) next.name = t("validation.nameMax", { max: 200 });

    if (cleanEmail && !isValidEmail(cleanEmail)) next.email = t("validation.invalidEmail");

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!validate()) return;

    const cleanCode = code.trim();
    const cleanName = name.trim();
    const cleanTaxId = taxId.trim();
    const cleanEmail = email.trim();
    const cleanPhone = phone.trim();
    const cleanAddress = address.trim();
    const cleanNotes = notes.trim();

    try {
      if (mode === "edit") {
        if (!customerId) throw new Error("Missing customerId");

        await updateCustomer(customerId, {
          code: cleanCode ? cleanCode : null,
          type,
          name: cleanName,
          taxId: cleanTaxId ? cleanTaxId : null,
          taxIdType: taxIdType === UNSET_SELECT_VALUE ? null : (taxIdType as TaxIdType),
          vatCondition: vatCondition === UNSET_SELECT_VALUE ? null : (vatCondition as VatCondition),
          email: cleanEmail ? cleanEmail : null,
          phone: cleanPhone ? cleanPhone : null,
          address: cleanAddress ? cleanAddress : null,
          notes: cleanNotes ? cleanNotes : null,
          isActive,
        });

        toast.success(t("success.updated"));
      } else {
        await createCustomer({
          code: cleanCode ? cleanCode : undefined,
          type,
          name: cleanName,
          taxId: cleanTaxId ? cleanTaxId : undefined,
          taxIdType: taxIdType === UNSET_SELECT_VALUE ? undefined : (taxIdType as TaxIdType),
          vatCondition:
            vatCondition === UNSET_SELECT_VALUE ? undefined : (vatCondition as VatCondition),
          email: cleanEmail ? cleanEmail : undefined,
          phone: cleanPhone ? cleanPhone : undefined,
          address: cleanAddress ? cleanAddress : undefined,
          notes: cleanNotes ? cleanNotes : undefined,
          isActive,
        });

        toast.success(t("success.created"));
      }

      onOpenChange(false);
      onSaved();
    } catch (err) {
      const msg = getAxiosErrorMessage(err);
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        const text = msg ?? t("errors.codeConflict");
        setFormError(text);
        toast.error(text);
        return;
      }

      const text = msg ?? tc("errors.generic");
      setFormError(text);
      toast.error(text);
    }
  }

  const pending = Boolean(submitting) || customerLoading;
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
      <DialogContent className="flex max-h-[90vh] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl">
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

            {customerLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-36 w-full" />
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
                        <Label htmlFor="customer_name">{t("fields.name")}</Label>
                        <Input
                          id="customer_name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder={t("placeholders.name")}
                          aria-invalid={Boolean(errors.name)}
                        />
                        {errors.name ? (
                          <p className="text-sm text-destructive">{errors.name}</p>
                        ) : null}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="customer_code">{t("fields.code")}</Label>
                        <Input
                          id="customer_code"
                          value={code}
                          onChange={(e) => setCode(e.target.value)}
                          placeholder={t("placeholders.code")}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="customer_type">{t("fields.type")}</Label>
                        <Select value={type} onValueChange={(v) => setType(v as CustomerType)}>
                          <SelectTrigger id="customer_type" className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TYPE_VALUES.map((v) => (
                              <SelectItem key={v} value={v}>
                                {t(`enums.type.${v}`)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="customer_isActive">{t("fields.isActive")}</Label>
                        <div className="flex items-center gap-3 rounded-md border border-border px-3 py-2">
                          <Switch
                            id="customer_isActive"
                            checked={isActive}
                            onCheckedChange={setIsActive}
                          />
                          <div className="text-sm">
                            {isActive ? tc("labels.active") : tc("labels.inactive")}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="border-b">
                    <CardTitle>{t("form.sections.billingTitle")}</CardTitle>
                    <CardDescription>{t("form.sections.billingSubtitle")}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="customer_taxId">{t("fields.taxId")}</Label>
                        <Input
                          id="customer_taxId"
                          value={taxId}
                          onChange={(e) => setTaxId(e.target.value)}
                          placeholder={t("placeholders.taxId")}
                          inputMode="numeric"
                          autoComplete="off"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="customer_taxIdType">{t("fields.taxIdType")}</Label>
                        <Select value={taxIdType} onValueChange={setTaxIdType}>
                          <SelectTrigger id="customer_taxIdType" className="w-full">
                            <SelectValue placeholder={tc("labels.select")} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={UNSET_SELECT_VALUE}>{tc("labels.none")}</SelectItem>
                            {TAX_ID_TYPE_VALUES.map((v) => (
                              <SelectItem key={v} value={v}>
                                {t(`enums.taxIdType.${v}`)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="customer_vatCondition">{t("fields.vatCondition")}</Label>
                      <Select value={vatCondition} onValueChange={setVatCondition}>
                        <SelectTrigger id="customer_vatCondition" className="w-full">
                          <SelectValue placeholder={tc("labels.select")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={UNSET_SELECT_VALUE}>{tc("labels.none")}</SelectItem>
                          {VAT_CONDITION_VALUES.map((v) => (
                            <SelectItem key={v} value={v}>
                              {t(`enums.vatCondition.${v}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="border-b">
                    <CardTitle>{t("form.sections.contactTitle")}</CardTitle>
                    <CardDescription>{t("form.sections.contactSubtitle")}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="customer_email">{t("fields.email")}</Label>
                        <Input
                          id="customer_email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder={t("placeholders.email")}
                          inputMode="email"
                          autoComplete="off"
                          aria-invalid={Boolean(errors.email)}
                        />
                        {errors.email ? (
                          <p className="text-sm text-destructive">{errors.email}</p>
                        ) : null}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="customer_phone">{t("fields.phone")}</Label>
                        <Input
                          id="customer_phone"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder={t("placeholders.phone")}
                          inputMode="tel"
                          autoComplete="off"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="customer_address">{t("fields.address")}</Label>
                      <Textarea
                        id="customer_address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder={t("placeholders.address")}
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="border-b">
                    <CardTitle>{t("form.sections.notesTitle")}</CardTitle>
                    <CardDescription>{t("form.sections.notesSubtitle")}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Label htmlFor="customer_notes">{t("fields.notes")}</Label>
                    <Textarea
                      id="customer_notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder={t("placeholders.notes")}
                      rows={4}
                    />
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          <DialogFooter className="border-t border-border px-4 py-3 sm:px-6">
            <div className="flex w-full items-center justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
                {tc("actions.cancel")}
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {pending ? tc("actions.loading") : submitLabel}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
