"use client";

import type { ComponentType } from "react";

import { BarChart3, Boxes, LayoutGrid, Package, Settings } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";
import { isLocale } from "@/i18n/locales";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  Icon: ComponentType<{ className?: string }>;
};

type Props = {
  collapsed: boolean;
};

function stripLocale(pathname: string) {
  const parts = pathname.split("/");
  const maybeLocale = parts[1] ?? "";
  if (isLocale(maybeLocale)) {
    const rest = parts.slice(2).join("/");
    return `/${rest}`;
  }
  return pathname;
}

export default function Sidebar({ collapsed }: Props) {
  const t = useTranslations("Nav");
  const pathname = usePathname();
  const logicalPath = stripLocale(pathname);

  const items: NavItem[] = [
    { href: "/dashboard", label: t("dashboard"), Icon: LayoutGrid },
    { href: "/inventory", label: t("inventory"), Icon: Boxes },
    { href: "/products", label: t("products"), Icon: Package },
    { href: "/reports", label: t("reports"), Icon: BarChart3 },
    { href: "/settings", label: t("settings"), Icon: Settings },
  ];

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
            {t("brand").slice(0, 1).toUpperCase()}
          </div>
          {!collapsed && (
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-wide text-foreground">
                {t("brand")}
              </div>
              <div className="text-xs text-muted-foreground">&nbsp;</div>
            </div>
          )}
        </Link>
      </div>

      <nav className={cn("flex-1 overflow-auto px-2 py-4", collapsed && "px-2")}>
        <div className="space-y-1">
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
