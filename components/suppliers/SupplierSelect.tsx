"use client";

import axios from "axios";
import { Check, ChevronsUpDown, Loader2, ShieldAlert, Truck, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { suppliersApi } from "@/lib/suppliers/api";
import type { Supplier } from "@/lib/suppliers/types";
import { getAxiosErrorMessage } from "@/lib/products/utils";
import { cn } from "@/lib/utils";

type Props = {
  id?: string;
  value: string | null;
  onChange: (nextSupplierId: string | null) => void;
  disabled?: boolean;
  className?: string;
  align?: "start" | "center" | "end";
  allowAny?: boolean;
  includeInactive?: boolean;
};

function displaySupplierLabel(s: Supplier) {
  return s.taxId ? `${s.name} - ${s.taxId}` : s.name;
}

export function SupplierSelect({
  id,
  value,
  onChange,
  disabled,
  className,
  align = "start",
  allowAny,
  includeInactive = true,
}: Props) {
  const t = useTranslations("Suppliers");
  const tc = useTranslations("Common");

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<Supplier | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<number | null>(null);

  const selectedId = value ?? null;

  const fetchSuppliers = useCallback(
    async (q: string) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      setError(null);

      try {
        const res = await suppliersApi.suppliers.list(
          {
            limit: 30,
            q: q.trim() ? q.trim() : undefined,
            isActive: includeInactive ? undefined : true,
          },
          { signal: controller.signal }
        );

        if (controller.signal.aborted) return;

        const seen = new Set<string>();
        const deduped: Supplier[] = [];
        for (const s of res.items) {
          if (seen.has(s.id)) continue;
          seen.add(s.id);
          deduped.push(s);
        }

        setItems(deduped);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(getAxiosErrorMessage(err) ?? tc("errors.generic"));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    },
    [includeInactive, tc]
  );

  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) window.clearTimeout(debounceRef.current);

    const q = query.trim();
    if (!q) {
      void fetchSuppliers("");
      return () => abortRef.current?.abort();
    }

    debounceRef.current = window.setTimeout(() => {
      void fetchSuppliers(q);
    }, 250);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [fetchSuppliers, open, query]);

  useEffect(() => {
    if (!selectedId) {
      setSelected(null);
      return;
    }

    if (selected?.id === selectedId) return;
    const fromList = items.find((s) => s.id === selectedId) ?? null;
    if (fromList) {
      setSelected(fromList);
      return;
    }

    const controller = new AbortController();
    void suppliersApi.suppliers
      .get(selectedId, { signal: controller.signal })
      .then((s) => {
        setSelected(s);
      })
      .catch((err) => {
        const status = axios.isAxiosError(err) ? err.response?.status ?? null : null;
        if (status === 404) return;
        toast.error(getAxiosErrorMessage(err) ?? tc("errors.generic"));
      });

    return () => controller.abort();
  }, [items, selected?.id, selectedId, tc]);

  const triggerLabel = selected
    ? displaySupplierLabel(selected)
    : selectedId
      ? selectedId
      : t("supplierSelect.triggerPlaceholder");

  const showClear = Boolean(selectedId) && !disabled;

  const trigger = (
    <Button
      id={id}
      type="button"
      variant="outline"
      size="sm"
      disabled={disabled}
      className={cn("w-full justify-between gap-2", className)}
      aria-label={t("supplierSelect.triggerAria", { value: triggerLabel })}
    >
      <span className="min-w-0 truncate">{triggerLabel}</span>
      <span className="flex items-center gap-1">
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : showClear ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="text-muted-foreground"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onChange(null);
                  }}
                  aria-label={t("supplierSelect.clear")}
                >
                  <X className="h-3 w-3" />
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent side="top">{t("supplierSelect.clear")}</TooltipContent>
          </Tooltip>
        ) : null}
        <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
      </span>
    </Button>
  );

  const sorted = useMemo(() => {
    const out = items.slice();
    out.sort((a, b) => a.name.localeCompare(b.name));
    return out;
  }, [items]);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setQuery("");
          setError(null);
          abortRef.current?.abort();
        }
      }}
    >
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent align={align} className="w-[520px] max-w-[calc(100vw-2rem)] p-0">
        <Command shouldFilter={false}>
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder={t("supplierSelect.searchPlaceholder")}
          />
          <CommandList>
            {error ? (
              <div className="p-3">
                <Alert variant="destructive" className="border-destructive/30 bg-destructive/10">
                  <AlertDescription className="flex items-start gap-2">
                    <ShieldAlert className="mt-0.5 h-4 w-4" />
                    <span>{error}</span>
                  </AlertDescription>
                </Alert>
              </div>
            ) : null}

            {loading ? (
              <CommandGroup heading={t("supplierSelect.listTitle")}>
                <CommandItem disabled>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {tc("actions.loading")}
                </CommandItem>
              </CommandGroup>
            ) : sorted.length === 0 ? (
              <CommandEmpty>{t("supplierSelect.empty")}</CommandEmpty>
            ) : (
              <>
                <CommandEmpty>{t("supplierSelect.noResults")}</CommandEmpty>
                <CommandGroup heading={t("supplierSelect.listTitle")}>
                  {allowAny ? (
                    <CommandItem
                      value="__any__"
                      onSelect={() => {
                        onChange(null);
                        setOpen(false);
                      }}
                    >
                      <Truck className="h-4 w-4" />
                      <span className="min-w-0 flex-1 truncate">{t("supplierSelect.any")}</span>
                      {!selectedId ? <Check className="h-4 w-4 text-primary" /> : null}
                    </CommandItem>
                  ) : null}

                  {sorted.map((s) => {
                    const isSelected = selectedId === s.id;
                    const label = displaySupplierLabel(s);
                    return (
                      <CommandItem
                        key={s.id}
                        value={`${s.name} ${s.email ?? ""} ${s.taxId ?? ""} ${s.id}`}
                        onSelect={() => {
                          setSelected(s);
                          onChange(s.id);
                          setOpen(false);
                        }}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium">{label}</div>
                          <div className="truncate text-xs text-muted-foreground">
                            {s.email ?? tc("labels.none")} - {s.id}
                          </div>
                        </div>
                        {isSelected ? <Check className="h-4 w-4 text-primary" /> : null}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
