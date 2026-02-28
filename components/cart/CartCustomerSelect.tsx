"use client";

import axios from "axios";
import { Check, ChevronsUpDown, Loader2, ShieldAlert, UserRound, X } from "lucide-react";
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
import { customersApi } from "@/lib/clients/api";
import type { Customer } from "@/lib/clients/types";
import { getAxiosErrorMessage } from "@/lib/products/utils";
import { cn } from "@/lib/utils";

type Props = {
  id?: string;
  value: string | null;
  onChange: (nextCustomerId: string | null) => void;
  disabled?: boolean;
  className?: string;
  align?: "start" | "center" | "end";
};

function displayCustomerLabel(c: Customer) {
  const tax = c.taxId ? ` - ${c.taxId}` : "";
  return `${c.name}${tax}`;
}

export function CartCustomerSelect({
  id,
  value,
  onChange,
  disabled,
  className,
  align = "start",
}: Props) {
  const t = useTranslations("Cart");
  const tc = useTranslations("Common");

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<Customer | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<number | null>(null);

  const selectedId = value ?? null;

  const fetchCustomers = useCallback(
    async (q: string) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      setError(null);

      try {
        const res = await customersApi.customers.list(
          {
            isActive: true,
            limit: 30,
            q: q.trim() ? q.trim() : undefined,
          },
          { signal: controller.signal }
        );

        if (controller.signal.aborted) return;

        const seen = new Set<string>();
        const deduped: Customer[] = [];
        for (const c of res.items) {
          if (seen.has(c.id)) continue;
          seen.add(c.id);
          deduped.push(c);
        }

        setItems(deduped);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(getAxiosErrorMessage(err) ?? tc("errors.generic"));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    },
    [tc]
  );

  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) window.clearTimeout(debounceRef.current);

    const q = query.trim();
    if (!q) {
      void fetchCustomers("");
      return () => abortRef.current?.abort();
    }

    debounceRef.current = window.setTimeout(() => {
      void fetchCustomers(q);
    }, 250);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [fetchCustomers, open, query]);

  useEffect(() => {
    if (!selectedId) {
      setSelected(null);
      return;
    }

    if (selected?.id === selectedId) return;
    const fromList = items.find((c) => c.id === selectedId) ?? null;
    if (fromList) {
      setSelected(fromList);
      return;
    }

    const controller = new AbortController();
    void customersApi.customers
      .get(selectedId, { signal: controller.signal })
      .then((c) => {
        setSelected(c);
      })
      .catch((err) => {
        const status = axios.isAxiosError(err) ? err.response?.status ?? null : null;
        if (status === 404) return;
        toast.error(getAxiosErrorMessage(err) ?? tc("errors.generic"));
      });

    return () => controller.abort();
  }, [items, selected?.id, selectedId, tc]);

  const triggerLabel = selected
    ? displayCustomerLabel(selected)
    : selectedId
      ? selectedId
      : t("customerSelect.triggerPlaceholder");

  const showClear = Boolean(selectedId) && !disabled;

  const trigger = (
    <Button
      id={id}
      type="button"
      variant="outline"
      size="sm"
      disabled={disabled}
      className={cn("w-full justify-between gap-2", className)}
      aria-label={t("customerSelect.triggerAria", { value: triggerLabel })}
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
                  aria-label={t("customerSelect.clear")}
                >
                  <X className="h-3 w-3" />
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent side="top">{t("customerSelect.clear")}</TooltipContent>
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
      <PopoverContent align={align} className="w-[420px] max-w-[calc(100vw-2rem)] p-0">
        <Command shouldFilter={false}>
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder={t("customerSelect.searchPlaceholder")}
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
              <CommandGroup heading={t("customerSelect.listTitle")}> 
                <CommandItem disabled>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {tc("actions.loading")}
                </CommandItem>
              </CommandGroup>
            ) : sorted.length === 0 ? (
              <CommandEmpty>{t("customerSelect.empty")}</CommandEmpty>
            ) : (
              <>
                <CommandEmpty>{t("customerSelect.noResults")}</CommandEmpty>
                <CommandGroup heading={t("customerSelect.listTitle")}>
                  <CommandItem
                    value="__final_consumer__"
                    onSelect={() => {
                      onChange(null);
                      setOpen(false);
                    }}
                  >
                    <UserRound className="h-4 w-4" />
                    <span className="min-w-0 flex-1 truncate">{t("labels.finalConsumer")}</span>
                    {!selectedId ? <Check className="h-4 w-4 text-primary" /> : null}
                  </CommandItem>

                  {sorted.map((c) => {
                    const isSelected = selectedId === c.id;
                    return (
                      <CommandItem
                        key={c.id}
                        value={`${c.name} ${c.taxId ?? ""} ${c.code ?? ""} ${c.id}`}
                        onSelect={() => {
                          setSelected(c);
                          onChange(c.id);
                          setOpen(false);
                        }}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium">{c.name}</div>
                          <div className="truncate text-xs text-muted-foreground">
                            {c.taxId ?? tc("labels.none")} - {c.id}
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
