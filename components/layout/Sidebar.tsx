"use client";

import type { ComponentType } from "react";
import { useMemo, useState } from "react";

import {
  BarChart3,
  Boxes,
  Building2,
  ChevronDown,
  ClipboardList,
  LayoutGrid,
  Package,
  ReceiptText,
  Settings,
  Truck,
  UserRound,
  Users,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";
import { stripLocaleFromPathname } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

type NavItem = {
  href: string;
  label: string;
  Icon: ComponentType<{ className?: string }>;
};

type Props = {
  collapsed: boolean;
};

export default function Sidebar({ collapsed }: Props) {
  const t = useTranslations("Nav");
  const pathname = usePathname();
  const logicalPath = stripLocaleFromPathname(pathname);

  const session = useAuthStore((s) => s.session);
  const sessionLoading = useAuthStore((s) => s.sessionLoading);
  const tenantName = session?.tenant.name ?? null;
  const role = session?.membership.role ?? null;
  const canSeeBranches = role === "ADMIN" || role === "OWNER";

  const brandTitle = tenantName ?? t("brand");
  const brandSubtitle = tenantName ? t("brand") : "\u00A0";
  const brandInitial = brandTitle.slice(0, 1).toUpperCase();

  const dashboardItem: NavItem = useMemo(
    () => ({ href: "/dashboard", label: t("dashboard"), Icon: LayoutGrid }),
    [t]
  );

  const items: NavItem[] = useMemo(
    () => [
      { href: "/inventory", label: t("inventory"), Icon: Boxes },
      { href: "/products", label: t("products"), Icon: Package },
      { href: "/suppliers", label: t("suppliers"), Icon: Truck },
      { href: "/purchase-orders", label: t("purchaseOrders"), Icon: ClipboardList },
      { href: "/clients", label: t("clients"), Icon: Users },
      { href: "/invoices", label: t("invoices"), Icon: ReceiptText },
      { href: "/reports", label: t("reports"), Icon: BarChart3 },
      { href: "/settings", label: t("settings"), Icon: Settings },
    ],
    [t]
  );

  const branchesActive =
    logicalPath === "/branches" ||
    logicalPath.startsWith("/branches/");

  const employeesActive =
    logicalPath === "/employees" ||
    logicalPath.startsWith("/employees/");

  const branchesGroupActive = branchesActive || employeesActive;

  const [branchesOpenManual, setBranchesOpenManual] = useState(false);
  const branchesOpen = branchesGroupActive || branchesOpenManual;

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-dvh flex-col border-r border-border bg-background/60 backdrop-blur md:flex",
        "transition-[width] duration-200",
        collapsed ? "w-[76px]" : "w-72"
      )}
    >
      <div
        className={cn(
          "flex h-14 items-center border-b border-border px-3",
          collapsed ? "justify-center" : "justify-between"
        )}
      >
        <Link
          href="/dashboard"
          className={cn(
            "flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            collapsed && "justify-center"
          )}
          aria-label={t("brand")}
        >
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
            {brandInitial}
          </div>
          {!collapsed && (
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-wide text-foreground">
                {sessionLoading ? <Skeleton className="h-4 w-40" /> : brandTitle}
              </div>
              <div className="text-xs text-muted-foreground">
                {sessionLoading ? <Skeleton className="mt-1 h-3 w-20" /> : brandSubtitle}
              </div>
            </div>
          )}
        </Link>
      </div>

      <nav className={cn("flex-1 overflow-auto px-2 py-4", collapsed && "px-2")}>
        <div className="space-y-1">
          {(() => {
            const active =
              logicalPath === dashboardItem.href ||
              logicalPath.startsWith(`${dashboardItem.href}/`);
            const Icon = dashboardItem.Icon;

            return (
              <Link
                key={dashboardItem.href}
                href={dashboardItem.href}
                aria-current={active ? "page" : undefined}
                title={collapsed ? dashboardItem.label : undefined}
                className={cn(
                  "group flex items-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  collapsed ? "h-10 justify-center px-2" : "h-10 gap-3 px-3",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0",
                    active
                      ? "text-primary-foreground"
                      : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                {!collapsed && <span className="truncate">{dashboardItem.label}</span>}
              </Link>
            );
          })()}

          {canSeeBranches ? (
            <Collapsible open={branchesOpen} onOpenChange={setBranchesOpenManual}>
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className={cn(
                    "group w-full justify-start rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    collapsed ? "h-10 justify-center px-2" : "h-10 gap-3 px-3",
                    branchesGroupActive
                      ? "bg-muted text-foreground hover:bg-muted"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                  title={collapsed ? t("branches") : undefined}
                  aria-label={t("branches")}
                >
                  <Building2
                    className={cn(
                      "h-4 w-4 shrink-0",
                      branchesGroupActive
                        ? "text-foreground"
                        : "text-muted-foreground group-hover:text-foreground"
                    )}
                  />

                  {!collapsed ? (
                    <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
                      <span className="truncate">{t("branches")}</span>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 shrink-0 opacity-70 transition-transform",
                          branchesOpen && "rotate-180"
                        )}
                      />
                    </span>
                  ) : null}
                </Button>
              </CollapsibleTrigger>

              <CollapsibleContent className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden">
                <div className="mt-1 space-y-1">
                  <Link
                    href="/branches"
                    aria-current={branchesActive ? "page" : undefined}
                    title={collapsed ? t("branches") : undefined}
                    className={cn(
                      "group flex items-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      collapsed
                        ? "h-9 justify-center px-2"
                        : "h-9 gap-3 pl-10 pr-3",
                      branchesActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Building2
                      className={cn(
                        "h-4 w-4 shrink-0",
                        branchesActive
                          ? "text-primary-foreground"
                          : "text-muted-foreground group-hover:text-foreground"
                      )}
                    />
                    {!collapsed && <span className="truncate">{t("branches")}</span>}
                  </Link>

                  <Link
                    href="/employees"
                    aria-current={employeesActive ? "page" : undefined}
                    title={collapsed ? t("employees") : undefined}
                    className={cn(
                      "group flex items-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      collapsed
                        ? "h-9 justify-center px-2"
                        : "h-9 gap-3 pl-10 pr-3",
                      employeesActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <UserRound
                      className={cn(
                        "h-4 w-4 shrink-0",
                        employeesActive
                          ? "text-primary-foreground"
                          : "text-muted-foreground group-hover:text-foreground"
                      )}
                    />
                    {!collapsed && <span className="truncate">{t("employees")}</span>}
                  </Link>
                </div>
              </CollapsibleContent>
            </Collapsible>
          ) : null}

          {items.map((item) => {
            const active =
              logicalPath === item.href || logicalPath.startsWith(`${item.href}/`);
            const Icon = item.Icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "group flex items-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  collapsed ? "h-10 justify-center px-2" : "h-10 gap-3 px-3",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0",
                    active
                      ? "text-primary-foreground"
                      : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}
