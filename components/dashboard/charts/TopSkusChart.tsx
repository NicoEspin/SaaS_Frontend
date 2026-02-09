"use client";

import { useTranslations } from "next-intl";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatCompact } from "@/components/dashboard/format";
import type { TopSkuPoint } from "@/components/dashboard/types";

const colors = {
  primary: "hsl(var(--primary))",
  border: "hsl(var(--border))",
  muted: "hsl(var(--muted-foreground))",
} as const;

type Props = {
  data: TopSkuPoint[];
};

export default function TopSkusChart({ data }: Props) {
  const t = useTranslations("Dashboard");

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ left: 8, right: 16 }}>
        <CartesianGrid stroke={colors.border} strokeDasharray="3 3" />
        <XAxis dataKey="sku" stroke={colors.muted} tickLine={false} axisLine={false} />
        <YAxis
          stroke={colors.muted}
          tickLine={false}
          axisLine={false}
          tickFormatter={formatCompact}
        />
        <Tooltip
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            const value = payload[0]?.value;
            return (
              <div className="rounded-lg border border-border bg-background/95 px-3 py-2 text-xs shadow-sm backdrop-blur">
                <div className="font-medium text-foreground">{label}</div>
                <div className="mt-1 text-muted-foreground">
                  {t("tooltip.units", {
                    value: typeof value === "number" ? String(value) : "0",
                  })}
                </div>
              </div>
            );
          }}
        />
        <Bar dataKey="units" fill={colors.primary} radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
