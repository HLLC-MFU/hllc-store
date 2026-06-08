"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronDown, ChevronUp, Copy, Check, RefreshCw, Search, Truck, FileCheck2, Package, CheckCircle2, X as XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/lib/client/language-context";
import { LogisticsProgress } from "@/components/shop/logistics-progress";
import { fetchOrdersByPhone } from "@/lib/modules/orders";

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
  }[];
  total: number;
  status: OrderStatus;
  slip: { imageUrl?: string; status: string };
  trackingNumber?: string;
  createdAt: string;
  updatedAt: string;
};

const fmt = new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 });
const money = (v: number) => fmt.format(v);

function itemName(name: string | { th: string; en?: string }, lang: "th" | "en") {
  if (typeof name === "string") return name;
  return name[lang] || name.th;
}

const STATUS_LABEL: Record<string, { th: string; en: string; badge: string; icon: string }> = {
  payment_review:  { th: "รอยืนยันชำระ",  en: "Awaiting confirmation", badge: "text-amber-700 bg-amber-50",    icon: "bg-amber-100 text-amber-600"   },
  paid:            { th: "ชำระแล้ว",        en: "Paid",                  badge: "text-blue-700 bg-blue-50",      icon: "bg-blue-100 text-blue-600"     },
  packing:         { th: "กำลังแพ็ค",       en: "Packing",               badge: "text-blue-700 bg-blue-50",      icon: "bg-blue-100 text-blue-600"     },
  shipped:         { th: "กำลังจัดส่ง",     en: "On the way",            badge: "text-sky-700 bg-sky-50",        icon: "bg-sky-100 text-sky-600"       },
  completed:       { th: "ส่งถึงมือแล้ว",  en: "Delivered",             badge: "text-emerald-700 bg-emerald-50", icon: "bg-emerald-100 text-emerald-600"},
  cancelled:       { th: "ยกเลิกแล้ว",      en: "Cancelled",             badge: "text-red-700 bg-red-50",        icon: "bg-red-100 text-red-500"       },
  pending_payment: { th: "รอชำระเงิน",      en: "Pending payment",       badge: "text-gray-500 bg-gray-100",     icon: "bg-gray-100 text-gray-400"     },
};

function StatusIcon({ status }: { status: string }) {
  const cls = "w-4 h-4";
  if (status === "payment_review" || status === "paid" || status === "pending_payment") return <FileCheck2 className={cls} />;
  if (status === "packing")   return <Package     className={cls} />;
  if (status === "shipped")   return <Truck       className={cls} />;
  if (status === "completed") return <CheckCircle2 className={cls} />;
  if (status === "cancelled") return <XIcon       className={cls} />;
  return <FileCheck2 className={cls} />;
}

function OrderCard({ order, lang }: { order: Order; lang: "th" | "en" }) {
  const [open, setOpen] = useState(false);
  const [itemsOpen, setItemsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const showTracking = ["shipped", "completed"].includes(order.status) && Boolean(order.trackingNumber?.trim());
  const statusMeta = STATUS_LABEL[order.status] ?? STATUS_LABEL.pending_payment;
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

          {showTracking && (
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
              <div className="flex items-center gap-2.5">
                <Truck className="h-4 w-4 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">
                    {lang === "th" ? "เลขพัสดุ" : "Tracking No."}
                  </p>
                  <p className="mt-0.5 font-mono text-sm font-black text-gray-900 tracking-wide">{order.trackingNumber}</p>
                </div>
              </div>
              <button
                onClick={copyTracking}
                className="flex items-center gap-1.5 rounded-xl bg-white border border-emerald-200 px-3 py-1.5 text-[11px] font-black text-emerald-700 hover:bg-emerald-100 active:scale-95 transition-all cursor-pointer"
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
                <span className="text-sm font-black text-[#85241F]">{money(order.total)}</span>
                {itemsOpen ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
              </div>
            </button>
            {itemsOpen && (
              <div className="border-t border-gray-100 px-4 py-3 flex flex-col gap-2">
                {order.items.map((item) => (
                  <div key={`${order.id}-${item.productId}-${item.selectedOption ?? ""}`} className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-gray-700 truncate">
                      {itemName(item.name, lang)}<span className="ml-1 text-gray-400 font-medium">×{item.quantity}</span>
                    </span>
                    {item.selectedOption ? (
                      <span className="max-w-24 truncate rounded-md bg-[#85241F]/5 px-2 py-0.5 text-[10px] font-black text-[#85241F]">
                        {item.selectedOption}
                      </span>
                    ) : null}
                    <span className="text-sm font-bold text-gray-600 shrink-0">{money(item.subtotal)}</span>
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

  async function loadOrders(nextPhone = phone) {
    const normalized = nextPhone.replace(/\D/g, "");
    if (normalized.length < 9) {
      setMessage(lang === "th" ? "กรุณากรอกเบอร์โทรให้ถูกต้อง" : "Enter a valid phone number.");
      setOrders([]);
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const orders = await fetchOrdersByPhone(normalized);
      setOrders(orders);
      localStorage.setItem("shop-last-phone", normalized);
      if (!orders.length) setMessage(lang === "th" ? "ยังไม่พบคำสั่งซื้อของเบอร์นี้" : "No orders found for this phone.");
    } catch (err) {
      setOrders([]);
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
    <main className="min-h-screen bg-[#f8fafc] px-4 py-6 pb-24">
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
              className="h-11 rounded-2xl bg-[#85241F] font-black hover:bg-[#B72D2A] shrink-0"
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

        <div className="flex flex-col gap-4">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} lang={lang} />
          ))}
        </div>
      </div>
    </main>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center text-sm font-semibold text-gray-400">
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
                  <span className="text-sm font-black text-[#85241F]">
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
                          <span className="mt-0.5 block truncate text-[10px] font-black text-[#85241F]">
                            {item.selectedOption}
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
