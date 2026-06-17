"use client";

import * as React from "react";
import {
  ClipboardList,
  FileCheck2,
  Package,
  TrendingUp,
  Truck,
  Store,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { Order } from "@/components/admin/types";
import { money, isPickupOrder } from "@/components/admin/api-client";

type AdminStatsProps = {
  orders: Order[];
  pendingSlips: Order[];
  setActiveTab: (tab: string) => void;
  onNavigateOrders: (filter: string) => void;
  t: (key: string, replacements?: Record<string, string | number>) => string;
};

export function AdminStats({ orders, pendingSlips, onNavigateOrders, t }: AdminStatsProps) {
  const statsRevenue = orders.reduce((sum, o) =>
    ["packing", "shipped", "completed"].includes(o.status) ? sum + o.total : sum, 0
  );
  const statsTotal = orders.length;
  const statsPending = pendingSlips.length;
  const statsPacking = orders.filter(o => o.status === "packing").length;
  const statsShipped = orders.filter(o => o.status === "shipped" && !isPickupOrder(o)).length;
  const statsPickupReady = orders.filter(o => o.status === "shipped" && isPickupOrder(o)).length;
  const statsCompleted = orders.filter(o => o.status === "completed").length;
  const statsCancelled = orders.filter(o => o.status === "cancelled").length;

  const statCards = [
    {
      key: "all",
      label: t("admin.stats.total_orders"),
      value: statsTotal,
      icon: ClipboardList,
      bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-100",
      cardBorder: "border-slate-100/80",
      urgent: false,
    },
    {
      key: "payment_review",
      label: t("admin.stats.pending"),
      value: statsPending,
      icon: FileCheck2,
      bg: statsPending > 0 ? "bg-rose-50" : "bg-gray-50",
      text: statsPending > 0 ? "text-rose-500" : "text-gray-400",
      border: statsPending > 0 ? "border-rose-100" : "border-gray-100",
      cardBorder: statsPending > 0 ? "border-rose-200 ring-2 ring-rose-500/5" : "border-gray-100",
      urgent: statsPending > 0,
    },
    {
      key: "packing",
      label: t("admin.stats.preparing"),
      value: statsPacking,
      icon: Package,
      bg: "bg-yellow-50", text: "text-yellow-600", border: "border-yellow-100",
      cardBorder: "border-yellow-100/80",
      urgent: false,
    },
    {
      key: "shipped",
      label: t("admin.stats.shipped"),
      value: statsShipped,
      icon: Truck,
      bg: "bg-sky-50", text: "text-sky-500", border: "border-sky-100",
      cardBorder: "border-sky-100/80",
      urgent: false,
    },
    {
      key: "shipped_pickup",
      label: t("admin.status.shipped_pickup"),
      value: statsPickupReady,
      icon: Store,
      bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-100",
      cardBorder: "border-amber-100/80",
      urgent: false,
    },
    {
      key: "completed",
      label: t("admin.status.completed"),
      value: statsCompleted,
      icon: CheckCircle2,
      bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-100",
      cardBorder: "border-emerald-100/80",
      urgent: false,
    },
    {
      key: "cancelled",
      label: t("admin.status.cancelled"),
      value: statsCancelled,
      icon: XCircle,
      bg: "bg-gray-50", text: "text-gray-400", border: "border-gray-100",
      cardBorder: "border-gray-100/80",
      urgent: false,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-black text-gray-900 text-lg">{t("admin.tab.dashboard")}</h2>

      <div className="flex flex-col gap-3">
        {/* Revenue — full width */}
        <Card className="border-emerald-100 rounded-2xl shadow-sm transition-all">
          <CardContent className="p-6 flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">{t("admin.stats.revenue")}</span>
                <span className="text-4xl font-black text-gray-900 tracking-tight">{money(statsRevenue)}</span>
                <span className="text-xs text-gray-400 mt-0.5">{t("admin.stats.revenue_desc")}</span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center border border-emerald-100 shrink-0">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status cards grid */}
        <div className="grid grid-cols-2 gap-3">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <Card
                key={card.key}
                onClick={() => onNavigateOrders(card.key)}
                className={`rounded-2xl shadow-xs hover:shadow-md transition-all cursor-pointer relative overflow-hidden ${card.cardBorder}`}
              >
                <CardContent className="p-4 flex flex-col gap-1.5">
                  {card.urgent && (
                    <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full animate-ping" />
                  )}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${card.bg} ${card.text} ${card.border}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{card.label}</span>
                  <span className={`text-2xl font-black ${card.urgent ? card.text : "text-gray-900"}`}>{card.value}</span>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
