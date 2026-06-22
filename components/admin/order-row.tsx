"use client";

import * as React from "react";
import Image from "next/image";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  FileCheck2,
  Mail,
  MapPin,
  MessageSquare,
  Package,
  Pencil,
  Phone,
  Send,
  Store,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/lib/client/language-context";
import type { Order, OrderStatus } from "./types";
import { STATUS_BG, STATUS_COLOR, STATUS_ICON } from "./types";
import { money, timeAgo, isPickupOrder } from "./api-client";
import { ShippingLabel } from "@/components/shop/cart/shipping-label";

export function OrderRow({ order, onStatusChange, onApproveSlip, onSaveTracking, onCancel, t, onViewSlip, useModal = false }: {
  order: Order;
  onStatusChange: (id: string, s: OrderStatus) => void;
  onApproveSlip: (orderId: string, approved: boolean, note?: string) => void;
  onSaveTracking: (orderId: string, trackingNumber: string) => void;
  onCancel: (orderId: string, reason: string) => void;
  t: (key: string, replacements?: Record<string, string | number>) => string;
  onViewSlip: (images: string[], index: number) => void;
  useModal?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const [note, setNote] = React.useState("");
  const [tracking, setTracking] = React.useState(order.trackingNumber ?? "");
  const [editingTracking, setEditingTracking] = React.useState(!order.trackingNumber);
  const [showCancel, setShowCancel] = React.useState(false);
  const [cancelReason, setCancelReason] = React.useState("");
  const [resendingEmail, setResendingEmail] = React.useState(false);
  const [resendDone, setResendDone] = React.useState(false);
  const [slipIndex, setSlipIndex] = React.useState(0);
  const slipScrollRef = React.useRef<HTMLDivElement>(null);
  const { lang } = useLanguage();
  const previousSlips = (order.slipHistory ?? []).filter((slip) => slip.imageUrl).slice(-4).reverse();
  // Current slip first, then previous ones — for the swipeable slip viewer.
  const slipImages = [order.slip.imageUrl, ...previousSlips.map((s) => s.imageUrl)].filter(Boolean) as string[];

  const canCancel = order.status !== "cancelled" && order.status !== "completed";

  const isPickup = order.deliveryMode === "pickup";
  const timelineSteps: OrderStatus[] = isPickup
    ? ["payment_review", "packing", "shipped", "completed"]
    : ["payment_review", "packing", "shipped"];

  const currentIdx = timelineSteps.indexOf(order.status);
  const statusLabel = (status?: OrderStatus) => {
    if (!status) return "";
    if (status === "shipped" && isPickup) return t("admin.status.shipped_pickup");
    if (status === "completed" && isPickup) return t("admin.status.completed_pickup");
    return t(`admin.status.${status}`);
  };
  const statusButtonLabel = statusLabel;

  return (
    <>
    <Card className={`rounded-3xl shadow-2xs overflow-hidden transition-all duration-200 border ${STATUS_BG[order.status]} ${open ? "shadow-md" : "hover:shadow-sm"}`}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-black/2 transition-colors cursor-pointer"
      >
        {/* Icon circle — same as profile page */}
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${STATUS_ICON[order.status]}`}>
          {order.status === "payment_review" && <FileCheck2 className="w-4 h-4" />}
          {order.status === "packing"         && <Package    className="w-4 h-4" />}
          {order.status === "shipped"         && <Truck      className="w-4 h-4" />}
          {order.status === "completed"       && <CheckCircle2 className="w-4 h-4" />}
          {order.status === "cancelled"       && <X          className="w-4 h-4" />}
          {(order.status === "pending_payment" || order.status === "paid") && <FileCheck2 className="w-4 h-4" />}
        </div>

        <div className="flex-1 min-w-0">
          <span className="font-extrabold text-sm text-gray-900 leading-none block truncate">{order.customer.name}</span>
          <p className="text-xs text-gray-500 mt-0.5 font-medium truncate">
            {order.items.map((i) => `${i.name[lang] || i.name.th} ×${i.quantity}`).join(", ")}
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5">{money(order.total)} · {timeAgo(order.createdAt, lang)}</p>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          <Badge className={`text-xs font-black px-3 py-1 rounded-full border-0 ${STATUS_COLOR[order.status]}`}>
            {statusLabel(order.status)}
          </Badge>
          {useModal
            ? <ArrowRight className="w-4 h-4 text-gray-300" />
            : open ? <ChevronUp className="w-4 h-4 text-gray-300" /> : <ChevronDown className="w-4 h-4 text-gray-300" />}
        </div>
      </button>

      {open && !useModal && (
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
                          <span className="text-[10px] font-black text-brand bg-brand/5 px-1.5 py-0.5 rounded-md">{n.action}</span>
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

          {/* Slip image — carousel */}
          {order.status === "payment_review" && order.slip.imageUrl && order.slip.status !== "none" && (
            <Card className="rounded-2xl shadow-3xs overflow-hidden">
              <CardContent className="p-3 pb-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                    {slipImages.length > 1
                      ? slipIndex === 0
                        ? "สลิปล่าสุด"
                        : `สลิปเก่า #${slipImages.length - slipIndex}`
                      : "สลิปล่าสุด"}
                  </span>
                  {slipImages.length > 1 && (
                    <span className="text-[10px] font-black text-gray-400">
                      {slipIndex + 1} / {slipImages.length}
                    </span>
                  )}
                </div>
              </CardContent>
              {/* Carousel */}
              <div className="relative h-52 md:h-72 bg-gray-100">
                <div
                  ref={slipScrollRef}
                  onScroll={(e) => {
                    const container = e.currentTarget;
                    const index = Math.round(container.scrollLeft / container.clientWidth);
                    if (index !== slipIndex && index >= 0 && index < slipImages.length) {
                      setSlipIndex(index);
                    }
                  }}
                  className="w-full h-full flex overflow-x-auto snap-x snap-mandatory scroll-smooth scrollbar-none"
                >
                  {slipImages.map((src, i) => (
                    <button
                      key={`${src}-${i}`}
                      type="button"
                      onClick={() => onViewSlip(slipImages, i)}
                      className="w-full h-full shrink-0 snap-center relative group cursor-pointer block"
                    >
                      <Image fill src={src} alt={`slip ${i + 1}`} className="object-cover" sizes="(max-width: 768px) 100vw, 640px" />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center transition-colors group-hover:bg-black/45">
                        <span className="text-white text-[11px] font-black bg-black/50 px-3 py-1.5 rounded-xl">กดเพื่อดูสลิป</span>
                      </div>
                    </button>
                  ))}
                </div>
                {slipImages.length > 1 && (
                  <>
                    {slipIndex > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          const next = slipIndex - 1;
                          slipScrollRef.current?.scrollTo({ left: next * (slipScrollRef.current.clientWidth), behavior: "smooth" });
                          setSlipIndex(next);
                        }}
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm shadow-md flex items-center justify-center text-gray-700 hover:bg-white active:scale-90 transition-all"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                    )}
                    {slipIndex < slipImages.length - 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const next = slipIndex + 1;
                          slipScrollRef.current?.scrollTo({ left: next * (slipScrollRef.current.clientWidth), behavior: "smooth" });
                          setSlipIndex(next);
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm shadow-md flex items-center justify-center text-gray-700 hover:bg-white active:scale-90 transition-all"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                      {slipImages.map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            slipScrollRef.current?.scrollTo({ left: i * (slipScrollRef.current.clientWidth), behavior: "smooth" });
                            setSlipIndex(i);
                          }}
                          className={`rounded-full transition-all ${i === slipIndex ? "w-4 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/60"}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
              {/* Review note for old slips */}
              {slipIndex > 0 && previousSlips[slipIndex - 1]?.reviewNote && (
                <CardContent className="border-t border-gray-100 p-3 pt-2">
                  <p className="text-[10px] font-semibold text-red-600 leading-relaxed">{previousSlips[slipIndex - 1].reviewNote}</p>
                </CardContent>
              )}
            </Card>
          )}

          {/* Shipping Label or Customer Info — hidden during slip review */}
          {order.status !== "payment_review" && (
            !isPickupOrder(order) ? (
              <ShippingLabel
                name={order.customer.name}
                address={order.customer.address}
                phone={order.customer.phone}
                lang={lang}
              />
            ) : (
              <Card className="rounded-2xl shadow-3xs">
                <CardContent className="p-4 flex flex-col gap-1.5">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">ข้อมูลผู้รับ</span>
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
                </CardContent>
              </Card>
            )
          )}

          {/* Items + Total */}
          <Card className="rounded-2xl shadow-3xs">
            <CardContent className="p-4 flex flex-col gap-4">
              <div className="flex flex-col gap-2.5">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">รายการสินค้า</span>
                {order.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm text-gray-800 font-semibold truncate">{item.name[lang] || item.name.th} <span className="text-gray-400 font-medium">×{item.quantity}</span></span>
                    <div className="flex shrink-0 flex-col items-end gap-1 ml-3">
                      <span className="text-sm font-black text-gray-900">{money(item.subtotal)}</span>
                      {item.selectedOption ? (
                        <span className="max-w-32 truncate rounded-md bg-brand/5 px-2 py-0.5 text-[10px] font-black text-brand">
                          {item.selectedOption}
                        </span>
                      ) : null}
                      {item.customName ? (
                        <span className="max-w-40 truncate rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-black text-amber-700">
                          ✎ {item.customName}
                        </span>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-1.5 pt-3 border-t border-slate-100">
                {order.subtotal !== undefined && order.shippingFee !== undefined && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-400">ยอดสินค้า</span>
                      <span className="text-sm font-black text-gray-600">{money(order.subtotal)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-400">ค่าส่ง</span>
                      <span className="text-sm font-black text-gray-600">
                        {order.shippingFee === 0 ? (isPickup ? "รับเอง (ฟรี)" : "ฟรี") : money(order.shippingFee)}
                      </span>
                    </div>
                  </>
                )}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-sm font-black text-gray-500">ยอดรวม</span>
                  <span className="text-xl font-black text-gray-950">{money(order.total)}</span>
                </div>
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
                  const isAtOrPastLastStep = currentIdx < 0;
                  const done = idx < currentIdx || isAtOrPastLastStep || (idx === currentIdx && currentIdx === timelineSteps.length - 1);
                  const active = idx === currentIdx && !done;
                  const StepIcon = s === "payment_review" ? FileCheck2
                    : s === "packing" ? Package
                    : s === "shipped" ? (isPickup ? Store : Truck)
                    : CheckCircle2;
                  return (
                    <div key={s} className="flex flex-col items-center z-10">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 shadow-sm ${
                        done ? "bg-emerald-500 border-emerald-500 text-white" :
                        active && isPickup ? "bg-white border-emerald-500 text-emerald-500 scale-110 ring-4 ring-emerald-500/5" :
                        active ? "bg-white border-brand text-brand scale-110 ring-4 ring-brand/5" :
                        "bg-white border-gray-200 text-gray-300"
                      }`}>
                        {done ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : <StepIcon className="w-3.5 h-3.5" />}
                      </div>
                      <span className={`text-[10px] font-bold mt-2 text-center max-w-16 truncate block ${
                        active && !isPickup ? "text-brand font-black" : (active || done) ? "text-emerald-600 font-black" : "text-gray-400"
                      }`}>
                        {statusLabel(s)}
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
                      className="w-full text-xs text-gray-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 resize-none outline-none focus:border-brand/40 focus:ring-2 focus:ring-brand/10 placeholder:text-gray-400 transition-all"
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
              ) : order.status === "packing" ? (
                isPickup ? (
                  <Button
                    onClick={() => onStatusChange(order.id, "shipped")}
                    className="w-full bg-linear-to-r from-brand to-brand-hover hover:opacity-95 text-white font-black h-9 rounded-xl flex items-center gap-2 shadow-sm shadow-brand/15"
                  >
                    <Store className="w-4 h-4" />
                    <span className="font-black">พร้อมให้รับสินค้าแล้ว</span>
                  </Button>
                ) : (
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-xs font-black text-gray-500">หมายเลขพัสดุ / Tracking</span>
                      <div className="relative">
                        <input
                          value={tracking}
                          onChange={(e) => setTracking(e.target.value)}
                          placeholder="EG123456789TH"
                          readOnly={!editingTracking}
                          className={`w-full text-xs font-mono text-gray-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 pr-9 outline-none focus:border-brand/40 focus:ring-2 focus:ring-brand/10 placeholder:text-gray-400 transition-all ${!editingTracking ? "cursor-default" : ""}`}
                        />
                        {!editingTracking && (
                          <button type="button" onClick={() => setEditingTracking(true)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand transition-colors cursor-pointer">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    <Button
                      disabled={!tracking.trim()}
                      onClick={() => {
                        onSaveTracking(order.id, tracking.trim());
                        setEditingTracking(false);
                        onStatusChange(order.id, "shipped");
                      }}
                      className="w-full bg-linear-to-r from-brand to-brand-hover hover:opacity-95 text-white font-black h-9 rounded-xl flex items-center gap-2 shadow-sm shadow-brand/15 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Truck className="w-4 h-4" />
                      <span className="font-black">ยืนยันจัดส่ง</span>
                    </Button>
                  </div>
                )
              ) : order.status === "shipped" ? (
                isPickup ? (
                  <Button
                    onClick={() => onStatusChange(order.id, "completed")}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black h-9 rounded-xl flex items-center gap-2 shadow-sm"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="font-black">ยืนยันลูกค้ารับสินค้าแล้ว</span>
                  </Button>
                ) : (
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-xs font-black text-gray-500">หมายเลขพัสดุ / Tracking</span>
                      <div className="relative">
                        <input
                          value={tracking}
                          onChange={(e) => setTracking(e.target.value)}
                          placeholder="EG123456789TH"
                          readOnly={!editingTracking}
                          className={`w-full text-xs font-mono text-gray-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 pr-9 outline-none focus:border-brand/40 focus:ring-2 focus:ring-brand/10 placeholder:text-gray-400 transition-all ${!editingTracking ? "cursor-default" : ""}`}
                        />
                        {!editingTracking && (
                          <button type="button" onClick={() => setEditingTracking(true)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand transition-colors cursor-pointer">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      {order.trackingNumber && (
                        <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                          <Check className="w-3 h-3" strokeWidth={3} />
                          <span className="font-mono">{order.trackingNumber}</span>
                        </p>
                      )}
                    </div>
                    <Button
                      disabled={!tracking.trim() || tracking.trim() === (order.trackingNumber ?? "")}
                      onClick={() => {
                        if (tracking.trim() && tracking.trim() !== (order.trackingNumber ?? "")) {
                          onSaveTracking(order.id, tracking.trim());
                          setEditingTracking(false);
                        }
                      }}
                      className="w-full bg-linear-to-r from-brand to-brand-hover hover:opacity-95 text-white font-black h-9 rounded-xl flex items-center gap-2 shadow-sm shadow-brand/15 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Check className="w-4 h-4" />
                      <span className="font-black">{t("admin.order.save_tracking")}</span>
                    </Button>
                  </div>
                )
              ) : order.status === "cancelled" ? (
                <div className="bg-red-50/50 border border-red-100 rounded-xl p-3.5 flex items-center gap-2.5 text-red-700 text-xs font-bold">
                  <X className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{t("admin.order.cancelled_msg")}</span>
                </div>
              ) : order.status === "completed" ? (
                <div className="flex flex-col gap-2">
                  <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3.5 flex items-center gap-2.5 text-emerald-800 text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{t("admin.order.shipped_done")}</span>
                  </div>
                  {currentIdx > 1 && (
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
                      className="w-full bg-linear-to-r from-brand to-brand-hover hover:opacity-95 text-white font-black h-9 rounded-xl flex items-center gap-2 shadow-sm shadow-brand/15"
                    >
                      <ArrowRight className="w-4 h-4" />
                      <span className="font-black">{statusLabel(timelineSteps[currentIdx + 1])}</span>
                    </Button>
                  )}
                  {currentIdx > 1 && (
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

          {/* Resend email */}
          {order.customer.email && (
            <Card className="rounded-2xl shadow-3xs border-sky-100/80">
              <CardContent className="p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-sky-400" />
                  <span className="text-xs font-black text-sky-600">ส่ง email ใหม่</span>
                  <span className="text-[10px] text-gray-400 font-medium truncate max-w-36">{order.customer.email}</span>
                </div>
                <Button
                  disabled={resendingEmail || resendDone}
                  onClick={async () => {
                    setResendingEmail(true);
                    try {
                      await fetch(`/api/backend/admin/orders/${order.id}?action=resend-email`, { method: "POST", headers: { "x-admin-token": document.cookie.match(/admin_token=([^;]+)/)?.[1] ?? "", "x-csrf-token": document.cookie.match(/admin_csrf=([^;]+)/)?.[1] ?? "" } });
                      setResendDone(true);
                      setTimeout(() => setResendDone(false), 4000);
                    } finally {
                      setResendingEmail(false);
                    }
                  }}
                  className={`h-8 px-3 rounded-xl text-xs font-black shrink-0 ${resendDone ? "bg-emerald-500 text-white" : "bg-sky-50 text-sky-600 hover:bg-sky-100"}`}
                >
                  {resendDone ? <><Check className="w-3.5 h-3.5" /> ส่งแล้ว</> : resendingEmail ? "กำลังส่ง..." : <><Send className="w-3.5 h-3.5" /> ส่ง</>}
                </Button>
              </CardContent>
            </Card>
          )}

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

    {/* Modal portal — rendered outside Card */}
    {useModal && open && typeof window !== "undefined" && createPortal(
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/80 animate-in fade-in duration-150" style={{zIndex:50}} onClick={() => setOpen(false)}>
        <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[92dvh] sm:max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
          {/* Drag handle — mobile only */}
          <div className="flex justify-center pt-3 pb-1 sm:hidden shrink-0">
            <div className="w-10 h-1 rounded-full bg-gray-200" />
          </div>

          {/* Modal header — name + X */}
          <div className="flex items-center justify-between px-5 pt-2 sm:pt-4 pb-3 shrink-0 gap-2">
            <div className="min-w-0">
              <p className="font-black text-sm text-gray-900 truncate">{order.customer.name}</p>
              <p className="text-xs text-gray-400 mt-0.5 truncate">{order.items.map((i) => `${i.name[lang] || i.name.th} ×${i.quantity}`).join(", ")}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {canCancel && !showCancel && (
                <button
                  type="button"
                  onClick={() => setShowCancel(true)}
                  className="p-1.5 rounded-xl hover:bg-red-50 cursor-pointer text-gray-400 hover:text-red-500 transition-colors"
                  title="ยกเลิกคำสั่งซื้อ"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button type="button" onClick={() => setOpen(false)} className="p-1.5 rounded-xl hover:bg-gray-100 cursor-pointer text-gray-400 shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Stepper in header */}
          {order.status !== "cancelled" && (
            <div className="px-5 pb-4 border-b border-gray-100 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08)] shrink-0">
              <div className="flex items-center justify-between relative">
                <div className="absolute top-3.5 left-4 right-4 h-0.5 bg-gray-100 z-0" />
                <div className="absolute top-3.5 left-4 h-0.5 bg-emerald-500 z-0 transition-all duration-500" style={{ width: `${(Math.max(0, currentIdx) / (timelineSteps.length - 1)) * 88}%` }} />
                {timelineSteps.map((s, idx) => {
                  const isAtOrPastLastStep = currentIdx < 0;
                  const done = idx < currentIdx || isAtOrPastLastStep || (idx === currentIdx && currentIdx === timelineSteps.length - 1);
                  const active = idx === currentIdx && !done;
                  const StepIcon = s === "payment_review" ? FileCheck2 : s === "packing" ? Package : s === "shipped" ? (isPickup ? Store : Truck) : CheckCircle2;
                  return (
                    <div key={s} className="flex flex-col items-center z-10">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all shadow-sm ${done ? "bg-emerald-500 border-emerald-500 text-white" : active && isPickup ? "bg-white border-emerald-500 text-emerald-500 scale-110 ring-4 ring-emerald-500/5" : active ? "bg-white border-brand text-brand scale-110 ring-4 ring-brand/5" : "bg-white border-gray-200 text-gray-300"}`}>
                        {done ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : <StepIcon className="w-3.5 h-3.5" />}
                      </div>
                      <span className={`text-[10px] font-bold mt-1.5 text-center max-w-16 truncate block ${active && !isPickup ? "text-brand font-black" : (active || done) ? "text-emerald-600 font-black" : "text-gray-400"}`}>
                        {statusLabel(s)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {/* Slip — fixed, always visible, not inside scroll */}
          {order.status === "payment_review" && order.slip.imageUrl && order.slip.status !== "none" && (
            <div className="shrink-0 border-b border-gray-100">
              <div className="flex items-center justify-between px-4 py-2 bg-gray-50/80">
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                  {slipImages.length > 1 ? (slipIndex === 0 ? "สลิปล่าสุด" : `สลิปเก่า #${slipImages.length - slipIndex}`) : "สลิปล่าสุด"}
                </span>
                {slipImages.length > 1 && <span className="text-[10px] font-black text-gray-400">{slipIndex + 1} / {slipImages.length}</span>}
              </div>
              <div className="relative h-40 sm:h-52 bg-gray-100">
                <div
                  ref={slipScrollRef}
                  onScroll={(e) => {
                    const container = e.currentTarget;
                    const index = Math.round(container.scrollLeft / container.clientWidth);
                    if (index !== slipIndex && index >= 0 && index < slipImages.length) setSlipIndex(index);
                  }}
                  className="w-full h-full flex overflow-x-auto snap-x snap-mandatory scroll-smooth scrollbar-none"
                >
                  {slipImages.map((src, i) => (
                    <button key={`${src}-${i}`} type="button" onClick={() => onViewSlip(slipImages, i)}
                      className="w-full h-full shrink-0 snap-center relative group cursor-pointer block">
                      <Image fill src={src} alt={`slip ${i + 1}`} className="object-cover" sizes="(max-width: 768px) 100vw, 640px" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 flex items-end px-3 pb-3 transition-colors">
                        <span className="opacity-0 group-hover:opacity-100 text-white text-[9px] font-black bg-black/60 px-2 py-1 rounded-lg">ขยาย</span>
                      </div>
                    </button>
                  ))}
                </div>
                {slipImages.length > 1 && (
                  <>
                    {slipIndex > 0 && (
                      <button type="button" onClick={() => { const n = slipIndex - 1; slipScrollRef.current?.scrollTo({ left: n * slipScrollRef.current.clientWidth, behavior: "smooth" }); setSlipIndex(n); }}
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm shadow-md flex items-center justify-center text-gray-700 hover:bg-white active:scale-90 transition-all">
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                    )}
                    {slipIndex < slipImages.length - 1 && (
                      <button type="button" onClick={() => { const n = slipIndex + 1; slipScrollRef.current?.scrollTo({ left: n * slipScrollRef.current.clientWidth, behavior: "smooth" }); setSlipIndex(n); }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm shadow-md flex items-center justify-center text-gray-700 hover:bg-white active:scale-90 transition-all">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                      {slipImages.map((_, i) => (
                        <button key={i} type="button" onClick={() => { slipScrollRef.current?.scrollTo({ left: i * slipScrollRef.current.clientWidth, behavior: "smooth" }); setSlipIndex(i); }}
                          className={`rounded-full transition-all ${i === slipIndex ? "w-4 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/60"}`} />
                      ))}
                    </div>
                  </>
                )}
              </div>
              {slipIndex > 0 && previousSlips[slipIndex - 1]?.reviewNote && (
                <p className="px-4 py-2 text-[10px] font-semibold text-red-600 border-t border-gray-100 bg-red-50/50">{previousSlips[slipIndex - 1].reviewNote}</p>
              )}
            </div>
          )}

          {/* Modal body — same content as dropdown */}
          <div className="overflow-y-auto flex-1 p-4 bg-slate-50/20 flex flex-col gap-4">

            {/* Admin Notes */}
            {order.adminNotes && order.adminNotes.length > 0 && (
              <Card className="rounded-2xl shadow-3xs">
                <CardContent className="p-4 flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">บันทึกแอดมิน</span>
                  </div>
                  {order.adminNotes.map((n, i) => (
                    <div key={i} className="flex gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 shrink-0" />
                      <div className="pb-1 flex-1">
                        <span className="text-[10px] font-black text-brand bg-brand/5 px-1.5 py-0.5 rounded-md">{n.action}</span>
                        <span className="text-[10px] text-gray-400 ml-1">โดย {n.by}</span>
                        {n.text && <p className="text-xs text-gray-600 mt-0.5">{n.text}</p>}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Shipping label or customer info */}
            {order.status !== "payment_review" && (
              isPickupOrder(order) ? (
                <Card className="rounded-2xl shadow-3xs">
                  <CardContent className="p-4 flex flex-col gap-1.5">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">ข้อมูลผู้รับ</span>
                    <span className="text-base font-black text-gray-900">{order.customer.name}</span>
                    <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                      <Phone className="w-3.5 h-3.5 text-gray-400" /><span>{order.customer.phone}</span>
                    </div>
                    {order.customer.email && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                        <Mail className="w-3.5 h-3.5 text-gray-400" /><span>{order.customer.email}</span>
                      </div>
                    )}
                    <div className="flex items-start gap-2 text-sm text-gray-600 font-medium">
                      <MapPin className="w-3.5 h-3.5 mt-0.5 text-gray-400" /><span>{order.customer.address}</span>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <ShippingLabel name={order.customer.name} address={order.customer.address} phone={order.customer.phone} lang={lang} />
              )
            )}

            {/* Items + Total */}
            <Card className="rounded-2xl shadow-3xs">
              <CardContent className="p-4 flex flex-col gap-4">
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">รายการสินค้า</span>
                    <div className="flex items-center gap-1.5 bg-gray-100 rounded-lg px-2.5 py-1">
                      <span className="text-[10px] font-black text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString(lang === "th" ? "th-TH" : "en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                      </span>
                      <span className="text-gray-300 text-[10px]">·</span>
                      <span className="text-[10px] font-black text-brand">
                        {new Date(order.createdAt).toLocaleTimeString(lang === "th" ? "th-TH" : "en-GB", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2.5">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-800 font-semibold">{item.name[lang] || item.name.th} <span className="text-gray-400 font-medium">×{item.quantity}</span></span>
                        <span className="text-sm font-black text-gray-900 shrink-0 ml-3">{money(item.subtotal)}</span>
                      </div>
                      {(item.selectedOption || item.customName) && (
                        <div className="flex flex-wrap gap-1.5 pl-2 border-l-2 border-brand/20">
                          {item.selectedOption && (
                            <div className="flex items-center gap-1 rounded-lg bg-brand/5 px-2.5 py-1">
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">ตัวเลือก</span>
                              <span className="text-[11px] font-black text-brand">{item.selectedOption}</span>
                            </div>
                          )}
                          {item.customName && (
                            <div className="flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1">
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">ชื่อ</span>
                              <span className="text-[11px] font-black text-amber-700">{item.customName}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  </div>{/* end items scroll */}
                </div>
                <div className="flex flex-col gap-1.5 pt-3 border-t border-slate-100">
                  {order.subtotal !== undefined && order.shippingFee !== undefined && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-400">ยอดสินค้า</span>
                        <span className="text-sm font-black text-gray-600">{money(order.subtotal)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-400">ค่าส่ง</span>
                        <span className="text-sm font-black text-gray-600">
                          {order.shippingFee === 0 ? (isPickup ? "รับเอง (ฟรี)" : "ฟรี") : money(order.shippingFee)}
                        </span>
                      </div>
                    </>
                  )}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-sm font-black text-gray-500">ยอดรวม</span>
                    <span className="text-xl font-black text-gray-950">{money(order.total)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>{/* end scrollable body */}

          {/* Footer — fixed, not scrollable */}
          <div className="shrink-0 border-t border-gray-100 shadow-[0_-2px_8px_-2px_rgba(0,0,0,0.08)] bg-white p-4 flex flex-col gap-3">

            {/* Status changer — full */}
            <Card className="rounded-2xl shadow-3xs">
              <CardContent className="p-4">
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-3">{t("admin.order.change_status")}</p>
                {order.status === "payment_review" && order.slip.status === "pending" ? (
                  <div className="flex flex-col gap-2.5">
                    <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="ข้อความถึงลูกค้า (ไม่บังคับ)..." rows={2}
                      className="w-full text-xs text-gray-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 resize-none outline-none focus:border-brand/40 placeholder:text-gray-400 transition-all" />
                    <div className="grid grid-cols-2 gap-2">
                      <Button onClick={() => { onApproveSlip(order.id, true, note || undefined); setNote(""); }}
                        className="bg-linear-to-r from-emerald-500 to-emerald-600 hover:opacity-95 text-white font-black h-9 rounded-xl gap-1.5">
                        <Check className="w-4 h-4" strokeWidth={3} />{t("admin.slip.approve")}
                      </Button>
                      <Button onClick={() => { onApproveSlip(order.id, false, note || undefined); setNote(""); }}
                        className="bg-linear-to-r from-red-500 to-red-600 hover:opacity-95 text-white font-black h-9 rounded-xl gap-1.5">
                        <X className="w-4 h-4" strokeWidth={3} />{t("admin.slip.reject")}
                      </Button>
                    </div>
                  </div>
                ) : order.status === "packing" ? (
                  isPickup ? (
                    <Button
                      onClick={() => onStatusChange(order.id, "shipped")}
                      className="w-full bg-linear-to-r from-brand to-brand-hover hover:opacity-95 text-white font-black h-9 rounded-xl gap-2"
                    >
                      <Store className="w-4 h-4" />
                      พร้อมให้รับสินค้าแล้ว
                    </Button>
                  ) : (
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-xs font-black text-gray-500">หมายเลขพัสดุ / Tracking</span>
                      <div className="relative">
                        <input value={tracking} onChange={(e) => setTracking(e.target.value)}
                          readOnly={!editingTracking}
                          placeholder="EG123456789TH"
                          className={`w-full text-xs font-mono text-gray-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 pr-9 outline-none focus:border-brand/40 placeholder:text-gray-400 transition-all ${!editingTracking ? "cursor-default" : ""}`} />
                        {!editingTracking && (
                          <button type="button" onClick={() => setEditingTracking(true)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand transition-colors cursor-pointer">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    <Button
                      disabled={!tracking.trim()}
                      onClick={() => {
                        onSaveTracking(order.id, tracking.trim());
                        setEditingTracking(false);
                        onStatusChange(order.id, "shipped");
                      }}
                      className="w-full bg-linear-to-r from-brand to-brand-hover hover:opacity-95 text-white font-black h-9 rounded-xl gap-2 disabled:opacity-40"
                    >
                      <Truck className="w-4 h-4" />
                      ยืนยันจัดส่ง
                    </Button>
                  </div>
                  )
                ) : order.status === "shipped" ? (
                  isPickup ? (
                    <Button
                      onClick={() => onStatusChange(order.id, "completed")}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black h-9 rounded-xl gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      ยืนยันลูกค้ารับสินค้าแล้ว
                    </Button>
                  ) : (
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-xs font-black text-gray-500">หมายเลขพัสดุ / Tracking</span>
                      <div className="relative">
                        <input value={tracking} onChange={(e) => setTracking(e.target.value)}
                          readOnly={!editingTracking}
                          placeholder="EG123456789TH"
                          className={`w-full text-xs font-mono text-gray-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 pr-9 outline-none focus:border-brand/40 placeholder:text-gray-400 transition-all ${!editingTracking ? "cursor-default" : ""}`} />
                        {!editingTracking && (
                          <button type="button" onClick={() => setEditingTracking(true)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand transition-colors cursor-pointer">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      {order.trackingNumber && <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1"><Check className="w-3 h-3" strokeWidth={3} />{order.trackingNumber}</p>}
                    </div>
                    <Button
                      disabled={!tracking.trim() || tracking.trim() === (order.trackingNumber ?? "")}
                      onClick={() => {
                        if (tracking.trim() && tracking.trim() !== (order.trackingNumber ?? "")) {
                          onSaveTracking(order.id, tracking.trim());
                          setEditingTracking(false);
                        }
                      }}
                      className="w-full bg-linear-to-r from-brand to-brand-hover hover:opacity-95 text-white font-black h-9 rounded-xl gap-2 disabled:opacity-40"
                    >
                      <Check className="w-4 h-4" />
                      {t("admin.order.save_tracking")}
                    </Button>
                  </div>
                  )
                ) : order.status === "cancelled" ? (
                  <div className="bg-red-50/50 border border-red-100 rounded-xl p-3.5 flex items-center gap-2.5 text-red-700 text-xs font-bold">
                    <X className="w-4 h-4 text-red-500 shrink-0" />{t("admin.order.cancelled_msg")}
                  </div>
                ) : order.status === "completed" ? (
                  <div className="flex flex-col gap-2">
                    <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3.5 flex items-center gap-2.5 text-emerald-800 text-xs font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />{t("admin.order.shipped_done")}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {currentIdx < timelineSteps.length - 1 && (
                      <Button onClick={() => { onStatusChange(order.id, timelineSteps[currentIdx + 1]); }} className="w-full bg-linear-to-r from-brand to-brand-hover hover:opacity-95 text-white font-black h-9 rounded-xl gap-2">
                        <ArrowRight className="w-4 h-4" />{statusLabel(timelineSteps[currentIdx + 1])}
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Cancel form — shown when trash icon clicked */}
            {showCancel && (
              <div className="flex flex-col gap-2 animate-in slide-in-from-bottom-2 duration-150 border-t border-red-100 pt-3">
                <p className="text-xs font-black text-red-500">ยกเลิกคำสั่งซื้อ</p>
                <textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="ระบุเหตุผลการยกเลิก..." rows={2}
                  className="w-full text-xs text-gray-700 bg-red-50/50 border border-red-200 rounded-xl px-3 py-2.5 resize-none outline-none placeholder:text-gray-400 transition-all" />
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" onClick={() => { setShowCancel(false); setCancelReason(""); }} className="h-9 rounded-xl text-xs font-bold">
                    ไม่ยกเลิก
                  </Button>
                  <Button onClick={() => { if (!cancelReason.trim()) return; onCancel(order.id, cancelReason.trim()); setCancelReason(""); setShowCancel(false); }}
                    disabled={!cancelReason.trim()}
                    className="h-9 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-40 text-white font-black gap-1.5">
                    <X className="w-3.5 h-3.5" strokeWidth={3} />ยืนยันยกเลิก
                  </Button>
                </div>
              </div>
            )}

          </div>{/* end footer */}
        </div>
      </div>,
      document.body
    )}
    </>
  );
}

export default OrderRow;
