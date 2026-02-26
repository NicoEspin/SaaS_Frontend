"use client";

import {
  LogOut,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Sun,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useRouter } from "@/i18n/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { useThemeStore } from "@/stores/theme-store";

function initialsFromName(name: string) {
  const parts = name
    .split(/\s+/g)
    .map((p) => p.trim())
    .filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
  const out = `${first}${last}`.toUpperCase();
  return out || "?";
}

type Props = {
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
};

export default function Navbar({ sidebarCollapsed, onToggleSidebar }: Props) {
  const t = useTranslations("Nav");
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const session = useAuthStore((s) => s.session);
  const sessionLoading = useAuthStore((s) => s.sessionLoading);
  const mode = useThemeStore((s) => s.mode);
  const toggleMode = useThemeStore((s) => s.toggleMode);

  const activeBranch = session?.activeBranch ?? session?.branches[0] ?? null;
  const userFullName = session?.user.fullName ?? null;
  const avatarText = userFullName ? initialsFromName(userFullName) : "?";

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/70 backdrop-blur">
      <div className="flex h-14 items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-2">
          <div className="hidden md:block">
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleSidebar}
              aria-label={
                sidebarCollapsed ? t("expandSidebar") : t("collapseSidebar")
              }
              className="border border-transparent hover:border-border"
            >
              {sidebarCollapsed ? (
                <PanelLeftOpen className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </Button>
          </div>

          <Link
            href="/dashboard"
            className="text-sm font-semibold tracking-wide text-foreground"
          >
            {t("brand")}
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {sessionLoading ? (
            <div className="hidden items-center gap-2 md:flex">
              <Skeleton className="h-6 w-28" />
              <Skeleton className="h-6 w-36" />
            </div>
          ) : session ? (
            <div className="hidden items-center gap-2 md:flex">
              {activeBranch ? (
                <Badge
                  variant="secondary"
                  className="max-w-56 truncate"
                  aria-label={t("activeBranchAria", { branch: activeBranch.name })}
                >
                  {activeBranch.name}
                </Badge>
              ) : null}

              {userFullName ? (
                <div
                  className="max-w-72 truncate text-sm text-muted-foreground"
                  aria-label={t("userAria", { name: userFullName })}
                >
                  {userFullName}
                </div>
              ) : null}
            </div>
          ) : null}

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMode}
            aria-label={mode === "dark" ? t("themeToLight") : t("themeToDark")}
            className="border border-transparent hover:border-border"
          >
            {mode === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>

          <div
            className="grid h-9 w-9 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground"
            aria-hidden="true"
          >
            {avatarText}
          </div>

          <Button
            variant="outline"
            size="icon"
            className="rounded-full"
            aria-label={t("openSettings")}
            onClick={() => router.push("/settings")}
          >
            <Settings className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            aria-label={t("logout")}
            onClick={() => void logout({ reason: "manual" })}
            className="border border-transparent hover:border-border"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
