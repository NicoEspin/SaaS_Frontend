"use client";

import { Check, ChevronsUpDown, Loader2, ShieldAlert } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import axios from "axios";

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
import { cn } from "@/lib/utils";
import { getAxiosErrorMessage } from "@/lib/products/utils";
import { useAuthStore } from "@/stores/auth-store";

type Props = {
  className?: string;
  align?: "start" | "center" | "end";
};

function canSetActiveBranch(role: string | null) {
  return role === "ADMIN" || role === "OWNER";
}

export function ActiveBranchSelect({ className, align = "start" }: Props) {
  const t = useTranslations("BranchSwitcher");
  const tc = useTranslations("Common");

  const session = useAuthStore((s) => s.session);
  const sessionLoading = useAuthStore((s) => s.sessionLoading);
  const hydrateSession = useAuthStore((s) => s.hydrateSession);

  const role = session?.membership.role ?? null;
  const canSet = canSetActiveBranch(role);

  const activeBranch = session?.activeBranch ?? session?.branches[0] ?? null;

  const [open, setOpen] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  const selectedId = activeBranch?.id ?? null;

  const fetchBranches = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const items = await branchesApi.listNames({ signal: controller.signal });
      setBranches(items);
    } catch (err) {
      if (controller.signal.aborted) return;
      setError(getAxiosErrorMessage(err) ?? tc("errors.generic"));
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [tc]);

  const disabled = sessionLoading || !session || pending || !canSet;

  const triggerLabel = activeBranch ? activeBranch.name : t("trigger.placeholder");

  const trigger = (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={disabled}
      className={cn("w-full justify-between gap-2", className)}
      aria-label={t("trigger.aria", { branch: triggerLabel })}
    >
      <span className="min-w-0 truncate">{triggerLabel}</span>
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : (
        <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
      )}
    </Button>
  );

  const sorted = useMemo(() => {
    const seen = new Set<string>();
    const out: Branch[] = [];
    for (const b of branches) {
      if (seen.has(b.id)) continue;
      seen.add(b.id);
      out.push(b);
    }
    return out.slice().sort((a, b) => a.name.localeCompare(b.name));
  }, [branches]);

  if (session && !sessionLoading && !canSet) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{trigger}</TooltipTrigger>
        <TooltipContent side="bottom">{t("errors.forbidden")}</TooltipContent>
      </Tooltip>
    );
  }

  async function selectBranch(branchId: string) {
    if (!session) return;
    if (!canSet) {
      toast.error(t("errors.forbidden"));
      return;
    }
    if (pending) return;
    if (selectedId && branchId === selectedId) {
      setOpen(false);
      return;
    }

    setPending(true);
    try {
      await branchesApi.setActive({ branchId });
      await hydrateSession();
      toast.success(t("success.changed"));
      setOpen(false);
    } catch (err) {
      const status = axios.isAxiosError(err) ? err.response?.status ?? null : null;
      const msg = getAxiosErrorMessage(err);
      if (status === 403) toast.error(t("errors.forbidden"));
      else if (status === 400) toast.error(t("errors.invalid"));
      else toast.error(msg ?? tc("errors.generic"));
    } finally {
      setPending(false);
    }
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) void fetchBranches();
      }}
    >
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent align={align} className="w-[340px] p-0">
        <Command>
          <CommandInput placeholder={t("search.placeholder")} />
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
              <CommandGroup heading={t("list.title")}>
                <CommandItem disabled>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {tc("actions.loading")}
                </CommandItem>
              </CommandGroup>
            ) : sorted.length === 0 ? (
              <CommandEmpty>{t("list.empty")}</CommandEmpty>
            ) : (
              <>
                <CommandEmpty>{t("list.noResults")}</CommandEmpty>
                <CommandGroup heading={t("list.title")}>
                  {sorted.map((b) => {
                    const selected = selectedId === b.id;
                    return (
                      <CommandItem
                        key={b.id}
                        value={`${b.name} ${b.id}`}
                        onSelect={() => void selectBranch(b.id)}
                      >
                        <span className="min-w-0 flex-1 truncate">{b.name}</span>
                        {selected ? <Check className="h-4 w-4 text-primary" /> : null}
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
