"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AlertCircle, ChevronDown, ChevronUp, Copy, Check, RefreshCw, Search, Truck, FileCheck2, Package, CheckCircle2, Upload, X as XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/lib/client/language-context";
import { LogisticsProgress } from "@/components/shop/logistics-progress";
import { ShopFooter } from "@/components/shop/shop-footer";
import { attachPaymentSlip, fetchOrdersByPhone } from "@/lib/modules/orders";

type OrderStatus =
  | "pending_payment" | "payment_review" | "paid"
  | "packing" | "shipped" | "completed" | "cancelled";

type Order = {
  id: string;
  customer: { name: string; phone: string };
  deliveryMode: "delivery" | "pickup";
  items: {
    productId: string;
    name: string | { th: string; en?: string };
    price: number;
    quantity: number;
    subtotal: number;
    selectedOption?: string;
    customName?: string;
  }[];
  total: number;
  status: OrderStatus;
  slip: { imageUrl?: string; status: string; reviewNote?: string };
  trackingNumber?: string;
  createdAt: string;
  updatedAt: string;
};

const fmt = new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 });
const money = (v: number) => fmt.format(v);
const MAX_SLIP_BYTES = 2 * 1024 * 1024;

function itemName(name: string | { th: string; en?: string }, lang: "th" | "en") {
  if (typeof name === "string") return name;
  return name[lang] || name.th;
}

function formatCustomName(raw: string): string {
  if (!raw.startsWith("charm:")) return raw;
  const parts = raw.slice(6).split(":");
  const color = parts[0] ?? "";
  const letters = parts[1] ?? "";
  return `สายห้อย สี${color}${letters ? ` · ${letters}` : ""}`;
}

const STATUS_LABEL: Record<string, { th: string; en: string; badge: string; icon: string }> = {
  payment_review:  { th: "รอยืนยันชำระ",  en: "Awaiting confirmation", badge: "text-amber-700 bg-amber-50",    icon: "bg-amber-100 text-amber-600"   },
  paid:            { th: "ชำระแล้ว",        en: "Paid",                  badge: "text-blue-700 bg-blue-50",      icon: "bg-blue-100 text-blue-600"     },
  packing:         { th: "กำลังแพ็ค",       en: "Packing",               badge: "text-blue-700 bg-blue-50",      icon: "bg-blue-100 text-blue-600"     },
  shipped:         { th: "จัดส่งแล้ว",       en: "Shipped",               badge: "text-emerald-700 bg-emerald-50", icon: "bg-emerald-100 text-emerald-600"},
  completed:       { th: "ส่งถึงมือแล้ว",  en: "Delivered",             badge: "text-emerald-700 bg-emerald-50", icon: "bg-emerald-100 text-emerald-600"},
  cancelled:       { th: "ยกเลิกแล้ว",      en: "Cancelled",             badge: "text-red-700 bg-red-50",        icon: "bg-red-100 text-red-500"       },
  pending_payment: { th: "รอชำระเงิน",      en: "Pending payment",       badge: "text-gray-500 bg-gray-100",     icon: "bg-gray-100 text-gray-400"     },
};

const RESUBMIT_STATUS = {
  th: "รอสลิปใหม่",
  en: "Awaiting new slip",
  badge: "text-red-700 bg-red-50",
  icon: "bg-red-100 text-red-500",
};

function statusMetaForOrder(order: Order) {
  if (order.status === "pending_payment" && order.slip.status === "rejected") return RESUBMIT_STATUS;
  if (order.status === "shipped" && order.deliveryMode === "pickup")
    return { ...STATUS_LABEL.shipped, th: "พร้อมรับสินค้า", en: "Ready for Pickup" };
  return STATUS_LABEL[order.status] ?? STATUS_LABEL.pending_payment;
}

function StatusIcon({ status }: { status: string }) {
  const cls = "w-4 h-4";
  if (status === "payment_review" || status === "paid" || status === "pending_payment") return <FileCheck2 className={cls} />;
  if (status === "packing")   return <Package     className={cls} />;
  if (status === "shipped")   return <Truck       className={cls} />;
  if (status === "completed") return <CheckCircle2 className={cls} />;
  if (status === "cancelled") return <XIcon       className={cls} />;
  return <FileCheck2 className={cls} />;
}

