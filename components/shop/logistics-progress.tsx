"use client";

import * as React from "react";
import { Check, CheckCircle2, FileCheck2, Package, Truck } from "lucide-react";

type OrderStatus =
  | "pending_payment"
  | "payment_review"
  | "paid"
  | "packing"
  | "shipped"
  | "completed"
  | "cancelled";

type SlipStatus = "none" | "pending" | "approved" | "rejected";

type Order = {
  id: string;
  customer: {
    name: string;
    phone: string;
    address: string;
  };
  items: {
    productId: string;
    name: string | { th: string; en?: string };
    price: number;
    quantity: number;
    subtotal: number;
  }[];
  total: number;
  status: OrderStatus;
  slip: {
    imageUrl?: string;
    status: SlipStatus;
  };
  trackingNumber?: string;
  createdAt: string;
  updatedAt: string;
};

type StepStatus = "payment_review" | "packing" | "shipped" | "completed";

const LOGISTICS_STEPS: { status: StepStatus; th: string; en: string; Icon: React.ElementType }[] = [
  { status: "payment_review", th: "รอยืนยันชำระ",  en: "Confirming payment", Icon: FileCheck2 },
  { status: "packing",        th: "เตรียมจัดส่ง",  en: "Preparing",          Icon: Package   },
  { status: "shipped",        th: "จัดส่งแล้ว",    en: "On the way",         Icon: Truck     },
  { status: "completed",      th: "ส่งสำเร็จ",     en: "Delivered",          Icon: Check     },
];

function logisticsIndex(status: OrderStatus) {
  if (status === "completed") return 3;
  if (status === "shipped")   return 2;
  if (status === "packing" || status === "paid") return 1;
  return 0;
}

type LogisticsProgressProps = {
  order: Order;
  lang: "th" | "en";
};

export function LogisticsProgress({ order, lang }: LogisticsProgressProps) {
  const currentIdx = logisticsIndex(order.status);
  const cancelled = order.status === "cancelled";

  if (cancelled) {
    return (
      <div className="my-4 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700">
        {lang === "th" ? "คำสั่งซื้อนี้ถูกยกเลิก" : "This order has been cancelled."}
      </div>
    );
  }

  return (
    <div className="my-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between relative">
        <div className="absolute top-3.5 left-6 right-6 h-0.5 bg-gray-100 z-0" />
        <div
          className="absolute top-3.5 left-6 h-0.5 bg-emerald-500 z-0 transition-all duration-500"
          style={{ width: `${(Math.max(0, currentIdx) / (LOGISTICS_STEPS.length - 1)) * 92}%` }}
        />
        {LOGISTICS_STEPS.map(({ status, th, en, Icon }, idx) => {
          const done = idx < currentIdx || order.status === "completed";
          const active = idx === currentIdx;
          return (
            <div key={status} className="flex flex-col items-center z-10">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 shadow-sm ${
                done   ? "bg-emerald-500 border-emerald-500 text-white" :
                active ? "bg-white border-[#85241F] text-[#85241F] scale-110 ring-4 ring-[#85241F]/5" :
                         "bg-white border-gray-200 text-gray-300"
              }`}>
                {done ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : <Icon className="w-3.5 h-3.5" />}
              </div>
              <span className={`text-[10px] font-bold mt-2 text-center max-w-16 leading-tight block ${
                active ? "text-[#85241F] font-black" : done ? "text-emerald-600" : "text-gray-400"
              }`}>
                {lang === "th" ? th : en}
              </span>
            </div>
          );
        })}
      </div>
      {order.status === "completed" && (
        <div className="mt-5 border-t border-gray-100 pt-3">
          <p className="flex items-center gap-2 text-sm font-black text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
            {lang === "th" ? "คำสั่งซื้อเสร็จสิ้นแล้ว" : "Order completed"}
          </p>
        </div>
      )}
    </div>
  );
}
