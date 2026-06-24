"use client";

import * as React from "react";
import { AlertCircle, ArrowDownUp, ChevronLeft, ChevronRight, Search, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Order, OrderStatus } from "@/components/admin/types";
import { ORDER_STATUSES } from "@/components/admin/types";
import { isPickupOrder } from "@/components/admin/api-client";
import OrderRow from "@/components/admin/order-row";
import type { OrdersSummary } from "@/lib/modules/orders";

type OrdersPanelProps = {
  orders: Order[];
  total: number;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  statusFilter: string;
  onStatusFilterChange: (f: string) => void;
  search: string;
  onSearchChange: (s: string) => void;
  sortOrder: "asc" | "desc";
  onSortOrderChange: (s: "asc" | "desc") => void;
  shippingFilter: "all" | "delivery" | "pickup";
  onShippingFilterChange: (f: "all" | "delivery" | "pickup") => void;
  summary: OrdersSummary | null;
  onStatusChange: (orderId: string, status: OrderStatus) => void;
  onApproveSlip: (orderId: string, approved: boolean, note?: string) => void;
  onSaveTracking: (orderId: string, trackingNumber: string) => void;
  onCancelOrder: (orderId: string, reason: string) => void;
  onViewSlip: (images: string[], index: number) => void;
  pinnedOrderPatch?: { id: string; status: OrderStatus } | null;
  t: (key: string) => string;
};

function buildFilterItems(summary: OrdersSummary | null, t: (key: string) => string) {
  const b = summary?.byStatus ?? {};
  const total = summary?.totalOrders ?? 0;
  const items: { key: string; label: string; count: number }[] = [
    { key: "all", label: t("admin.orders.filter_all"), count: total },
  ];
  for (const s of ORDER_STATUSES) {
    if (s === "shipped") {
      items.push({ key: "shipped",        label: t("admin.status.shipped"),        count: summary?.shippedDelivery ?? 0 });
      items.push({ key: "shipped_pickup", label: t("admin.status.shipped_pickup"), count: summary?.shippedPickup  ?? 0 });
    } else if (s === "completed") {
      items.push({ key: "completed", label: t("admin.status.completed_pickup"), count: b["completed"] ?? 0 });
    } else {
      items.push({ key: s, label: t(`admin.status.${s}`), count: b[s] ?? 0 });
    }
  }
  return items;
}

