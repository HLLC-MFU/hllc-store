"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { RefreshCw, Search, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/lib/language-context";
import { LogisticsProgress } from "@/components/shop/logistics-progress";

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

const currencyFormatter = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  maximumFractionDigits: 0,
});

function money(value: number) {
  return currencyFormatter.format(value);
}

function canShowTrackingNumber(order: Order) {
  return ["shipped", "completed"].includes(order.status) && Boolean(order.trackingNumber?.trim());
}


function ProfileContent() {
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
                        {typeof item.name === "object" ? (item.name[lang] || item.name.th) : item.name} x {item.quantity}
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

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center p-5 text-sm font-semibold text-gray-400">Loading...</div>}>
      <ProfileContent />
    </Suspense>
  );
}
