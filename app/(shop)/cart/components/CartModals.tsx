"use client";

import { ClipboardList, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CartItem } from "@/lib/client/cart";

const fmt = new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 });
const money = (v: number) => fmt.format(v);

// ── Confirm order modal ────────────────────────────────────────────────────

type ConfirmOrderModalProps = {
  lang: "th" | "en";
  t: (key: string) => string;
  loading: boolean;
  selectedCount: number;
  selectedPayableTotal: number;
  selectedShippingFee: number;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmOrderModal({
  lang, t, loading, selectedCount, selectedPayableTotal, selectedShippingFee,
  onCancel, onConfirm,
}: ConfirmOrderModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <ClipboardList className="h-6 w-6" />
        </div>
        <h2 className="text-center text-base font-black text-gray-900">
          {lang === "th" ? "ยืนยันคำสั่งซื้อ?" : "Confirm order?"}
        </h2>
        <p className="mt-2 text-center text-sm font-semibold text-gray-500">
          {lang === "th" ? "กดยืนยันเพื่อส่งคำสั่งซื้อของคุณ" : "Press confirm to place your order"}
        </p>
        <div className="mt-3 rounded-2xl bg-gray-50 p-3 text-center">
          <p className="text-xs font-bold text-gray-500">{selectedCount} {t("shop.items_count")}</p>
          <p className="mt-0.5 text-xl font-black text-[#85241F]">{money(selectedPayableTotal)}</p>
          {selectedShippingFee > 0 && (
            <p className="mt-1 text-[11px] font-bold text-gray-500">
              {t("checkout.shipping")}: {money(selectedShippingFee)}
            </p>
          )}
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <Button type="button" variant="outline" disabled={loading} onClick={onCancel} className="h-11 rounded-xl font-black">
            {lang === "th" ? "ยกเลิก" : "Cancel"}
          </Button>
          <Button type="button" onClick={onConfirm} disabled={loading} className="h-11 rounded-xl bg-emerald-600 font-black hover:bg-emerald-700">
            {loading ? "..." : lang === "th" ? "ยืนยัน" : "Confirm"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Remove item modal ──────────────────────────────────────────────────────

type RemoveItemModalProps = {
  lang: "th" | "en";
  item: CartItem;
  confirmText: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export function RemoveItemModal({ lang, item, confirmText, onCancel, onConfirm }: RemoveItemModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
          <Trash2 className="h-6 w-6" />
        </div>
        <h2 className="text-center text-base font-black text-gray-900">
          {lang === "th" ? "ลบสินค้าออกจากตะกร้า?" : "Remove item?"}
        </h2>
        <p className="mt-2 text-center text-sm font-semibold text-gray-500">{confirmText}</p>
        <div className="mt-4 rounded-2xl bg-gray-50 p-3">
          <p className="truncate text-sm font-black text-gray-900">
            {item.name[lang] || item.name.th}
          </p>
          <p className="mt-1 text-xs font-bold text-[#85241F]">
            {money(item.price)} x {item.quantity}
          </p>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <Button type="button" variant="outline" onClick={onCancel} className="h-11 rounded-xl font-black">
            {lang === "th" ? "ยกเลิก" : "Cancel"}
          </Button>
          <Button type="button" onClick={onConfirm} className="h-11 rounded-xl bg-red-600 font-black hover:bg-red-700">
            {lang === "th" ? "ลบสินค้า" : "Remove"}
          </Button>
        </div>
      </div>
    </div>
  );
}
