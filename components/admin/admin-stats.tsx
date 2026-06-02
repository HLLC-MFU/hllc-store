"use client";

import * as React from "react";
import {
  ClipboardList,
  FileCheck2,
  Package,
  TrendingUp,
  Truck,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Order } from "@/components/admin/types";
import { money } from "@/components/admin/utils";

type AdminStatsProps = {
  orders: Order[];
  pendingSlips: Order[];
  setActiveTab: (tab: string) => void;
  t: (key: string, replacements?: Record<string, string | number>) => string;
};

export function AdminStats({ orders, pendingSlips, setActiveTab, t }: AdminStatsProps) {
  // Stats dashboard data aggregates
  const statsRevenue = orders.reduce((sum, o) => 
    ["packing", "shipped", "completed"].includes(o.status) ? sum + o.total : sum, 0
  );
  const statsPending = pendingSlips.length;
  const statsPacking = orders.filter(o => o.status === "packing").length;
  const statsShipped = orders.filter(o => o.status === "shipped").length;
  const statsTotal = orders.length;

  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-black text-gray-900 text-lg">{t("admin.tab.dashboard")}</h2>

      {/* Stats — revenue ใหญ่สุด + 3 card เล็กข้างล่าง */}
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

        {/* 2x2 grid */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="border-slate-100/80 rounded-2xl shadow-xs hover:shadow-md transition-all">
            <CardContent className="p-4 flex flex-col gap-1.5">
              <div className="w-9 h-9 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center border border-slate-100">
                <ClipboardList className="w-4 h-4" />
              </div>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{t("admin.stats.total_orders")}</span>
              <span className="text-2xl font-black text-gray-900">{statsTotal}</span>
            </CardContent>
          </Card>

          <Card className={`rounded-2xl shadow-xs transition-all relative overflow-hidden ${statsPending > 0 ? "border-rose-200 ring-2 ring-rose-500/5" : "border-gray-100"}`}>
            <CardContent className="p-4 flex flex-col gap-1.5">
              {statsPending > 0 && <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full animate-ping" />}
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${statsPending > 0 ? "bg-rose-50 text-rose-500 border-rose-100" : "bg-gray-50 text-gray-400 border-gray-100"}`}>
                <FileCheck2 className="w-4 h-4" />
              </div>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{t("admin.stats.pending")}</span>
              <span className={`text-2xl font-black ${statsPending > 0 ? "text-rose-500" : "text-gray-900"}`}>{statsPending}</span>
            </CardContent>
          </Card>

          <Card className="border-yellow-100/80 rounded-2xl shadow-xs hover:shadow-md transition-all">
            <CardContent className="p-4 flex flex-col gap-1.5">
              <div className="w-9 h-9 rounded-xl bg-yellow-50 text-yellow-600 flex items-center justify-center border border-yellow-100">
                <Package className="w-4 h-4" />
              </div>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{t("admin.stats.preparing")}</span>
              <span className="text-2xl font-black text-gray-900">{statsPacking}</span>
            </CardContent>
          </Card>

          <Card className="border-sky-100/80 rounded-2xl shadow-xs hover:shadow-md transition-all">
            <CardContent className="p-4 flex flex-col gap-1.5">
              <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-500 flex items-center justify-center border border-sky-100">
                <Truck className="w-4 h-4" />
              </div>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{t("admin.stats.shipped")}</span>
              <span className="text-2xl font-black text-gray-900">{statsShipped}</span>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Pending slips — ต้องดูแลด่วน */}
      {pendingSlips.length > 0 && (
        <div>
          <h3 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-rose-500" />
            {t("admin.stats.pending")}
            <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">{pendingSlips.length}</span>
          </h3>
          <div className="flex flex-col gap-2">
            {pendingSlips.slice(0, 5).map((order) => (
              <Card
                key={order.id}
                className="rounded-2xl shadow-xs cursor-pointer hover:shadow-md transition-all"
                onClick={() => setActiveTab("orders")}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <FileCheck2 className="w-4 h-4 text-rose-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{order.customer.name}</p>
                    <p className="text-xs text-gray-400 truncate">
                      {order.items.map((i) => `${i.name} ×${i.quantity}`).join(", ")}
                    </p>
                  </div>
                  <span className="font-black text-sm text-gray-900 shrink-0">{money(order.total)}</span>
                </CardContent>
              </Card>
            ))}
            {pendingSlips.length > 5 && (
              <button
                onClick={() => setActiveTab("orders")}
                className="text-xs text-[#85241F] font-bold text-center py-2 hover:underline cursor-pointer"
              >
                {t("admin.stats.view_all", { count: pendingSlips.length })}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
