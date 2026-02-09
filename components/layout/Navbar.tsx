"use client";

import { Moon, PanelLeftClose, PanelLeftOpen, Settings, Sun } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Link, useRouter } from "@/i18n/navigation";
import { useThemeStore } from "@/stores/theme-store";

type Props = {
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
};

export default function Navbar({ sidebarCollapsed, onToggleSidebar }: Props) {
  const t = useTranslations("Nav");
  const router = useRouter();
  const mode = useThemeStore((s) => s.mode);
  const toggleMode = useThemeStore((s) => s.toggleMode);

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
            N
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
        </div>
      </div>
    </header>
  );
}
