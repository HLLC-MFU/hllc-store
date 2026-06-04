"use client";

import * as React from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileCheck2,
  Mail,
  MapPin,
  MessageSquare,
  Package,
  Phone,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/lib/language-context";
import type { Order, OrderStatus } from "./types";
import { STATUS_COLOR } from "./types";
import { money, timeAgo } from "./utils";

export function OrderRow({ order, onStatusChange, onApproveSlip, onSaveTracking, onCancel, t, onViewSlip }: {
  order: Order;
  onStatusChange: (id: string, s: OrderStatus) => void;
  onApproveSlip: (orderId: string, approved: boolean, note?: string) => void;
  onSaveTracking: (orderId: string, trackingNumber: string) => void;
  onCancel: (orderId: string, reason: string) => void;
  t: (key: string, replacements?: Record<string, string | number>) => string;
  onViewSlip: (url: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [note, setNote] = React.useState("");
  const [tracking, setTracking] = React.useState(order.trackingNumber ?? "");
  const [showCancel, setShowCancel] = React.useState(false);
  const [cancelReason, setCancelReason] = React.useState("");
  const { lang } = useLanguage();

  const canCancel = order.status !== "cancelled" && order.status !== "completed";

  const timelineSteps: OrderStatus[] = [
    "payment_review",
    "packing",
    "shipped",
    "completed",
  ];

  const currentIdx = timelineSteps.indexOf(order.status);
  const statusButtonLabel = (status?: OrderStatus) => {
    if (!status) return "";
    if (status === "payment_review") {
      return lang === "th" ? "ขออัปโหลดสลิปใหม่" : "Request new slip";
    }
    return t(`admin.status.${status}`);
  };

  return (
    <Card className={`rounded-3xl shadow-2xs overflow-hidden transition-all duration-200 ${open ? "border-slate-200/80 ring-3 ring-slate-100" : "border-slate-100 hover:border-slate-200"}`}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-slate-50/50 transition-colors cursor-pointer"
      >
        {(() => {
          const iconClass = "w-4 h-4 shrink-0";
          if (order.status === "payment_review") return <FileCheck2  className={`${iconClass} text-rose-500`} />;
          if (order.status === "packing")         return <Package     className={`${iconClass} text-yellow-500`} />;
          if (order.status === "shipped")         return <Truck       className={`${iconClass} text-sky-500`} />;
          if (order.status === "completed")       return <CheckCircle2 className={`${iconClass} text-teal-600`} />;
          return <FileCheck2 className={`${iconClass} text-gray-400`} />;
        })()}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-extrabold text-sm text-gray-900 leading-none">{order.customer.name}</span>
            <Badge className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${STATUS_COLOR[order.status]}`}>
              {t(`admin.status.${order.status}`)}
            </Badge>
          </div>
          <p className="text-xs text-gray-400 mt-1 font-medium truncate">
            {order.items.map((i) => `${i.name[lang] || i.name.th} ×${i.quantity}`).join(", ")}
          </p>
        </div>

        <div className="text-right shrink-0 mr-1">
          <p className="font-black text-sm text-gray-950">{money(order.total)}</p>
          <p className="text-[10px] text-gray-400 font-medium mt-0.5">{timeAgo(order.createdAt, lang)}</p>
        </div>

        {open ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
      </button>

      {open && (
        <div className="border-t border-slate-100 p-4 bg-slate-50/20 flex flex-col gap-4 animate-in slide-in-from-top-2 duration-200">

          {/* Admin Notes timeline */}
          {order.adminNotes && order.adminNotes.length > 0 && (
            <Card className="rounded-2xl shadow-3xs">
              <CardContent className="p-4 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">บันทึกแอดมิน</span>
                </div>
                <div className="flex flex-col gap-2">
                  {order.adminNotes.map((n, i) => (
                    <div key={i} className="flex gap-2.5">
                      <div className="flex flex-col items-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 shrink-0" />
                        {i < (order.adminNotes?.length ?? 0) - 1 && (
                          <div className="w-px flex-1 bg-slate-100 mt-1" />
                        )}
                      </div>
                      <div className="pb-2 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-black text-[#85241F] bg-[#85241F]/5 px-1.5 py-0.5 rounded-md">{n.action}</span>
                          <span className="text-[10px] text-gray-400">โดย {n.by}</span>
                          <span className="text-[10px] text-gray-300">·</span>
                          <span className="text-[10px] text-gray-400">
                            {new Date(n.at).toLocaleDateString(lang === "th" ? "th-TH" : "en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        {n.text && <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{n.text}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Cancellation reason */}
          {order.status === "cancelled" && order.cancellationReason && (
            <Card className="rounded-2xl shadow-3xs border-red-100">
              <CardContent className="p-4 flex gap-3 items-start">
                <Trash2 className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-black text-red-400 uppercase tracking-wider mb-1">เหตุผลการยกเลิก</p>
                  <p className="text-xs text-red-700 leading-relaxed">{order.cancellationReason}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Slip image — separate card */}
          {order.status === "payment_review" && order.slip.imageUrl && order.slip.status !== "none" && (
            <Card className="rounded-2xl shadow-3xs overflow-hidden">
              <button
                onClick={() => order.slip.imageUrl && onViewSlip(order.slip.imageUrl)}
                className="w-full h-48 bg-gray-100 relative group cursor-pointer overflow-hidden block"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={order.slip.imageUrl} alt="slip" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 flex items-end px-3 pb-3 transition-colors">
                  <span className="opacity-0 group-hover:opacity-100 text-white text-[9px] font-black bg-black/60 px-2 py-1 rounded-lg">ขยาย</span>
                </div>
              </button>
            </Card>
          )}

          {/* 1 — Order Summary */}
          <Card className="rounded-2xl shadow-3xs">
            <CardContent className="p-4 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5 pb-3 border-b border-slate-100">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">ข้อมูลผู้สั่ง</span>
                <span className="text-base font-black text-gray-900">{order.customer.name}</span>
                <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                  <Phone className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                  <span className="font-mono">{order.customer.phone}</span>
                </div>
                {order.customer.email ? (
                  <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                    <Mail className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                    <span className="break-all">{order.customer.email}</span>
                  </div>
                ) : null}
                <div className="flex items-start gap-2 text-sm text-gray-600 font-medium">
                  <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-gray-400" />
                  <span className="leading-relaxed">{order.customer.address}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2.5">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">รายการสินค้า</span>
                {order.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm text-gray-800 font-semibold truncate">{item.name[lang] || item.name.th} <span className="text-gray-400 font-medium">×{item.quantity}</span></span>
                    <span className="text-sm font-black text-gray-900 shrink-0 ml-3">{money(item.subtotal)}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <span className="text-sm font-black text-gray-500">ยอดรวม</span>
                <span className="text-xl font-black text-gray-950">{money(order.total)}</span>
              </div>
            </CardContent>
          </Card>

          {/* 3 — Stepper (hidden when cancelled) */}
          {order.status !== "cancelled" && <Card className="rounded-2xl shadow-3xs">
            <CardContent className="p-4">
              <div className="flex items-center justify-between relative">
                <div className="absolute top-3.5 left-6 right-6 h-0.5 bg-gray-100 z-0" />
                <div
                  className="absolute top-3.5 left-6 h-0.5 bg-emerald-500 z-0 transition-all duration-500"
                  style={{ width: `${(Math.max(0, currentIdx) / (timelineSteps.length - 1)) * 92}%` }}
                />
                {timelineSteps.map((s, idx) => {
                  const done = idx < currentIdx || order.status === "completed";
                  const active = idx === currentIdx;
                  const StepIcon = s === "payment_review" ? FileCheck2
                    : s === "packing" ? Package
                    : s === "shipped" ? Truck
                    : Check;
                  return (
                    <div key={s} className="flex flex-col items-center z-10">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 shadow-sm ${
                        done ? "bg-emerald-500 border-emerald-500 text-white" :
                        active ? "bg-white border-[#85241F] text-[#85241F] scale-110 ring-4 ring-[#85241F]/5" :
                        "bg-white border-gray-200 text-gray-300"
                      }`}>
                        {done ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : <StepIcon className="w-3.5 h-3.5" />}
                      </div>
                      <span className={`text-[10px] font-bold mt-2 text-center max-w-16 truncate block ${
                        active ? "text-[#85241F] font-black" : done ? "text-emerald-600" : "text-gray-400"
                      }`}>
                        {t(`admin.status.${s}`)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>}

          {/* 4 — Status changer / Approve+Reject if pending slip / Cancel */}
          <Card className="rounded-2xl shadow-3xs">
            <CardContent className="p-4">
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-3">{t("admin.order.change_status")}</p>

              {/* payment_review + pending slip → show approve/reject */}
              {order.status === "payment_review" && order.slip.status === "pending" ? (
                <div className="flex flex-col gap-2.5">
                  {/* Note input */}
                  <div className="relative">
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="ข้อความถึงลูกค้า (ไม่บังคับ)..."
                      rows={2}
                      className="w-full text-xs text-gray-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 resize-none outline-none focus:border-[#85241F]/40 focus:ring-2 focus:ring-[#85241F]/10 placeholder:text-gray-400 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={() => { onApproveSlip(order.id, true, note || undefined); setNote(""); }}
                      className="bg-linear-to-r from-emerald-500 to-emerald-600 hover:opacity-95 text-white font-black h-9 rounded-xl flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-500/20"
                    >
                      <Check className="w-4 h-4" strokeWidth={3} />
                      {t("admin.slip.approve")}
                    </Button>
                    <Button
                      onClick={() => { onApproveSlip(order.id, false, note || undefined); setNote(""); }}
                      className="bg-linear-to-r from-red-500 to-red-600 hover:opacity-95 text-white font-black h-9 rounded-xl flex items-center justify-center gap-1.5 shadow-sm shadow-red-500/20"
                    >
                      <X className="w-4 h-4" strokeWidth={3} />
                      {t("admin.slip.reject")}
                    </Button>
                  </div>
                </div>
              ) : order.status === "shipped" ? (
                <div className="flex flex-col gap-3">
                  {/* Tracking number input */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-black text-gray-500">หมายเลขพัสดุ / Tracking</span>
                    <input
                      value={tracking}
                      onChange={(e) => setTracking(e.target.value)}
                      onBlur={() => tracking.trim() && tracking.trim() !== (order.trackingNumber ?? "") && onSaveTracking(order.id, tracking.trim())}
                      onKeyDown={(e) => e.key === "Enter" && tracking.trim() && tracking.trim() !== (order.trackingNumber ?? "") && onSaveTracking(order.id, tracking.trim())}
                      placeholder="EG123456789TH"
                      className="w-full text-xs font-mono text-gray-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-[#85241F]/40 focus:ring-2 focus:ring-[#85241F]/10 placeholder:text-gray-400 transition-all"
                    />
                    {order.trackingNumber && (
                      <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                        <Check className="w-3 h-3" strokeWidth={3} />
                        <span className="font-mono">{order.trackingNumber}</span>
                      </p>
                    )}
                  </div>

                  {/* Next / Prev */}
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={() => onStatusChange(order.id, timelineSteps[currentIdx + 1])}
                      className="w-full bg-linear-to-r from-[#85241F] to-[#B72D2A] hover:opacity-95 text-white font-black h-9 rounded-xl flex items-center gap-2 shadow-sm shadow-[#85241F]/15"
                    >
                      <ArrowRight className="w-4 h-4" />
                      <span className="font-black">{t(`admin.status.${timelineSteps[currentIdx + 1]}`)}</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => onStatusChange(order.id, timelineSteps[currentIdx - 1])}
                      className="w-full h-auto py-2.5 text-xs font-bold gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>{statusButtonLabel(timelineSteps[currentIdx - 1])}</span>
                    </Button>
                  </div>
                </div>
              ) : order.status === "cancelled" ? (
                <div className="bg-red-50/50 border border-red-100 rounded-xl p-3.5 flex items-center gap-2.5 text-red-700 text-xs font-bold">
                  <X className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{lang === "th" ? "คำสั่งซื้อถูกยกเลิกแล้ว" : "Order has been cancelled"}</span>
                </div>
              ) : order.status === "completed" ? (
                <div className="flex flex-col gap-2">
                  <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3.5 flex items-center gap-2.5 text-emerald-800 text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{t("admin.order.is_completed")}</span>
                  </div>
                  {currentIdx > 0 && (
                    <Button
                      variant="outline"
                      onClick={() => onStatusChange(order.id, timelineSteps[currentIdx - 1])}
                      className="w-full h-auto py-2.5 text-xs font-bold gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>{statusButtonLabel(timelineSteps[currentIdx - 1])}</span>
                    </Button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {currentIdx < timelineSteps.length - 1 && (
                    <Button
                      onClick={() => onStatusChange(order.id, timelineSteps[currentIdx + 1])}
                      className="w-full bg-linear-to-r from-[#85241F] to-[#B72D2A] hover:opacity-95 text-white font-black h-9 rounded-xl flex items-center gap-2 shadow-sm shadow-[#85241F]/15"
                    >
                      <ArrowRight className="w-4 h-4" />
                      <span className="font-black">{t(`admin.status.${timelineSteps[currentIdx + 1]}`)}</span>
                    </Button>
                  )}
                  {currentIdx > 0 && (
                    <Button
                      variant="outline"
                      onClick={() => onStatusChange(order.id, timelineSteps[currentIdx - 1])}
                      className="w-full h-auto py-2.5 text-xs font-bold gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>{statusButtonLabel(timelineSteps[currentIdx - 1])}</span>
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cancel section */}
          {canCancel && (
            <Card className="rounded-2xl shadow-3xs border-red-100/80">
              <CardContent className="p-4">
                <button
                  onClick={() => setShowCancel((v) => !v)}
                  className="w-full flex items-center justify-between text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    <span className="text-xs font-black text-red-500">ยกเลิกคำสั่งซื้อ</span>
                  </div>
                  {showCancel
                    ? <ChevronUp className="w-3.5 h-3.5 text-red-300" />
                    : <ChevronDown className="w-3.5 h-3.5 text-red-300" />}
                </button>

                {showCancel && (
                  <div className="mt-3 flex flex-col gap-2.5 animate-in slide-in-from-top-2 duration-150">
                    <textarea
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      placeholder="ระบุเหตุผลการยกเลิก..."
                      rows={2}
                      className="w-full text-xs text-gray-700 bg-red-50/50 border border-red-200 rounded-xl px-3 py-2.5 resize-none outline-none focus:border-red-400/60 focus:ring-2 focus:ring-red-400/10 placeholder:text-gray-400 transition-all"
                    />
                    <Button
                      onClick={() => {
                        if (!cancelReason.trim()) return;
                        onCancel(order.id, cancelReason.trim());
                        setCancelReason("");
                        setShowCancel(false);
                      }}
                      disabled={!cancelReason.trim()}
                      className="w-full bg-red-500 hover:bg-red-600 disabled:opacity-40 text-white font-black h-9 rounded-xl flex items-center justify-center gap-2 shadow-sm shadow-red-500/20 transition-all"
                    >
                      <X className="w-4 h-4" strokeWidth={3} />
                      ยืนยันยกเลิก
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

        </div>
      )}
    </Card>
  );
}

export default OrderRow;
