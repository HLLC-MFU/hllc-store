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
  onViewSlip: (imageUrl: string) => void;
  t: (key: string) => string;
};

export function OrdersPanel({
  orders,
  onStatusChange,
  onApproveSlip,
  onSaveTracking,
  onCancelOrder,
  onViewSlip,
  t,
}: OrdersPanelProps) {
  const [shippingFilter, setShippingFilter] = React.useState<"all" | "delivery" | "pickup">("all");
  const [statusFilter, setStatusFilter] = React.useState<OrderStatus | "all">("all");
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredOrders = React.useMemo(() => {
    return orders.filter((o) => {
      const matchStatus = statusFilter === "all" || o.status === statusFilter;

      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q ||
        o.customer.name.toLowerCase().includes(q) ||
        o.customer.phone.includes(q) ||
        o.id.toLowerCase().includes(q);

      const isPickup = isPickupOrder(o);
      const matchShipping =
        shippingFilter === "all" ||
        (shippingFilter === "pickup" && isPickup) ||
        (shippingFilter === "delivery" && !isPickup);

      return matchStatus && matchSearch && matchShipping;
    });
  }, [orders, statusFilter, searchQuery, shippingFilter]);

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
              {(["all", ...ORDER_STATUSES] as const).map((s) => {
                const count = s === "all" ? orders.length : orders.filter((o) => o.status === s).length;
                if (count === 0 && s !== "all") return null;
                const isActive = statusFilter === s;
                return (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isActive ? "bg-[#85241F] text-white" : "bg-slate-50 text-gray-600 hover:bg-slate-100"
                    }`}
                  >
                    <span>{s === "all" ? t("admin.orders.filter_all") : t(`admin.status.${s as OrderStatus}`)}</span>
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
          {(["all", ...ORDER_STATUSES] as const).map((s) => {
            const count = s === "all" ? orders.length : orders.filter((o) => o.status === s).length;
            if (count === 0 && s !== "all") return null;
            const isActive = statusFilter === s;
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold transition-all cursor-pointer border-2 ${
                  isActive
                    ? "bg-[#85241F] text-white border-[#85241F] shadow-md shadow-[#85241F]/20"
                    : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
                }`}
              >
                {s === "all" ? t("admin.orders.filter_all") : t(`admin.status.${s as OrderStatus}`)}
                <span className={`text-xs font-black px-1.5 py-0.5 rounded-lg ${
                  isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                }`}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="bg-white border border-gray-200/60 rounded-2xl px-4 py-3 shadow-2xs flex items-center gap-3 focus-within:border-[#85241F] focus-within:ring-2 focus-within:ring-[#85241F]/5 transition-all">
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
