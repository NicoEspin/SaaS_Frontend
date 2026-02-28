"use client";

import {
  CheckCircle2,
  Loader2,
  Minus,
  PackagePlus,
  Plus,
  RefreshCw,
  Search,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";

import { CartCustomerSelect } from "@/components/cart/CartCustomerSelect";
import { CreateCustomerDialog } from "@/components/cart/CreateCustomerDialog";
import { EmptyState } from "@/components/empty-state/EmptyState";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { BranchInventoryItem } from "@/lib/inventory/types";
import { useInventoryList } from "@/lib/inventory/hooks/use-inventory-list";
import { cn } from "@/lib/utils";
import { useCart } from "@/components/cart/cart-context";
import { useCartUiStore } from "@/stores/cart-ui-store";

function formatMoneyString(value: string) {
  const n = Number(value);
  if (!Number.isFinite(n)) return value;
  return new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

function formatMoneyNumber(value: number) {
  return new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

function matchesInventoryQuery(item: BranchInventoryItem, q: string) {
  const query = q.trim().toLowerCase();
  if (!query) return true;
  return (
    item.productCode.toLowerCase().includes(query) ||
    item.productName.toLowerCase().includes(query)
  );
}

type QtyControlProps = {
  value: number;
  disabled?: boolean;
  pending?: boolean;
  onChange: (next: number) => void;
};

function QtyControl({ value, disabled, pending, onChange }: QtyControlProps) {
  const t = useTranslations("Cart");
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  function commit(next: string) {
    const n = Number(next);
    if (!Number.isFinite(n)) {
      setDraft(String(value));
      return;
    }
    onChange(Math.max(0, Math.floor(n)));
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <Button
        type="button"
        variant="outline"
        size="icon-xs"
        disabled={disabled || pending || value <= 0}
        aria-label={t("cartTable.qtyDecrease")}
        onClick={() => onChange(Math.max(0, value - 1))}
      >
        <Minus className="h-3 w-3" />
      </Button>
      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => commit(draft)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit(draft);
          }
          if (e.key === "Escape") {
            e.preventDefault();
            setDraft(String(value));
            (e.target as HTMLInputElement).blur();
          }
        }}
        type="number"
        min={0}
        inputMode="numeric"
        className="h-8 w-16 text-right tabular-nums"
        disabled={disabled || pending}
        aria-label={t("cartTable.qtyInput")}
      />
      <Button
        type="button"
        variant="outline"
        size="icon-xs"
        disabled={disabled || pending}
        aria-label={t("cartTable.qtyIncrease")}
        onClick={() => onChange(value + 1)}
      >
        <Plus className="h-3 w-3" />
      </Button>
    </div>
  );
}