function OrderCard({ order, lang, onSlipUploaded }: { order: Order; lang: "th" | "en"; onSlipUploaded: () => void | Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [itemsOpen, setItemsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [uploadingSlip, setUploadingSlip] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [slipPreview, setSlipPreview] = useState("");
  const [slipImage, setSlipImage] = useState("");
  const [confirmSlip, setConfirmSlip] = useState(false);
  const slipInputRef = useRef<HTMLInputElement>(null);
  const showTracking = ["shipped", "completed"].includes(order.status) && Boolean(order.trackingNumber?.trim());
  const statusMeta = statusMetaForOrder(order);
  const needsNewSlip = order.status === "pending_payment" && order.slip.status === "rejected";
  const itemCount = order.items.reduce((s, i) => s + i.quantity, 0);
  const preview = order.items.map(i => `${itemName(i.name, lang)} ×${i.quantity}`).join(", ");
  const dateStr = new Date(order.createdAt).toLocaleDateString(lang === "th" ? "th-TH" : "en-US", { day: "numeric", month: "short" });

  function copyTracking() {
    if (!order.trackingNumber) return;
    navigator.clipboard.writeText(order.trackingNumber).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleNewSlip(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;

    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setUploadError(lang === "th" ? "รองรับเฉพาะ JPG, PNG, WEBP" : "Only JPG, PNG, or WEBP is supported");
      input.value = "";
      return;
    }

    if (file.size > MAX_SLIP_BYTES) {
      setUploadError(lang === "th" ? "รูปไฟล์ใหญ่เกินไป" : "Image is too large. Please keep it under 5 MB");
      input.value = "";
      return;
    }

    setUploadError("");
    const reader = new FileReader();
    reader.onload = (e) => {
      const image = String(e.target?.result ?? "");
      if (image.length > 2_900_000) {
        setUploadError(lang === "th" ? "รูปไฟล์ใหญ่เกินไป ขอไม่เกิน 2 MB นะ" : "Image is too large, please keep it under 2 MB");
        input.value = "";
        return;
      }
      setSlipPreview(image);
      setSlipImage(image);
      input.value = "";
    };
    reader.onerror = () => {
      setUploadError(lang === "th" ? "อ่านไฟล์ไม่สำเร็จ" : "Unable to read file");
      input.value = "";
    };
    reader.readAsDataURL(file);
  }

  async function submitNewSlip() {
    if (!slipImage) {
      setUploadError(lang === "th" ? "กรุณาอัปโหลดสลิปก่อน" : "Please upload a slip first");
      setConfirmSlip(false);
      return;
    }

    setUploadingSlip(true);
    setUploadError("");
    try {
      await attachPaymentSlip(order.id, slipImage);
      setSlipPreview("");
      setSlipImage("");
      setConfirmSlip(false);
      await onSlipUploaded();
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : lang === "th" ? "อัปโหลดสลิปไม่สำเร็จ" : "Unable to upload slip");
    } finally {
      setUploadingSlip(false);
    }
  }

  function clearNewSlip() {
    setSlipPreview("");
    setSlipImage("");
    setUploadError("");
    if (slipInputRef.current) slipInputRef.current.value = "";
  }

  return (
    <article className={`overflow-hidden rounded-3xl border bg-white shadow-sm transition-all duration-200 ${open ? "border-gray-200 shadow-md" : "border-gray-100"}`}>

      {/* Collapsed row — always visible */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50/40 transition-colors cursor-pointer"
      >
        {/* Icon circle */}
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${statusMeta.icon}`}>
          <StatusIcon status={order.status} />
        </div>

        <div className="flex-1 min-w-0">
          <span className="text-sm font-black text-gray-900 truncate block">{order.customer.name}</span>
          <p className="mt-0.5 text-xs text-gray-400 font-medium truncate">{preview}</p>
          <p className="mt-0.5 text-[10px] text-gray-300">{money(order.total)} · {dateStr}</p>
        </div>

        <div className="shrink-0">
          <span className={`inline-block text-xs font-black px-3 py-1 rounded-full ${statusMeta.badge}`}>
            {lang === "th" ? statusMeta.th : statusMeta.en}
          </span>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-gray-300 shrink-0" /> : <ChevronDown className="h-4 w-4 text-gray-300 shrink-0" />}
      </button>

      {/* Expanded content */}
      {open && (
        <div className="border-t border-gray-100 flex flex-col gap-3 p-4 animate-in slide-in-from-top-2 duration-200">

          <LogisticsProgress order={order} lang={lang} />

          {needsNewSlip && (
            <div className="rounded-2xl border border-red-100 bg-red-50/60 p-4">
              <div className="flex gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
                  <AlertCircle className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black text-red-800">
                    {lang === "th" ? "กรุณาส่งสลิปใหม่" : "Please upload a new slip"}
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-relaxed text-red-700/80">
                    {order.slip.reviewNote?.trim()
                      || (lang === "th"
                        ? "สลิปเดิมยังไม่ผ่านการตรวจสอบ กรุณาอัปโหลดสลิปที่ถูกต้องอีกครั้ง"
                        : "The previous slip could not be verified. Please upload the correct slip again.")}
                  </p>
                </div>
              </div>

              <div className={`mt-4 rounded-xl border border-dashed p-3 ${uploadError ? "border-red-300 bg-red-50/70" : "border-red-200 bg-white/70"}`}>
                <input ref={slipInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleNewSlip} />
                {slipPreview ? (
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={slipPreview} alt="payment slip" className="max-h-56 w-full rounded-lg object-contain" />
                    <button
                      type="button"
                      onClick={clearNewSlip}
                      className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-500 shadow"
                    >
                      <XIcon className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => slipInputRef.current?.click()}
                    className={`flex w-full flex-col items-center gap-2 py-9 ${uploadError ? "text-red-400" : "text-gray-400"}`}
                  >
                    <Upload className="h-7 w-7" />
                    <span className="text-xs font-bold">{lang === "th" ? "แตะเพื่ออัปโหลดสลิปใหม่" : "Tap to upload a new slip"}</span>
                  </button>
                )}
              </div>

              {uploadError && <p className="mt-2 text-xs font-bold text-red-700">{uploadError}</p>}

              <Button
                type="button"
                disabled={uploadingSlip || !slipImage}
                onClick={() => setConfirmSlip(true)}
                className="mt-3 h-10 w-full rounded-xl bg-brand px-4 text-xs font-black hover:bg-brand-hover disabled:opacity-50"
              >
                {uploadingSlip
                  ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  : <Check className="mr-2 h-4 w-4" />}
                {lang === "th" ? "ยืนยันส่งสลิปใหม่" : "Confirm new slip"}
              </Button>
            </div>
          )}

          {showTracking && (
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <Truck className="h-4 w-4 text-emerald-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">
                    {lang === "th" ? "เลขพัสดุ" : "Tracking No."}
                  </p>
                  <p className="mt-0.5 font-mono text-sm font-black text-gray-900 tracking-wide break-all">{order.trackingNumber}</p>
                </div>
              </div>
              <button
                onClick={copyTracking}
                className="shrink-0 flex items-center gap-1.5 rounded-xl bg-white border border-emerald-200 px-3 py-1.5 text-[11px] font-black text-emerald-700 hover:bg-emerald-100 active:scale-95 transition-all cursor-pointer"
              >
                {copied
                  ? <><Check className="h-3.5 w-3.5" />{lang === "th" ? "คัดลอกแล้ว" : "Copied"}</>
                  : <><Copy className="h-3.5 w-3.5" />{lang === "th" ? "คัดลอก" : "Copy"}</>}
              </button>
            </div>
          )}

          <div className="rounded-2xl border border-gray-100 overflow-hidden">
            <button
              onClick={() => setItemsOpen(v => !v)}
              className="flex w-full items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-gray-700">{lang === "th" ? "รายการสินค้า" : "Items"}</span>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-black text-gray-500">{itemCount}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-brand">{money(order.total)}</span>
                {itemsOpen ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
              </div>
            </button>
            {itemsOpen && (
              <div className="border-t border-gray-100 px-4 py-3 flex flex-col gap-2">
                {order.items.map((item) => (
                  <div key={`${order.id}-${item.productId}-${item.selectedOption ?? ""}`} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-gray-700">
                        {itemName(item.name, lang)}<span className="ml-1 text-gray-400 font-medium">×{item.quantity}</span>
                      </span>
                      <span className="text-sm font-bold text-gray-600 shrink-0">{money(item.subtotal)}</span>
                    </div>
                    {(item.selectedOption || item.customName) && (
                      <div className="flex flex-wrap gap-1.5 pl-2 border-l-2 border-brand/20">
                        {item.selectedOption && (
                          <span className="rounded-lg bg-brand/5 px-2.5 py-1 text-[10px] font-black text-brand">{item.selectedOption}</span>
                        )}
                        {item.customName && (
                          <span className="rounded-lg bg-amber-50 px-2.5 py-1 text-[10px] font-black text-amber-700">{formatCustomName(item.customName)}</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                <div className="border-t border-dashed border-gray-100 pt-2 flex items-center justify-between">
                  <span className="text-xs font-black text-gray-500">{lang === "th" ? "ยอดรวม" : "Total"}</span>
                  <span className="text-base font-black text-gray-900">{money(order.total)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {confirmSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <FileCheck2 className="h-6 w-6" />
            </div>
            <h2 className="text-center text-base font-black text-gray-900">
              {lang === "th" ? "ยืนยันส่งสลิปใหม่?" : "Submit new slip?"}
            </h2>
            <p className="mt-2 text-center text-sm font-semibold text-gray-500">
              {lang === "th" ? "กดยืนยันเพื่อส่งสลิปนี้ให้ร้านตรวจสอบอีกครั้ง" : "Confirm to send this slip for review again"}
            </p>
            {slipPreview && (
              <div className="mt-4 rounded-2xl bg-gray-50 p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={slipPreview} alt="payment slip preview" className="max-h-48 w-full rounded-xl object-contain" />
              </div>
            )}
            <div className="mt-5 grid grid-cols-2 gap-2">
              <Button type="button" variant="outline" disabled={uploadingSlip} onClick={() => setConfirmSlip(false)} className="h-11 rounded-xl font-black">
                {lang === "th" ? "ยกเลิก" : "Cancel"}
              </Button>
              <Button type="button" onClick={submitNewSlip} disabled={uploadingSlip} className="h-11 rounded-xl bg-emerald-600 font-black hover:bg-emerald-700">
                {uploadingSlip ? "..." : lang === "th" ? "ยืนยัน" : "Confirm"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

function ProfileContent() {
  const { lang } = useLanguage();
  const searchParams = useSearchParams();
  const customerPhone = searchParams.get("customerPhone") ?? "";
  const [phone, setPhone] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [searched, setSearched] = useState(false);

  async function loadOrders(nextPhone = phone) {
    const normalized = nextPhone.replace(/\D/g, "");
    if (normalized.length < 9) {
      setMessage(lang === "th" ? "กรุณากรอกเบอร์โทรให้ถูกต้อง" : "Enter a valid phone number.");
      setOrders([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const orders = await fetchOrdersByPhone(normalized);
      setOrders(orders);
      setSearched(true);
      localStorage.setItem("shop-last-phone", normalized);
    } catch (err) {
      setOrders([]);
      setSearched(false);
      setMessage(err instanceof Error ? err.message : "Unable to load orders");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      if (customerPhone) {
        setPhone(customerPhone);
        void loadOrders(customerPhone);
        return;
      }

      try {
        const stored = localStorage.getItem("shop-last-phone");
        if (stored) {
          setPhone(stored);
          void loadOrders(stored);
        }
      } catch { }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerPhone]);

  return (
    <>
    <main className="min-h-screen bg-background px-4 py-6 pb-24">
      <div className="mx-auto max-w-lg">

        {/* Search */}
        <div className="mb-5 rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="mb-3 text-sm font-black text-gray-900">
            {lang === "th" ? "ติดตามคำสั่งซื้อ" : "Track your order"}
          </p>
          <form onSubmit={(e) => { e.preventDefault(); void loadOrders(); }} className="flex gap-2">
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={lang === "th" ? "เบอร์โทรที่ใช้สั่งซื้อ" : "Phone used at checkout"}
              inputMode="tel"
              className="h-11 rounded-2xl flex-1"
            />
            <Button
              disabled={loading}
              className="h-11 rounded-2xl bg-brand font-black hover:bg-brand-hover shrink-0"
              type="submit"
            >
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </form>
          <p className="mt-2.5 text-[11px] font-semibold text-gray-400">
            {lang === "th" ? "ใช้เบอร์เดียวกับที่กรอกตอนสั่งซื้อ" : "Use the same phone number from checkout"}
          </p>
        </div>

        {message && (
          <div className="mb-4 rounded-2xl border border-gray-100 bg-white px-4 py-3 text-sm font-semibold text-gray-500 shadow-sm">
            {message}
          </div>
        )}

        {searched && !loading && orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center">
            <div className="w-20 h-20 rounded-3xl bg-gray-100 flex items-center justify-center">
              <Package className="w-9 h-9 text-gray-400" />
            </div>
            <div>
              <p className="text-lg font-black text-gray-900">
                {lang === "th" ? "ยังไม่มีคำสั่งซื้อเลย" : "No orders yet"}
              </p>
              <p className="mt-1 text-sm text-gray-400 font-medium">
                {lang === "th" ? "ลองเช็กว่าใช้เบอร์เดียวกับตอนสั่งซื้อไหมนะ" : "Make sure it's the phone you used at checkout"}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} lang={lang} onSlipUploaded={() => loadOrders(phone)} />
            ))}
          </div>
        )}
      </div>
    </main>
    <ShopFooter />
    </>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center text-sm font-semibold text-gray-400">
        Loading...
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
}

/*
            <article key={order.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="border-b border-gray-100 pb-4">
                <h2 className="text-base font-black text-gray-900">{order.customer.name}</h2>
                <p className="mt-1 text-xs font-semibold text-gray-500">
                  {new Date(order.createdAt).toLocaleString(lang === "th" ? "th-TH" : "en-US")}
                </p>
              </div>

              <LogisticsProgress order={order} lang={lang} />

              {canShowTrackingNumber(order) && (
                <div className="mb-3 flex items-center justify-between gap-2 rounded-xl border border-emerald-100 bg-emerald-50 p-3">
                  <div className="flex items-center gap-2 text-emerald-700">
                    <Truck className="h-4 w-4 shrink-0" />
                    <span className="text-xs font-black">
                      {lang === "th" ? "เลขพัสดุ" : "Tracking number"}
                    </span>
                  </div>
                  <span className="font-mono text-sm font-black tracking-wide text-gray-900">
                    {order.trackingNumber}
                  </span>
                </div>
              )}

              <div className="rounded-xl bg-gray-50 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-black text-gray-500">
                    {t("admin.order.item")}
                  </span>
                  <span className="text-sm font-black text-brand">
                    {money(order.total)}
                  </span>
                </div>
                <div className="space-y-2">
                  {order.items.map((item) => (
                    <div key={`${order.id}-${item.productId}-${item.selectedOption ?? ""}`} className="flex items-center justify-between gap-3 text-xs">
                      <div className="min-w-0">
                        <span className="block truncate font-semibold text-gray-700">
                          {typeof item.name === "object" ? (item.name[lang] || item.name.th) : item.name} x {item.quantity}
                        </span>
                        {item.selectedOption ? (
                          <span className="mt-0.5 block truncate text-[10px] font-black text-brand">
                            {item.selectedOption}
                          </span>
                        ) : null}
                        {item.customName ? (
                          <span className="mt-0.5 block truncate text-[10px] font-black text-amber-700">
                            ✎ {item.customName}
                          </span>
                        ) : null}
                      </div>
                      <span className="font-bold text-gray-500">{money(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
              </div>

            </article>
*/
