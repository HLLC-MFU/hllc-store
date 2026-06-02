"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";

export function ProductStatCard({ icon, label, value, tone }: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: "slate" | "red" | "emerald";
}) {
  const borderClass = {
    slate: "border-slate-100",
    red: "border-red-100",
    emerald: "border-emerald-100",
  }[tone];
  const iconClass = {
    slate: "bg-slate-50 text-slate-700",
    red: "bg-red-50 text-red-600",
    emerald: "bg-emerald-50 text-emerald-600",
  }[tone];
  const valueClass = {
    slate: "text-gray-900",
    red: "text-red-600",
    emerald: "text-emerald-600",
  }[tone];

  return (
    <Card className={`rounded-2xl shadow-xs ${borderClass}`}>
      <CardContent className="p-4">
        <div className={`mb-2 flex h-9 w-9 items-center justify-center rounded-xl ${iconClass}`}>
          {icon}
        </div>
        <p className="text-[10px] font-bold uppercase text-gray-400">{label}</p>
        <p className={`mt-1 text-lg font-black ${valueClass}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

export default ProductStatCard;