export function OrdersPanel({
  orders,
  total,
  page,
  totalPages,
  onPageChange,
  statusFilter,
  onStatusFilterChange,
  search,
  onSearchChange,
  sortOrder,
  onSortOrderChange,
  shippingFilter,
  onShippingFilterChange,
  summary,
  onStatusChange,
  onApproveSlip,
  onSaveTracking,
  onCancelOrder,
  onViewSlip,
  pinnedOrderPatch,
  t,
}: OrdersPanelProps) {
  const [openModalOrderId, setOpenModalOrderId] = React.useState<string | null>(null);
  const [pinnedOrder, setPinnedOrder] = React.useState<Order | null>(null);

  // Apply direct status patch from parent (fires after API success, even if order is filtered out)
  React.useEffect(() => {
    if (!pinnedOrderPatch || !pinnedOrder || pinnedOrderPatch.id !== pinnedOrder.id) return;
    setPinnedOrder((prev) => prev ? { ...prev, status: pinnedOrderPatch.status } : null);
  }, [pinnedOrderPatch]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep pinned order fresh when orders prop updates (e.g. after status change)
  React.useEffect(() => {
    if (!openModalOrderId) return;
    const fresh = orders.find((o) => o.id === openModalOrderId);
    if (fresh) setPinnedOrder(fresh);
  }, [orders, openModalOrderId]);

  const filteredOrders = React.useMemo(() => {
    if (openModalOrderId && !orders.find((o) => o.id === openModalOrderId) && pinnedOrder) {
      return [pinnedOrder, ...orders];
    }
    return orders;
  }, [orders, openModalOrderId, pinnedOrder]);

  const filterItems = React.useMemo(() => buildFilterItems(summary, t), [summary, t]);

  const pageStart = total === 0 ? 0 : (page - 1) * 50 + 1;
  const pageEnd   = Math.min(page * 50, total);

  return (
    <div className="flex flex-col lg:flex-row gap-5">
      {/* LEFT PANEL — Filters */}
      <div className="lg:w-72 xl:w-80 shrink-0 flex flex-col gap-4">
        {/* Shipping toggle */}
        <Card className="rounded-2xl shadow-xs">
          <CardContent className="p-4 flex flex-col gap-2">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">{t("admin.orders.shipping_type")}</span>
            <div className="flex bg-slate-100 p-1 rounded-xl">
              {([
                { key: "all",      label: t("admin.orders.shipping_all"),      active: "bg-slate-800 text-white shadow-sm", dot: "bg-slate-400" },
                { key: "delivery", label: t("admin.orders.shipping_delivery"), active: "bg-blue-500 text-white shadow-sm",  dot: "bg-blue-400" },
                { key: "pickup",   label: t("admin.orders.shipping_pickup"),   active: "bg-amber-500 text-white shadow-sm", dot: "bg-amber-400" },
              ] as const).map((opt) => {
                const isActive = shippingFilter === opt.key;
                return (
                  <button
                    key={opt.key}
                    onClick={() => onShippingFilterChange(opt.key)}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${isActive ? opt.active : "text-slate-400 hover:text-slate-700"}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isActive ? "bg-white" : opt.dot}`} />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Status filter — desktop only */}
        <Card className="hidden lg:block rounded-2xl shadow-xs">
          <CardContent className="p-4 flex flex-col gap-2">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">{t("admin.orders.status_label")}</span>
            <div className="flex flex-col gap-1.5">
              {filterItems.map(({ key, label, count }) => {
                const isActive = statusFilter === key;
                return (
                  <button
                    key={key}
                    onClick={() => onStatusFilterChange(key)}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isActive ? "bg-brand text-white" : "bg-slate-50 text-gray-600 hover:bg-slate-100"
                    }`}
                  >
                    <span>{label}</span>
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-lg ${isActive ? "bg-white/20 text-white" : "bg-white text-gray-500"}`}>{count}</span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 min-w-0 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-bold text-gray-900 text-sm">{t("admin.orders.all")}</h2>
          <button
            onClick={() => onSortOrderChange(sortOrder === "desc" ? "asc" : "desc")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-600 transition-colors cursor-pointer"
          >
            <ArrowDownUp className="w-3.5 h-3.5" />
            {sortOrder === "desc" ? "ใหม่สุด" : "เก่าสุด"}
          </button>
        </div>

        {/* Status pills — mobile only */}
        <div className="lg:hidden flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {filterItems.map(({ key, label, count }) => {
            const isActive = statusFilter === key;
            return (
              <button
                key={key}
                onClick={() => onStatusFilterChange(key)}
                className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold transition-all cursor-pointer border-2 ${
                  isActive
                    ? "bg-brand text-white border-brand shadow-md shadow-brand/20"
                    : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
                }`}
              >
                {label}
                <span className={`text-xs font-black px-1.5 py-0.5 rounded-lg ${isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="bg-white border border-gray-200/60 rounded-2xl px-4 py-3 shadow-2xs flex items-center gap-3 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/5 transition-all">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t("admin.orders.search_placeholder")}
            className="flex-1 bg-transparent border-none text-xs text-gray-800 placeholder:text-gray-400 shadow-none focus-visible:ring-0 p-0 h-auto"
          />
          {search && (
            <Button variant="ghost" size="icon" onClick={() => onSearchChange("")} className="text-gray-400 hover:text-gray-600 cursor-pointer h-auto w-auto p-0">
              <XCircle className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>

        {/* Order list */}
        <div className="flex flex-col gap-3">
          {filteredOrders.map((order) => (
            <OrderRow
              key={order.id}
              order={order}
              onStatusChange={onStatusChange}
              onApproveSlip={onApproveSlip}
              onSaveTracking={onSaveTracking}
              onCancel={onCancelOrder}
              t={t}
              onViewSlip={onViewSlip}
              useModal={true}
              onModalOpen={() => { setPinnedOrder(order); setOpenModalOrderId(order.id); }}
              onModalClose={() => { setPinnedOrder(null); setOpenModalOrderId(null); }}
            />
          ))}
          {filteredOrders.length === 0 && (
            <div className="bg-white border border-gray-100 rounded-3xl py-16 flex flex-col items-center justify-center text-center shadow-2xs">
              <AlertCircle className="w-8 h-8 text-gray-300 animate-pulse mb-2" />
              <p className="text-xs text-gray-400 font-semibold">{t("admin.orders.empty")}</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-gray-400 font-semibold">
              {pageStart}–{pageEnd} จาก {total.toLocaleString()} คำสั่งซื้อ
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 text-slate-600" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                .reduce<(number | "…")[]>((acc, p, idx, arr) => {
                  if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("…");
                  acc.push(p);
                  return acc;
                }, [])
                .map((item, idx) =>
                  item === "…" ? (
                    <span key={`ellipsis-${idx}`} className="w-8 h-8 flex items-center justify-center text-xs text-gray-400">…</span>
                  ) : (
                    <button
                      key={item}
                      onClick={() => onPageChange(item as number)}
                      className={`w-8 h-8 flex items-center justify-center rounded-xl text-xs font-black transition-colors cursor-pointer ${
                        item === page
                          ? "bg-brand text-white shadow-sm"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {item}
                    </button>
                  )
                )}
              <button
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
