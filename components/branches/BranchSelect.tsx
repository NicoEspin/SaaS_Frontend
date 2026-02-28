"use client";

import axios from "axios";
import { Check, ChevronsUpDown, Loader2, ShieldAlert, X } from "lucide-react";
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
import { branchesApi } from "@/lib/branches/api";
import type { Branch } from "@/lib/branches/types";
import { getAxiosErrorMessage } from "@/lib/products/utils";
import { cn } from "@/lib/utils";

type Props = {
  id?: string;
  value: string | null;
  onChange: (nextBranchId: string | null) => void;
  disabled?: boolean;
  className?: string;
  align?: "start" | "center" | "end";
  allowAny?: boolean;
};

function displayBranchLabel(b: Branch) {
  return b.name;
}

export function BranchSelect({
  id,
  value,
  onChange,
  disabled,
  className,
  align = "start",
  allowAny,
}: Props) {
  const t = useTranslations("Branches");
  const tc = useTranslations("Common");

  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Branch | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const selectedId = value ?? null;

  const fetchBranches = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const list = await branchesApi.listNames({ signal: controller.signal });
      if (controller.signal.aborted) return;
      setItems(list);
    } catch (err) {
      if (controller.signal.aborted) return;
      setError(getAxiosErrorMessage(err) ?? tc("errors.generic"));
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [tc]);

  useEffect(() => {
    if (!selectedId) {
      setSelected(null);
      return;
    }

    if (selected?.id === selectedId) return;
    const fromList = items.find((b) => b.id === selectedId) ?? null;
    if (fromList) {
      setSelected(fromList);
      return;
    }

    const controller = new AbortController();
    void branchesApi
      .get(selectedId, { signal: controller.signal })
      .then((b) => {
        setSelected({ id: b.id, name: b.name });
      })
      .catch((err) => {
        const status = axios.isAxiosError(err) ? err.response?.status ?? null : null;
        if (status === 404) return;
        toast.error(getAxiosErrorMessage(err) ?? tc("errors.generic"));
      });

    return () => controller.abort();
  }, [items, selected?.id, selectedId, tc]);

  const triggerLabel = selected
    ? displayBranchLabel(selected)
    : selectedId
      ? selectedId
      : t("select.triggerPlaceholder");

  const showClear = Boolean(selectedId) && !disabled;

  const trigger = (
    <Button
      id={id}
      type="button"
      variant="outline"
      size="sm"
      disabled={disabled}
      className={cn("w-full justify-between gap-2", className)}
      aria-label={t("select.triggerAria", { value: triggerLabel })}
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
                  aria-label={t("select.clear")}
                >
                  <X className="h-3 w-3" />
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent side="top">{t("select.clear")}</TooltipContent>
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
        if (next) {
          void fetchBranches();
        } else {
          setError(null);
          abortRef.current?.abort();
        }
      }}
    >
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent align={align} className="w-[420px] max-w-[calc(100vw-2rem)] p-0">
        <Command>
          <CommandInput placeholder={t("select.searchPlaceholder")} />
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
              <CommandGroup heading={t("select.listTitle")}>
                <CommandItem disabled>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {tc("actions.loading")}
                </CommandItem>
              </CommandGroup>
            ) : sorted.length === 0 ? (
              <CommandEmpty>{t("select.empty")}</CommandEmpty>
            ) : (
              <>
                <CommandEmpty>{t("select.noResults")}</CommandEmpty>
                <CommandGroup heading={t("select.listTitle")}>
                  {allowAny ? (
                    <CommandItem
                      value="__any__"
                      onSelect={() => {
                        onChange(null);
                        setOpen(false);
                      }}
                    >
                      <span className="min-w-0 flex-1 truncate">{t("select.any")}</span>
                      {!selectedId ? <Check className="h-4 w-4 text-primary" /> : null}
                    </CommandItem>
                  ) : null}

                  {sorted.map((b) => {
                    const isSelected = selectedId === b.id;
                    return (
                      <CommandItem
                        key={b.id}
                        value={`${b.name} ${b.id}`}
                        onSelect={() => {
                          setSelected(b);
                          onChange(b.id);
                          setOpen(false);
                        }}
                      >
                        <span className="min-w-0 flex-1 truncate">{b.name}</span>
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
