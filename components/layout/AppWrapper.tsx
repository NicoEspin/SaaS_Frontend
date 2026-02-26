"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import { useAuthStore } from "@/stores/auth-store";

type Props = {
  children: ReactNode;
};

export default function AppWrapper({ children }: Props) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const session = useAuthStore((s) => s.session);
  const sessionLoading = useAuthStore((s) => s.sessionLoading);
  const hydrateSession = useAuthStore((s) => s.hydrateSession);

  useEffect(() => {
    if (session || sessionLoading) return;
    void hydrateSession();
  }, [hydrateSession, session, sessionLoading]);

  return (
    <div className="relative min-h-dvh bg-background text-foreground">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(1100px_circle_at_10%_0%,hsl(var(--primary)/0.12),transparent_55%),radial-gradient(900px_circle_at_85%_20%,hsl(var(--ring)/0.10),transparent_50%)]"
      />

      <div className="relative mx-auto flex min-h-dvh w-full ">
        <Sidebar collapsed={sidebarCollapsed} />

        <div className="flex min-w-0 flex-1 flex-col">
          <Navbar
            sidebarCollapsed={sidebarCollapsed}
            onToggleSidebar={() => setSidebarCollapsed((v) => !v)}
          />

          <main className="flex-1 px-4 py-6 md:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
