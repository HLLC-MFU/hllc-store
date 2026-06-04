"use client";

import { Store, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CartItem } from "@/lib/client/cart";

const fmt = new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 });
const money = (v: number) => fmt.format(v);

type Props = {
  lang: "th" | "en";
  t: (key: string) => string;
  selectedCount: number;
  selectedTotal: number;
  selectedShippingFee: number;
  selectedPayableTotal: number;
  deliveryMode: "delivery" | "pickup";
  setDeliveryMode: (mode: "delivery" | "pickup") => void;
  onPay: () => void;
  items: CartItem[];
};

export function CartSummaryPanel({
  lang, t, selectedCount, selectedTotal,
  selectedShippingFee, selectedPayableTotal,
  deliveryMode, setDeliveryMode, onPay, items,
}: Props) {
  if (!items.length) return null;

  return (
    <aside className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
        <span className="text-sm font-black text-gray-900">
          {lang === "th" ? "สรุปคำสั่งซื้อ" : "Order summary"}
        </span>
        <span className="text-xs font-bold text-gray-400">
          {lang === "th" ? `เลือก ${selectedCount} ชิ้น` : `${selectedCount} selected`}
        </span>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-500">{lang === "th" ? "ค่าสินค้า" : "Subtotal"}</span>
        <span className="text-xl font-black text-[#85241F]">{money(selectedTotal)}</span>
      </div>

      <div className="mb-4 grid grid-cols-2 rounded-xl bg-gray-100 p-1">
        <button
          type="button"
          onClick={() => setDeliveryMode("delivery")}
          className={`flex h-10 items-center justify-center gap-2 rounded-lg text-sm font-black transition-colors ${deliveryMode === "delivery" ? "bg-white text-[#85241F] shadow-sm" : "text-gray-500"}`}
        >
          <Truck className="h-4 w-4" />
          {lang === "th" ? "จัดส่ง" : "Delivery"}
        </button>
        <button
          type="button"
          onClick={() => setDeliveryMode("pickup")}
          className={`flex h-10 items-center justify-center gap-2 rounded-lg text-sm font-black transition-colors ${deliveryMode === "pickup" ? "bg-white text-[#85241F] shadow-sm" : "text-gray-500"}`}
        >
          <Store className="h-4 w-4" />
          {lang === "th" ? "รับเอง" : "Pickup"}
        </button>
      </div>

      <div className="mb-4 space-y-2 rounded-xl bg-gray-50 p-3 text-sm font-bold">
        <div className="flex justify-between text-gray-500">
          <span>{t("checkout.shipping")}</span>
          <span className={selectedShippingFee > 0 ? "text-gray-800" : "text-emerald-600"}>
            {selectedShippingFee > 0 ? money(selectedShippingFee) : t("checkout.shipping.free")}
          </span>
        </div>
        <div className="flex justify-between border-t border-gray-200 pt-2 text-gray-900">
          <span>{t("checkout.total")}</span>
          <span className="text-[#85241F]">{money(selectedPayableTotal)}</span>
        </div>
      </div>

      <Button onClick={onPay} className="h-12 w-full rounded-xl bg-[#85241F] text-sm font-black hover:bg-[#B72D2A]">
        {lang === "th" ? "ชำระเงิน" : "Pay now"}
      </Button>
    </aside>
  );
}
