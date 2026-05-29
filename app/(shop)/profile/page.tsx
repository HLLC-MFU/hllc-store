"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, ClipboardList, RefreshCw, Search, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/lib/language-context";

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
    amount?: number;
    status: SlipStatus;
  };
  trackingNumber?: string;
  createdAt: string;
  updatedAt: string;
};

const LOGISTICS_STEPS = [
  { th: "รอตรวจสลิป", en: "Reviewing slip" },
  { th: "จัดส่งแล้ว", en: "Shipped" },
  { th: "สำเร็จ", en: "Complete" },
];

function money(value: number) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(value);
}

function statusClass(status: OrderStatus) {
  if (status === "cancelled") return "border-red-200 bg-red-50 text-red-700";
  if (status === "completed") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (["paid", "packing", "shipped"].includes(status)) {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }
  return "border-amber-200 bg-amber-50 text-amber-700";
}

function logisticsIndex(status: OrderStatus) {
  if (status === "completed") return 2;
  if (["paid", "packing", "shipped"].includes(status)) return 1;
  return 0;
}

function canShowTrackingNumber(order: Order) {
  return ["shipped", "completed"].includes(order.status) && Boolean(order.trackingNumber?.trim());
}

function LogisticsProgress({ order, lang }: { order: Order; lang: "th" | "en" }) {
  const activeIndex = logisticsIndex(order.status);
  const cancelled = order.status === "cancelled";
  const complete = order.status === "completed";

  if (cancelled) {
    return (
      <div className="my-4 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700">
        {lang === "th" ? "คำสั่งซื้อนี้ถูกยกเลิก" : "This order has been cancelled."}
      </div>
    );
  }

  return (
    <div className="my-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <p className="text-xs font-black text-slate-800">
        {lang === "th" ? "การจัดส่ง (LOGISTICS)" : "LOGISTICS"}
      </p>
      <div className="mt-5 px-2">
        <div className="relative flex items-start justify-between">
          <div className="absolute left-4 right-4 top-3 h-0.5 bg-gray-200" />
          <div
            className="absolute left-4 top-3 h-0.5 bg-[#96231F] transition-all duration-500"
            style={{ width: activeIndex === 0 ? "0%" : activeIndex === 1 ? "50%" : "calc(100% - 2rem)" }}
          />
          {LOGISTICS_STEPS.map((step, index) => {
            const active = index <= activeIndex;

            return (
              <div key={step.en} className="relative z-10 flex w-20 flex-col items-center">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black text-white ${active ? "bg-[#96231F]" : "bg-gray-300"
                    }`}
                >
                  {index + 1}
                </span>
                <span className={`mt-2 text-center text-[9px] font-black ${active ? "text-slate-800" : "text-gray-400"}`}>
                  {lang === "th" ? step.th : step.en}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      {complete ? (
        <div className="mt-5 border-t border-gray-100 pt-3">
          <p className="flex items-center gap-2 text-sm font-black text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
            {lang === "th" ? "คำสั่งซื้อเสร็จสิ้นแล้ว" : "Order completed"}
          </p>
        </div>
      ) : null}
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
        <header className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase text-gray-400">{t("nav.profile")}</p>
            <h1 className="text-2xl font-black text-gray-900">
              {lang === "th" ? "ติดตามคำสั่งซื้อ" : "Order tracking"}
            </h1>
          </div>
          <Button asChild variant="outline" className="rounded-xl">
            <Link href="/home">{lang === "th" ? "กลับหน้าร้าน" : "Back to shop"}</Link>
          </Button>
        </header>

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
              <div className="flex flex-col gap-3 border-b border-gray-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-400">
                    #{order.id.slice(-8).toUpperCase()}
                  </p>
                  <h2 className="mt-1 text-base font-black text-gray-900">
                    {order.customer.name}
                  </h2>
                  <p className="mt-1 text-xs font-semibold text-gray-500">
                    {new Date(order.createdAt).toLocaleString(lang === "th" ? "th-TH" : "en-US")}
                  </p>
                </div>
                <span className={`w-fit rounded-full border px-3 py-1 text-xs font-black ${statusClass(order.status)}`}>
                  {t(`admin.status.${order.status}`)}
                </span>
              </div>

              <LogisticsProgress order={order} lang={lang} />

              <div className="mb-3 rounded-xl border border-gray-100 bg-gray-50 p-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase text-gray-400">
                      {lang === "th" ? "สถานะคำสั่งซื้อ" : "Order status"}
                    </p>
                    <p className="mt-1 text-sm font-black text-gray-900">
                      {t(`admin.status.${order.status}`)}
                    </p>
                  </div>
                  <span className={`w-fit rounded-full border px-3 py-1 text-xs font-black ${statusClass(order.status)}`}>
                    {t(`admin.status.${order.status}`)}
                  </span>
                </div>
                {canShowTrackingNumber(order) ? (
                  <div className="mt-3 flex flex-col gap-2 rounded-xl border border-emerald-100 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
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
                ) : null}
              </div>

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

              <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-gray-500">
                <ClipboardList className="h-4 w-4" />
                <span>
                  {lang === "th" ? "สถานะสลิป" : "Slip"}: {order.slip.status}
                </span>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
