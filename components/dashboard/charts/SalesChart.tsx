"use client";

import { useTranslations } from "next-intl";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatCompact } from "@/components/dashboard/format";
import type { SalesPoint } from "@/components/dashboard/types";

const colors = {
  primary: "hsl(var(--primary))",
  primarySoft: "hsl(var(--primary) / 0.18)",
  ring: "hsl(var(--ring))",
  border: "hsl(var(--border))",
  muted: "hsl(var(--muted-foreground))",
} as const;

function ChartTooltip(props: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number }>;
  label?: string;
}) {
  const t = useTranslations("Dashboard");

  if (!props.active || !props.payload?.length) return null;

  return (
    <div className="rounded-lg border border-border bg-background/95 px-3 py-2 text-xs shadow-sm backdrop-blur">
      <div className="font-medium text-foreground">{props.label}</div>
      <div className="mt-1 space-y-1 text-muted-foreground">
        {props.payload.map((p, idx) => (
          <div key={idx} className="flex items-center justify-between gap-4">
            <span>
              {p.name === "revenue"
                ? t("legendRevenue")
                : p.name === "orders"
                  ? t("legendOrders")
                  : p.name ?? ""}
            </span>
            <span className="font-medium text-foreground">
              {typeof p.value === "number" ? formatCompact(p.value) : ""}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

type Props = {
  data: SalesPoint[];
};

export default function SalesChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ left: 8, right: 16 }}>
        <defs>
          <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={colors.primary} stopOpacity={0.25} />
            <stop offset="95%" stopColor={colors.primary} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={colors.border} strokeDasharray="3 3" />
        <XAxis dataKey="label" stroke={colors.muted} tickLine={false} axisLine={false} />
        <YAxis
          stroke={colors.muted}
          tickLine={false}
          axisLine={false}
          tickFormatter={formatCompact}
        />
        <Tooltip content={<ChartTooltip />} />
        <Area
          type="monotone"
          dataKey="revenue"
          name="revenue"
          stroke={colors.primary}
          fill="url(#revFill)"
          strokeWidth={2}
          activeDot={{ r: 5 }}
        />
        <Area
          type="monotone"
          dataKey="orders"
          name="orders"
          stroke={colors.ring}
          fill={colors.primarySoft}
          strokeWidth={2}
          activeDot={{ r: 4 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
