"use client";

import * as React from "react";
import { Check, CheckCircle2, Clock, FileCheck2, Package, Truck, XCircle } from "lucide-react";

type OrderStatus =
  | "pending_payment"
  | "payment_review"
  | "paid"
  | "packing"
  | "shipped"
  | "completed"
  | "cancelled";

type Order = {
  status: OrderStatus;
  updatedAt: string;
};

type StepStatus = "payment_review" | "packing" | "shipped" | "completed";

const STEPS: { status: StepStatus; th: string; en: string; Icon: React.ElementType }[] = [
  { status: "payment_review", th: "ยืนยันชำระเงิน", en: "Payment confirmed", Icon: FileCheck2 },
  { status: "packing",        th: "กำลังแพ็คสินค้า", en: "Packing",           Icon: Package   },
  { status: "shipped",        th: "จัดส่งแล้ว",       en: "On the way",        Icon: Truck     },
];

const STATUS_META: Record<OrderStatus, { th: string; en: string; color: string; bg: string; icon: React.ElementType }> = {
  payment_review: { th: "รอยืนยันชำระเงิน", en: "Awaiting confirmation", color: "text-amber-700",  bg: "bg-amber-50 border-amber-200",  icon: Clock        },
  paid:           { th: "ชำระเงินแล้ว",      en: "Payment confirmed",    color: "text-blue-700",   bg: "bg-blue-50 border-blue-200",     icon: FileCheck2   },
  packing:        { th: "กำลังแพ็คสินค้า",   en: "Packing your order",   color: "text-blue-700",   bg: "bg-blue-50 border-blue-200",     icon: Package      },
  shipped:        { th: "กำลังจัดส่ง",        en: "On the way",           color: "text-sky-700",    bg: "bg-sky-50 border-sky-200",       icon: Truck        },
  completed:      { th: "ส่งถึงมือแล้ว",     en: "Delivered",            color: "text-emerald-700",bg: "bg-emerald-50 border-emerald-200",icon: CheckCircle2 },
  cancelled:      { th: "ยกเลิกแล้ว",         en: "Cancelled",            color: "text-red-700",    bg: "bg-red-50 border-red-200",       icon: XCircle      },
  pending_payment:{ th: "รอชำระเงิน",         en: "Pending payment",      color: "text-gray-600",   bg: "bg-gray-50 border-gray-200",     icon: Clock        },
};

function stepIndex(status: OrderStatus) {
  if (status === "completed") return 3;
  if (status === "shipped")   return 2;
  if (status === "packing" || status === "paid") return 1;
  return 0;
}

export function LogisticsProgress({ order, lang }: { order: Order; lang: "th" | "en" }) {
  const meta = STATUS_META[order.status];
  const StatusIcon = meta.icon;
  const currentIdx = stepIndex(order.status);
  const cancelled = order.status === "cancelled";

  return (
    <div className="flex flex-col gap-3">
      {/* Hero status */}
      <div className={`flex items-center gap-3 rounded-2xl border p-4 ${meta.bg}`}>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/70 ${meta.color}`}>
          <StatusIcon className="h-5 w-5" />
        </div>
        <div>
          <p className={`text-base font-black ${meta.color}`}>
            {lang === "th" ? meta.th : meta.en}
          </p>
          <p className="text-[11px] font-semibold text-gray-500 mt-0.5">
            {lang === "th" ? "อัปเดตล่าสุด" : "Last updated"}{" "}
            {new Date(order.updatedAt).toLocaleString(lang === "th" ? "th-TH" : "en-US", {
              day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
            })}
          </p>
        </div>
      </div>

      {/* Vertical timeline */}
      {!cancelled && (
        <div className="rounded-2xl border border-gray-100 bg-white p-4">
          <div className="flex flex-col">
            {STEPS.map(({ status, th, en, Icon }, idx) => {
              const done   = idx < currentIdx || order.status === "completed";
              const active = idx === currentIdx && !cancelled;
              const future = idx > currentIdx;
              const isLast = idx === STEPS.length - 1;
              return (
                <div key={status} className="flex gap-3">
                  {/* Left: dot + line */}
                  <div className="flex flex-col items-center">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                      done   ? "bg-emerald-500 border-emerald-500 text-white" :
                      active ? "bg-white border-[#85241F] text-[#85241F] ring-4 ring-[#85241F]/10" :
                               "bg-white border-gray-200 text-gray-300"
                    }`}>
                      {done
                        ? <Check className="h-3.5 w-3.5" strokeWidth={3} />
                        : <Icon className="h-3.5 w-3.5" />}
                    </div>
                    {!isLast && (
                      <div className={`w-0.5 flex-1 my-1 rounded-full min-h-5 ${done ? "bg-emerald-400" : "bg-gray-100"}`} />
                    )}
                  </div>
                  {/* Right: label */}
                  <div className={`pb-4 pt-1 flex-1 ${isLast ? "pb-0" : ""}`}>
                    <p className={`text-sm font-black leading-none ${
                      done   ? "text-emerald-700" :
                      active ? "text-[#85241F]" :
                               "text-gray-300"
                    }`}>
                      {lang === "th" ? th : en}
                    </p>
                    {active && !future && (
                      <p className="mt-0.5 text-[10px] font-semibold text-gray-400">
                        {lang === "th" ? "สถานะปัจจุบัน" : "Current status"}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {cancelled && (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700">
          {lang === "th" ? "คำสั่งซื้อนี้ถูกยกเลิกแล้ว" : "This order has been cancelled."}
        </div>
      )}
    </div>
  );
}
