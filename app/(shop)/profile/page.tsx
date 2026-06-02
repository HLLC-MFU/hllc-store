"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, CheckCircle2, FileCheck2, Package, RefreshCw, Search, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/lib/language-context";
import { PageHeader } from "@/components/shop/page-header";

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
    name: string;
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

function money(value: number) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(value);
}


function logisticsIndex(status: OrderStatus) {
  if (status === "completed") return 3;
  if (status === "shipped")   return 2;
  if (status === "packing" || status === "paid") return 1;
  return 0;
}

function canShowTrackingNumber(order: Order) {
  return ["shipped", "completed"].includes(order.status) && Boolean(order.trackingNumber?.trim());
}

function LogisticsProgress({ order, lang }: { order: Order; lang: "th" | "en" }) {
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

export default function ProfilePage() {
  const { lang, t } = useLanguage();
  const searchParams = useSearchParams();
  const customerPhone = searchParams.get("customerPhone") ?? "";
  const [phone, setPhone] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (customerPhone) {
      setPhone(customerPhone);
      void loadOrders(customerPhone);
      return;
    }

    try {
      const storedPhone = localStorage.getItem("shop-last-phone");
      if (storedPhone) {
        setPhone(storedPhone);
        void loadOrders(storedPhone);
      }
    } catch { }
  }, [customerPhone, lang]);

  async function loadOrders(nextPhone = phone) {
    const normalizedPhone = nextPhone.replace(/\D/g, "");
    if (normalizedPhone.length < 9) {
      setMessage(lang === "th" ? "กรุณากรอกเบอร์โทรให้ถูกต้อง" : "Enter a valid phone number.");
      setOrders([]);
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`/api/backend/orders?customerPhone=${encodeURIComponent(normalizedPhone)}`, {
        cache: "no-store",
      });
      const payload = (await response.json()) as {
        data?: Order[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to load orders");
      }

      setOrders(payload.data ?? []);
      localStorage.setItem("shop-last-phone", normalizedPhone);
      if (!payload.data?.length) {
        setMessage(lang === "th" ? "ยังไม่พบคำสั่งซื้อของเบอร์นี้" : "No orders found for this phone.");
      }
    } catch (error) {
      setOrders([]);
      setMessage(error instanceof Error ? error.message : "Unable to load orders");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-white px-5 py-6 pb-24 lg:px-10">
      <div className="mx-auto max-w-4xl">
        <PageHeader title={lang === "th" ? "ติดตามคำสั่งซื้อ" : "Order tracking"} />

        <section className="mb-5 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void loadOrders();
            }}
            className="flex flex-col gap-3 sm:flex-row"
          >
            <Input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder={lang === "th" ? "กรอกเบอร์ที่ใช้สั่งซื้อ" : "Enter the phone used for the order"}
              className="h-11 rounded-xl"
            />
            <Button
              disabled={loading}
              className="h-11 rounded-xl bg-[#85241F] font-black hover:bg-[#B72D2A]"
              type="submit"
            >
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              {lang === "th" ? "ค้นหา" : "Search"}
            </Button>
          </form>
          <p className="mt-3 text-xs font-semibold text-gray-400">
            {lang === "th"
              ? "ใช้เบอร์โทรเดียวกับที่กรอกตอนสั่งซื้อ เพื่อดูสถานะคำสั่งซื้อของคุณ"
              : "Use the same phone number from checkout to see your order status."}
          </p>
        </section>

        {message ? (
          <div className="mb-5 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-600">
            {message}
          </div>
        ) : null}

        <section className="space-y-4">
          {orders.map((order) => (
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
                    <div key={`${order.id}-${item.productId}`} className="flex items-center justify-between gap-3 text-xs">
                      <span className="min-w-0 truncate font-semibold text-gray-700">
                        {item.name} x {item.quantity}
                      </span>
                      <span className="font-bold text-gray-500">{money(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
              </div>

            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
