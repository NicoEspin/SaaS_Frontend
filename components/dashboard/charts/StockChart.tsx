"use client";

import { useTranslations } from "next-intl";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import type { StockSlice } from "@/components/dashboard/types";

const colors = {
  primary: "hsl(var(--primary))",
  ring: "hsl(var(--ring))",
  destructive: "hsl(var(--destructive))",
} as const;

type Props = {
  data: StockSlice[];
};

type PieTooltipProps = {
  active?: boolean;
  payload?: ReadonlyArray<{ name?: string; value?: number }>;
};

export default function StockChart({ data }: Props) {
  const t = useTranslations("Dashboard");

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Tooltip
          content={({ active, payload }: PieTooltipProps) => {
            if (!active || !payload?.length) return null;
            const p = payload[0];
            const name = typeof p.name === "string" ? p.name : t("tooltip.unknown");
            const value = typeof p.value === "number" ? p.value : 0;
            return (
              <div className="rounded-lg border border-border bg-background/95 px-3 py-2 text-xs shadow-sm backdrop-blur">
                <div className="font-medium text-foreground">{name}</div>
                <div className="mt-1 text-muted-foreground">
                  {t("tooltip.items", { value: String(value) })}
                </div>
              </div>
            );
          }}
        />
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={64}
          outerRadius={96}
          paddingAngle={4}
        >
          {data.map((slice, idx) => (
            <Cell
              key={`${slice.name}-${idx}`}
              fill={
                idx === 0 ? colors.primary : idx === 1 ? colors.ring : colors.destructive
              }
              stroke="transparent"
            />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}
