"use client";

import * as React from "react";
import { AlertCircle, Search, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Order, OrderStatus } from "@/components/admin/types";
import { ORDER_STATUSES } from "@/components/admin/types";
import { isPickupOrder } from "@/components/admin/api-client";
import OrderRow from "@/components/admin/order-row";

type OrdersPanelProps = {
  orders: Order[];
  onStatusChange: (orderId: string, status: OrderStatus) => void;
  onApproveSlip: (orderId: string, approved: boolean, note?: string) => void;
  onSaveTracking: (orderId: string, trackingNumber: string) => void;
  onCancelOrder: (orderId: string, reason: string) => void;
  onViewSlip: (images: string[], index: number) => void;
  initialStatusFilter?: OrderStatus | "all";
  t: (key: string) => string;
};

function buildFilterItems(orders: Order[], t: (key: string) => string) {
  const items: { key: string; label: string; count: number }[] = [
    { key: "all", label: t("admin.orders.filter_all"), count: orders.length },
  ];
  for (const s of ORDER_STATUSES) {
    if (s === "shipped") {
      const deliveryCount = orders.filter((o) => o.status === "shipped" && !isPickupOrder(o)).length;
      const pickupCount = orders.filter((o) => o.status === "shipped" && isPickupOrder(o)).length;
      items.push({ key: "shipped", label: t("admin.status.shipped"), count: deliveryCount });
      items.push({ key: "shipped_pickup", label: t("admin.status.shipped_pickup"), count: pickupCount });
    } else if (s === "completed") {
      items.push({ key: "completed", label: t("admin.status.completed_pickup"), count: orders.filter((o) => o.status === "completed").length });
    } else {
      items.push({ key: s, label: t(`admin.status.${s}`), count: orders.filter((o) => o.status === s).length });
    }
  }
  return items;
}

export function OrdersPanel({
  orders,
  onStatusChange,
  onApproveSlip,
  onSaveTracking,
  onCancelOrder,
  onViewSlip,
  initialStatusFilter,
  t,
}: OrdersPanelProps) {
  const [shippingFilter, setShippingFilter] = React.useState<"all" | "delivery" | "pickup">("all");
  const [statusFilter, setStatusFilter] = React.useState<OrderStatus | "all" | "shipped_pickup">(initialStatusFilter ?? "all");
  const [openModalOrderId, setOpenModalOrderId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (initialStatusFilter) setStatusFilter(initialStatusFilter);
  }, [initialStatusFilter]);
  const [searchQuery, setSearchQuery] = React.useState("");

  const shippingFilteredOrders = React.useMemo(() => {
    return orders.filter((o) => {
      const isPickup = isPickupOrder(o);
      return (
        shippingFilter === "all" ||
        (shippingFilter === "pickup" && isPickup) ||
        (shippingFilter === "delivery" && !isPickup)
      );
    });
  }, [orders, shippingFilter]);

  const filteredOrders = React.useMemo(() => {
    const base = shippingFilteredOrders.filter((o) => {
      const isPickup = isPickupOrder(o);
      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "shipped" && o.status === "shipped" && !isPickup) ||
        (statusFilter === "shipped_pickup" && o.status === "shipped" && isPickup) ||
        (statusFilter === "completed" && o.status === "completed") ||
        (statusFilter !== "shipped" && statusFilter !== "shipped_pickup" && statusFilter !== "completed" && o.status === statusFilter);

      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q ||
        o.customer.name.toLowerCase().includes(q) ||
        o.customer.phone.includes(q) ||
        o.id.toLowerCase().includes(q);

      return matchStatus && matchSearch;
    });
    // Keep the open modal order in the list even if it no longer matches the filter
    if (openModalOrderId && !base.find((o) => o.id === openModalOrderId)) {
      const pinned = orders.find((o) => o.id === openModalOrderId);
      if (pinned) return [pinned, ...base];
    }
    return base;
  }, [shippingFilteredOrders, statusFilter, searchQuery, openModalOrderId, orders]);

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
                { key: "all",      label: t("admin.orders.shipping_all"), active: "bg-slate-800 text-white shadow-sm", dot: "bg-slate-400" },
                { key: "delivery", label: t("admin.orders.shipping_delivery"),   active: "bg-blue-500 text-white shadow-sm",  dot: "bg-blue-400" },
                { key: "pickup",   label: t("admin.orders.shipping_pickup"),   active: "bg-amber-500 text-white shadow-sm", dot: "bg-amber-400" },
              ] as const).map((opt) => {
                const isActive = shippingFilter === opt.key;
                return (
                  <button
                    key={opt.key}
                    onClick={() => setShippingFilter(opt.key)}
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

        {/* Status filter — desktop only vertical list */}
        <Card className="hidden lg:block rounded-2xl shadow-xs">
          <CardContent className="p-4 flex flex-col gap-2">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">{t("admin.orders.status_label")}</span>
            <div className="flex flex-col gap-1.5">
              {buildFilterItems(shippingFilteredOrders, t).map(({ key, label, count }) => {
                const isActive = statusFilter === key;
                return (
                  <button
                    key={key}
                    onClick={() => setStatusFilter(key as typeof statusFilter)}
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

      {/* RIGHT PANEL — Search + Order list */}
      <div className="flex-1 min-w-0 flex flex-col gap-3">
        <h2 className="font-bold text-gray-900 text-sm">{t("admin.orders.all")}</h2>

        {/* Status pills — mobile only */}
        <div className="lg:hidden flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {buildFilterItems(shippingFilteredOrders, t).map(({ key, label, count }) => {
            const isActive = statusFilter === key;
            return (
              <button
                key={key}
                onClick={() => setStatusFilter(key as typeof statusFilter)}
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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("admin.orders.search_placeholder")}
            className="flex-1 bg-transparent border-none text-xs text-gray-800 placeholder:text-gray-400 shadow-none focus-visible:ring-0 p-0 h-auto"
          />
          {searchQuery && (
            <Button variant="ghost" size="icon" onClick={() => setSearchQuery("")} className="text-gray-400 hover:text-gray-600 cursor-pointer h-auto w-auto p-0">
              <XCircle className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>

        {/* Order list — modal mode */}
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
              onModalOpen={() => setOpenModalOrderId(order.id)}
              onModalClose={() => setOpenModalOrderId(null)}
            />
          ))}
          {filteredOrders.length === 0 && (
            <div className="bg-white border border-gray-100 rounded-3xl py-16 flex flex-col items-center justify-center text-center shadow-2xs">
              <AlertCircle className="w-8 h-8 text-gray-300 animate-pulse mb-2" />
              <p className="text-xs text-gray-400 font-semibold">{t("admin.orders.empty")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
