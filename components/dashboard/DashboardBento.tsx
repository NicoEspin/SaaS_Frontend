"use client";

import type { ReactNode } from "react";

import dynamic from "next/dynamic";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  Package,
  ShoppingCart,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { formatCompact } from "@/components/dashboard/format";
import type {
  SalesPoint,
  StockSlice,
  TopSkuPoint,
} from "@/components/dashboard/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

function ChartSkeleton(props: { className?: string }) {
  return (
    <div
      className={cn(
        "h-full w-full rounded-lg border border-border bg-muted/20",
        "animate-pulse",
        props.className
      )}
    />
  );
}

const SalesChart = dynamic(
  () => import("@/components/dashboard/charts/SalesChart"),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

const StockChart = dynamic(
  () => import("@/components/dashboard/charts/StockChart"),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

const TopSkusChart = dynamic(
  () => import("@/components/dashboard/charts/TopSkusChart"),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

function KpiCard(props: {
  title: string;
  value: string;
  deltaLabel: string;
  icon: ReactNode;
  trend?: "up" | "down";
  tone?: "default" | "danger";
}) {
  const tone = props.tone ?? "default";
  const trend = props.trend ?? "up";
  const TrendIcon = trend === "down" ? ArrowDownRight : ArrowUpRight;

  return (
    <Card className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full blur-2xl",
          tone === "danger" ? "bg-destructive/15" : "bg-primary/12"
        )}
      />
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <CardDescription className="text-xs">{props.title}</CardDescription>
          <div
            className={cn(
              "grid h-9 w-9 place-items-center rounded-lg border",
              tone === "danger"
                ? "border-destructive/30 bg-destructive/10 text-destructive"
                : "border-border bg-muted text-foreground"
            )}
          >
            {props.icon}
          </div>
        </div>
        <div className="mt-1 flex items-end justify-between">
          <div className="text-2xl font-semibold tracking-tight">
            {props.value}
          </div>
          <div
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs",
              tone === "danger"
                ? "bg-destructive/10 text-destructive"
                : "bg-primary/10 text-primary"
            )}
          >
            <TrendIcon className="h-3.5 w-3.5" />
            {props.deltaLabel}
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}

export default function DashboardBento() {
  const t = useTranslations("Dashboard");

  const sales: SalesPoint[] = [
    { label: t("days.mon"), revenue: 12400, orders: 92 },
    { label: t("days.tue"), revenue: 9800, orders: 74 },
    { label: t("days.wed"), revenue: 15100, orders: 108 },
    { label: t("days.thu"), revenue: 16250, orders: 116 },
    { label: t("days.fri"), revenue: 13900, orders: 101 },
    { label: t("days.sat"), revenue: 8700, orders: 63 },
    { label: t("days.sun"), revenue: 11200, orders: 79 },
  ];

  const topSkus: TopSkuPoint[] = [
    { sku: "SKU-1023", units: 124 },
    { sku: "SKU-0841", units: 98 },
    { sku: "SKU-3312", units: 86 },
    { sku: "SKU-1409", units: 73 },
    { sku: "SKU-2207", units: 61 },
  ];

  const stock: StockSlice[] = [
    { name: t("stock.in"), value: 72 },
    { name: t("stock.low"), value: 21 },
    { name: t("stock.out"), value: 7 },
  ];

  const stockTotal = stock.reduce((acc, s) => acc + s.value, 0);
  const stockPct = stockTotal
    ? stock.map((s) => Math.round((s.value / stockTotal) * 100))
    : stock.map(() => 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-1.5 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{t("range")}</span>
            <span>{t("range30d")}</span>
          </div>
          <Button variant="secondary" className="hidden sm:inline-flex">
            {t("ctaExport")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
        <div className="md:col-span-2">
          <KpiCard
            title={t("kpis.revenue")}
            value={`$${formatCompact(83450)}`}
            deltaLabel={t("kpis.deltaUp", { value: "12%" })}
            icon={<BarChart3 className="h-4 w-4" />}
          />
        </div>
        <div className="md:col-span-2">
          <KpiCard
            title={t("kpis.orders")}
            value={formatCompact(642)}
            deltaLabel={t("kpis.deltaUp", { value: "8%" })}
            icon={<ShoppingCart className="h-4 w-4" />}
          />
        </div>
        <div className="md:col-span-1">
          <KpiCard
            title={t("kpis.onTime")}
            value={t("kpis.onTimeValue", { value: "96" })}
            deltaLabel={t("kpis.deltaUp", { value: "2%" })}
            icon={<CheckCircle2 className="h-4 w-4" />}
          />
        </div>
        <div className="md:col-span-1">
          <KpiCard
            title={t("kpis.alerts")}
            value={formatCompact(14)}
            deltaLabel={t("kpis.deltaDown", { value: "3" })}
            icon={<AlertTriangle className="h-4 w-4" />}
            tone="danger"
            trend="down"
          />
        </div>

        <Card className="md:col-span-4">
          <CardHeader>
            <CardTitle>{t("cards.salesTitle")}</CardTitle>
            <CardDescription>{t("cards.salesDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[320px]">
              <SalesChart data={sales} />
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>{t("cards.stockTitle")}</CardTitle>
            <CardDescription>{t("cards.stockDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[320px]">
              <StockChart data={stock} />
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
              <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
                <div className="text-muted-foreground">{t("stock.in")}</div>
                <div className="mt-1 font-semibold">{stockPct[0]}%</div>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
                <div className="text-muted-foreground">{t("stock.low")}</div>
                <div className="mt-1 font-semibold">{stockPct[1]}%</div>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
                <div className="text-muted-foreground">{t("stock.out")}</div>
                <div className="mt-1 font-semibold">{stockPct[2]}%</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>{t("cards.topTitle")}</CardTitle>
            <CardDescription>{t("cards.topDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[260px]">
              <TopSkusChart data={topSkus} />
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>{t("cards.activityTitle")}</CardTitle>
            <CardDescription>{t("cards.activityDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Package className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-foreground">
                    {t("activity.restock")}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t("activity.meta", { value: "2h" })}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-destructive/10 text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-foreground">
                    {t("activity.lowStock")}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t("activity.meta", { value: "5h" })}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
                  <ShoppingCart className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-foreground">
                    {t("activity.export")}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t("activity.meta", { value: "1d" })}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