export function CartSheet() {
  const t = useTranslations("Cart");
  const tc = useTranslations("Common");

  const open = useCartUiStore((s) => s.open);
  const setOpen = useCartUiStore((s) => s.setOpen);
  const selectedCustomerId = useCartUiStore((s) => s.selectedCustomerId);
  const setSelectedCustomerId = useCartUiStore((s) => s.setSelectedCustomerId);
  const docType = useCartUiStore((s) => s.docType);
  const setDocType = useCartUiStore((s) => s.setDocType);

  const {
    activeBranchId,
    cart,
    loading,
    error,
    pendingByProductId,
    checkoutPending,
    view,
    lastSale,
    refreshCart,
    addItem,
    setItemQty,
    removeItem,
    checkout,
    openPdf,
    startNewSale,
  } = useCart();

  const [tab, setTab] = useState<"inventory" | "cart">("inventory");
  const [createCustomerOpen, setCreateCustomerOpen] = useState(false);

  const itemCount = cart?.items.length ?? 0;
  const cartEditable = cart?.status === "DRAFT";

  const canCheckout = Boolean(
    activeBranchId &&
      cart &&
      cartEditable &&
      cart.items.length > 0 &&
      !(docType === "A" && !selectedCustomerId) &&
      !checkoutPending
  );

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setTab("inventory");
      }}
    >
      <SheetContent
        side="right"
        className="w-full sm:w-[1100px] sm:max-w-[1100px]"
      >
        <SheetHeader className="pb-2">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <SheetTitle className="flex items-center gap-2 text-base">
                <ShoppingCart className="h-5 w-5" />
                {t("title")}
                {itemCount > 0 ? (
                  <Badge variant="secondary" className="ml-1 tabular-nums">
                    {itemCount}
                  </Badge>
                ) : null}
              </SheetTitle>
              <SheetDescription>{t("subtitle")}</SheetDescription>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void refreshCart()}
              disabled={!activeBranchId || loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              {loading ? tc("actions.loading") : tc("actions.refresh")}
            </Button>
          </div>
        </SheetHeader>

        <Separator />

        {error ? (
          <div className="px-4">
            <Alert variant="destructive" className="border-destructive/30 bg-destructive/10">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        ) : null}

        {!activeBranchId ? (
          <div className="px-4">
            <Alert variant="destructive" className="border-destructive/30 bg-destructive/10">
              <AlertDescription>{t("errors.noBranch")}</AlertDescription>
            </Alert>
          </div>
        ) : null}

        {view === "success" && lastSale ? (
          <div className="flex min-h-0 flex-1 flex-col gap-4 px-4">
            <Alert className="border-border bg-background/60 backdrop-blur">
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>{t("success.title")}</AlertTitle>
              <AlertDescription>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{t("success.invoice")}: {lastSale.number}</Badge>
                  <Badge variant="secondary">{t("success.total")}: {formatMoneyString(lastSale.total)}</Badge>
                </div>
              </AlertDescription>
            </Alert>

            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" onClick={() => void openPdf(lastSale.invoiceId)}>
                {t("actions.print")}
              </Button>
              <Button type="button" variant="outline" onClick={() => void startNewSale()}>
                {t("actions.newSale")}
              </Button>
            </div>

            <div className="text-sm text-muted-foreground">{t("success.ready")}</div>
          </div>
        ) : (
          <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 px-4 md:grid-cols-[1fr_340px]">
            <div className="min-h-0">
              <Tabs value={tab} onValueChange={(v) => setTab(v as "inventory" | "cart")}>
                <TabsList className="w-full justify-start">
                  <TabsTrigger value="inventory">{t("tabs.inventory")}</TabsTrigger>
                  <TabsTrigger value="cart">{t("tabs.cart")}</TabsTrigger>
                </TabsList>

                <TabsContent value="inventory" className="mt-3 min-h-0">
                  {activeBranchId ? (
                    <CartInventoryPanel
                      branchId={activeBranchId}
                      disabled={!cartEditable || checkoutPending}
                      onAdd={(productId) => void addItem(productId, 1)}
                    />
                  ) : (
                    <EmptyState
                      title={t("errors.noBranchTitle")}
                      description={t("errors.noBranch")}
                    />
                  )}
                </TabsContent>

                <TabsContent value="cart" className="mt-3 min-h-0">
                  <CartItemsPanel
                    disabled={!cartEditable || checkoutPending}
                    cartEditable={cartEditable}
                    pendingByProductId={pendingByProductId}
                    onSetQty={(productId, qty) => void setItemQty(productId, qty)}
                    onRemove={(productId) => void removeItem(productId)}
                    onGoToInventory={() => setTab("inventory")}
                  />
                </TabsContent>
              </Tabs>
            </div>

            <div className="min-h-0">
              <ScrollArea className="h-full">
                <div className="space-y-4 pb-6">
                  <Card className="bg-background/60 backdrop-blur">
                    <CardHeader>
                      <CardTitle className="text-sm">{t("sidebar.customer.title")}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <CartCustomerSelect
                        value={selectedCustomerId}
                        onChange={setSelectedCustomerId}
                        disabled={checkoutPending}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full"
                        disabled={checkoutPending}
                        onClick={() => setCreateCustomerOpen(true)}
                      >
                        {t("actions.createCustomer")}
                      </Button>
                      <div className="text-xs text-muted-foreground">{t("sidebar.customer.hint")}</div>
                    </CardContent>
                  </Card>

                  <Card className="bg-background/60 backdrop-blur">
                    <CardHeader>
                      <CardTitle className="text-sm">{t("sidebar.invoice.title")}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="space-y-2">
                        <Label htmlFor="cart-doc-type">{t("sidebar.invoice.docType")}</Label>
                        <Select
                          value={docType}
                          onValueChange={(v) => setDocType(v as "A" | "B")}
                          disabled={checkoutPending}
                        >
                          <SelectTrigger id="cart-doc-type">
                            <SelectValue placeholder={t("sidebar.invoice.docTypePlaceholder")} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="B">{t("sidebar.invoice.docTypeB")}</SelectItem>
                            <SelectItem value="A">{t("sidebar.invoice.docTypeA")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {docType === "A" && !selectedCustomerId ? (
                        <Alert variant="destructive" className="border-destructive/30 bg-destructive/10">
                          <AlertDescription>{t("sidebar.invoice.docTypeARequiresCustomer")}</AlertDescription>
                        </Alert>
                      ) : (
                        <div className="text-xs text-muted-foreground">{t("sidebar.invoice.hint")}</div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="bg-background/60 backdrop-blur">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">{t("sidebar.totals.title")}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="text-muted-foreground">{t("totals.subtotal")}</div>
                        <div className="tabular-nums">{cart ? formatMoneyString(cart.subtotal) : "—"}</div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="text-muted-foreground">{t("totals.discount")}</div>
                        <div className="tabular-nums">{cart ? formatMoneyString(cart.discountTotal) : "—"}</div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="text-muted-foreground">{t("totals.tax")}</div>
                        <div className="tabular-nums">{cart ? formatMoneyString(cart.taxTotal) : "—"}</div>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold">{t("totals.total")}</div>
                        <div className="text-sm font-semibold tabular-nums">
                          {cart ? formatMoneyString(cart.total) : "—"}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Button
                    type="button"
                    className="w-full"
                    disabled={!canCheckout}
                    onClick={() => void checkout()}
                  >
                    {checkoutPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {checkoutPending ? t("actions.checkoutLoading") : t("actions.checkout")}
                  </Button>
                </div>
              </ScrollArea>
            </div>
          </div>
        )}

        <CreateCustomerDialog
          open={createCustomerOpen}
          onOpenChange={setCreateCustomerOpen}
          disabled={checkoutPending}
        />
      </SheetContent>
    </Sheet>
  );
}

function CartItemsPanel({
  disabled,
  cartEditable,
  pendingByProductId,
  onSetQty,
  onRemove,
  onGoToInventory,
}: {
  disabled: boolean;
  cartEditable: boolean;
  pendingByProductId: Record<string, boolean>;
  onSetQty: (productId: string, qty: number) => void;
  onRemove: (productId: string) => void;
  onGoToInventory: () => void;
}) {
  const t = useTranslations("Cart");
  const tc = useTranslations("Common");
  const { cart, loading } = useCart();

  if (loading && !cart) {
    return (
      <div className="space-y-3">
        <div className="h-10 w-full animate-pulse rounded-md bg-muted/30" />
        <div className="h-10 w-full animate-pulse rounded-md bg-muted/30" />
        <div className="h-10 w-full animate-pulse rounded-md bg-muted/30" />
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <EmptyState
        title={t("empty.title")}
        description={t("empty.description")}
        action={{ label: t("empty.action"), onClick: onGoToInventory }}
      />
    );
  }

  return (
    <div className="space-y-3">
      {!cartEditable ? (
        <Alert variant="destructive" className="border-destructive/30 bg-destructive/10">
          <AlertDescription>{t("errors.cartNotEditable")}</AlertDescription>
        </Alert>
      ) : null}

      <Card className="bg-background/60 backdrop-blur">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm">{t("cartTable.title")}</CardTitle>
          <div className="text-xs text-muted-foreground tabular-nums">
            {t("cartTable.count", { count: cart.items.length })}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[420px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("cartTable.columns.code")}</TableHead>
                  <TableHead>{t("cartTable.columns.name")}</TableHead>
                  <TableHead className="text-right">{t("cartTable.columns.qty")}</TableHead>
                  <TableHead className="text-right">{t("cartTable.columns.unitPrice")}</TableHead>
                  <TableHead className="text-right">{t("cartTable.columns.lineTotal")}</TableHead>
                  <TableHead className="w-[60px] text-right">{tc("labels.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cart.items.map((it) => {
                  const pending = Boolean(pendingByProductId[it.productId]);
                  return (
                    <TableRow key={it.productId} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-mono text-xs">{it.code}</TableCell>
                      <TableCell className="font-medium">{it.name}</TableCell>
                      <TableCell className="text-right">
                        <QtyControl
                          value={it.quantity}
                          disabled={disabled}
                          pending={pending}
                          onChange={(next) => onSetQty(it.productId, next)}
                        />
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoneyString(it.unitPrice)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoneyString(it.lineTotal)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon-xs"
                                disabled={disabled || pending}
                                onClick={() => onRemove(it.productId)}
                                aria-label={t("actions.removeItem")}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top">{t("actions.removeItem")}</TooltipContent>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

function CartInventoryPanel({
  branchId,
  disabled,
  onAdd,
}: {
  branchId: string;
  disabled: boolean;
  onAdd: (productId: string) => void;
}) {
  const t = useTranslations("Cart");
  const tc = useTranslations("Common");

  const list = useInventoryList(branchId, { limit: 50 });
  const { canLoadMore, loadMore } = list;
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const out = list.items.filter((it) => matchesInventoryQuery(it, query));
    out.sort((a, b) => a.productName.localeCompare(b.productName));
    return out;
  }, [list.items, query]);

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    if (!canLoadMore) return;

    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          void loadMore();
        }
      },
      { rootMargin: "200px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [canLoadMore, loadMore]);

  const showingCount = filtered.length;

  return (
    <div className="space-y-3">
      <Card className="bg-background/60 backdrop-blur">
        <CardHeader className="space-y-2">
          <CardTitle className="text-sm">{t("inventory.title")}</CardTitle>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("inventory.searchPlaceholder")}
              className="pl-9"
            />
          </div>
          <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <div className="tabular-nums">
              {t("inventory.loaded", { count: list.items.length })}
            </div>
            <div className="tabular-nums">
              {t("inventory.showing", { count: showingCount })}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {list.loading ? (
            <div className="space-y-2 p-4">
              <div className="h-10 w-full animate-pulse rounded-md bg-muted/30" />
              <div className="h-10 w-full animate-pulse rounded-md bg-muted/30" />
              <div className="h-10 w-full animate-pulse rounded-md bg-muted/30" />
            </div>
          ) : null}

          {list.error ? (
            <div className="p-4">
              <Alert variant="destructive" className="border-destructive/30 bg-destructive/10">
                <AlertDescription>{list.error}</AlertDescription>
              </Alert>
            </div>
          ) : null}

          {!list.loading && filtered.length === 0 ? (
            <EmptyState variant="noResults" title={t("inventory.noResults.title")} description={t("inventory.noResults.description")} />
          ) : null}

          <ScrollArea className="h-[420px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("inventory.table.columns.code")}</TableHead>
                  <TableHead>{t("inventory.table.columns.name")}</TableHead>
                  <TableHead className="text-right">{t("inventory.table.columns.stock")}</TableHead>
                  <TableHead className="text-right">{t("inventory.table.columns.price")}</TableHead>
                  <TableHead className="w-[160px] text-right">{tc("labels.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((it) => {
                  const noPrice = it.price === null;
                  return (
                    <TableRow key={it.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-mono text-xs">{it.productCode}</TableCell>
                      <TableCell className="font-medium">{it.productName}</TableCell>
                      <TableCell className="text-right tabular-nums">{it.stockOnHand}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {it.price === null ? (
                          <Badge
                            variant="secondary"
                            className="border border-amber-200 bg-amber-50 text-amber-600 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-400"
                          >
                            {t("inventory.noPrice")}
                          </Badge>
                        ) : (
                          formatMoneyNumber(it.price)
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={disabled || noPrice}
                                onClick={() => onAdd(it.productId)}
                              >
                                <PackagePlus className="h-4 w-4" />
                                {t("inventory.actions.add")}
                              </Button>
                            </span>
                          </TooltipTrigger>
                          {noPrice ? (
                            <TooltipContent side="top">{t("inventory.noPriceHint")}</TooltipContent>
                          ) : null}
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            <div ref={sentinelRef} className="h-10" />

            {list.loadingMore ? (
              <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {tc("actions.loading")}
              </div>
            ) : list.canLoadMore ? (
              <div className="flex justify-center py-4">
                <Button type="button" variant="outline" size="sm" onClick={() => void list.loadMore()}>
                  {t("inventory.actions.loadMore")}
                </Button>
              </div>
            ) : (
              <div className={cn("py-4 text-center text-xs text-muted-foreground", filtered.length ? "" : "hidden")}>
                {t("inventory.actions.end")}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
