"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ClipboardList, RefreshCw, Search } from "lucide-react";
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
  createdAt: string;
  updatedAt: string;
};

const STATUS_STEPS: OrderStatus[] = [
  "pending_payment",
  "payment_review",
  "paid",
  "packing",
  "shipped",
  "completed",
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

export default function ProfilePage() {
  const { lang, t } = useLanguage();
  const [phone, setPhone] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    try {
      const storedPhone = localStorage.getItem("shop-last-phone");
      if (storedPhone) {
        setPhone(storedPhone);
        void loadOrders(storedPhone);
      }
    } catch {}
  }, []);

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

  function stepState(order: Order, step: OrderStatus) {
    if (order.status === "cancelled") return "todo";
    const currentIndex = STATUS_STEPS.indexOf(order.status);
    const stepIndex = STATUS_STEPS.indexOf(step);
    if (stepIndex < currentIndex) return "done";
    if (stepIndex === currentIndex) return "active";
    return "todo";
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
              placeholder={t("checkout.label.phone")}
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

              <div className="my-4 grid grid-cols-2 gap-2 sm:grid-cols-6">
                {STATUS_STEPS.map((step) => {
                  const state = stepState(order, step);

                  return (
                    <div key={step} className="flex flex-col gap-1">
                      <div
                        className={`h-1.5 rounded-full ${
                          state === "done"
                            ? "bg-emerald-500"
                            : state === "active"
                              ? "bg-[#85241F]"
                              : "bg-gray-100"
                        }`}
                      />
                      <span
                        className={`text-[10px] font-bold ${
                          state === "active" ? "text-[#85241F]" : "text-gray-400"
                        }`}
                      >
                        {t(`admin.status.${step}`)}
                      </span>
                    </div>
                  );
                })}
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
