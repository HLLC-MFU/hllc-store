"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CartItem } from "@/lib/client/cart";
import { money } from "./swipeable-cart-item";

type OrderCustomer = {
  name: string;
  phone: string;
  email: string;
  address: string;
};

type Order = {
  id: string;
  subtotal?: number;
  shippingFee?: number;
  deliveryMode?: "delivery" | "pickup";
  total: number;
  status: string;
  customer?: OrderCustomer;
};

interface ReceiptViewProps {
  lang: "th" | "en";
  createdOrder: Order;
  receiptItems: CartItem[];
}

const CHARM_PRICE = 30;
const FREE_LETTERS = 2;
const LETTER_PRICE = 10;

function parseReceiptCharm(customName: string | undefined) {
  if (!customName?.startsWith("charm:")) return null;
  const [, color = "", letters = ""] = customName.split(":");
  return { color, letters };
}

function charmAddon(letters: string) {
  return CHARM_PRICE + Math.max(0, letters.length - FREE_LETTERS) * LETTER_PRICE;
}

export function ReceiptView({ lang, createdOrder, receiptItems }: ReceiptViewProps) {
  const shippingFee = createdOrder.shippingFee ?? 0;
  // item.price = product base price only; charm addon must be added separately
  const subtotal = receiptItems.reduce((sum, item) => {
    const charm = parseReceiptCharm(item.customName);
    const addon = charm ? charmAddon(charm.letters) : 0;
    return sum + (item.price + addon) * item.quantity;
  }, 0) || (createdOrder.subtotal ?? Math.max(0, createdOrder.total - shippingFee));
  const grandTotal = subtotal + shippingFee;

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 pt-4 pb-10 text-center">
      <div className="w-full max-w-sm">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 success-pop">
          <CheckCircle2 className="h-8 w-8 text-emerald-600" />
        </div>
        <h1 className="text-base font-black text-gray-900">
          {lang === "th" ? "คำสั่งซื้อสำเร็จ!" : "Order placed!"}
        </h1>
        <p className="mt-1 text-xs font-semibold text-gray-400">
          {lang === "th" ? "เราได้รับคำสั่งซื้อของคุณแล้ว" : "We have received your order"}
        </p>

        {/* Receipt Wrapper */}
        <div className="receipt-wrapper receipt-animate relative mx-auto mt-8 mb-6 p-6 w-full max-w-[340px] text-left font-mono text-xs text-neutral-800">
          <div className="receipt-edge-top" />

          {/* Header */}
          <div className="text-center space-y-1">
            <h2 className="text-sm font-bold tracking-wider text-neutral-900 uppercase">HLLC STORE</h2>
          </div>

          <div className="my-3 text-center text-neutral-400">
            *-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*
          </div>

          <div className="text-center font-bold text-neutral-900 tracking-wide uppercase">
            {lang === "th" ? "ใบเสร็จรับเงิน / RECEIPT" : "CASH RECEIPT"}
          </div>

          <div className="my-3 text-center text-neutral-400">
            *-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*
          </div>

          {/* Items Table */}
          <div className="space-y-2">
            <div className="flex justify-between font-bold text-neutral-900">
              <span>{lang === "th" ? "รายการ" : "Description"}</span>
              <span>{lang === "th" ? "ราคา" : "Price"}</span>
            </div>
            <div className="space-y-1.5">
              {receiptItems.map((item, idx) => {
                const charm = parseReceiptCharm(item.customName);
                const extraLetters = charm ? Math.max(0, charm.letters.length - FREE_LETTERS) : 0;
                return (
                  <div key={idx} className="space-y-0.5">
                    {/* Product line */}
                    <div className="flex justify-between items-start gap-4">
                      <span className="break-words">
                        {item.name[lang] || item.name.th}
                        {item.selectedOption ? ` (${item.selectedOption})` : ""}
                        {item.quantity > 1 ? ` ×${item.quantity}` : ""}
                      </span>
                      <span className="shrink-0 font-bold">{money(item.price * item.quantity)}</span>
                    </div>
                    {/* Charm lines — each component shown separately */}
                    {charm && (
                      <>
                        <div className="flex justify-between items-start gap-4 pl-2 text-neutral-500">
                          <span>+ {lang === "th" ? "พวงกุญแจ" : "Keychain"}{charm.color ? ` สี${charm.color}` : ""}{charm.letters ? ` · ${charm.letters}` : ""}</span>
                          <span className="shrink-0">+{money(CHARM_PRICE)}</span>
                        </div>
                        {extraLetters > 0 && (
                          <div className="flex justify-between items-start gap-4 pl-2 text-neutral-500">
                            <span>+ {lang === "th" ? `ตัวอักษรเพิ่ม ×${extraLetters}` : `Extra letters ×${extraLetters}`}</span>
                            <span className="shrink-0">+{money(extraLetters * LETTER_PRICE)}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="my-4 text-center text-neutral-400">
            *-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*
          </div>

          {/* Subtotals & Total */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-neutral-600">
              <span>{lang === "th" ? "ยอดรวม" : "Subtotal"}</span>
              <span>{money(subtotal)}</span>
            </div>
            <div className="flex justify-between text-neutral-600">
              <span>{lang === "th" ? "ค่าส่ง" : "Shipping"}</span>
              <span>{shippingFee > 0 ? money(shippingFee) : lang === "th" ? "ฟรี" : "FREE"}</span>
            </div>
            <div className="flex justify-between text-neutral-600">
              <span>{lang === "th" ? "วิธีชำระเงิน" : "Payment"}</span>
              <span className="font-bold">{lang === "th" ? "โอนเงิน (สลิป)" : "Bank Transfer"}</span>
            </div>
            <div className="flex justify-between font-bold text-sm text-neutral-900 pt-1.5 border-t border-dashed border-neutral-300">
              <span>{lang === "th" ? "ยอดชำระสุทธิ" : "Total"}</span>
              <span>{money(grandTotal)}</span>
            </div>
          </div>

          <div className="my-4 text-center text-neutral-400">
            *-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*
          </div>

          {/* Footer Info */}
          <div className="space-y-1 text-[10px] text-neutral-500">
            <div className="flex justify-between">
              <span>{lang === "th" ? "วันที่:" : "Date:"}</span>
              <span>{new Date().toLocaleString(lang === "th" ? "th-TH" : "en-US", { dateStyle: "short", timeStyle: "short" })}</span>
            </div>
          </div>

          <div className="receipt-edge-bottom" />
        </div>
        <Button
          asChild
          className="mt-6 h-13 w-full rounded-2xl bg-emerald-600 text-sm font-black hover:bg-emerald-700"
        >
          <Link href="/track-order">
            {lang === "th" ? "ดูสถานะคำสั่งซื้อ" : "Track my order"}
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          className="mt-3 h-12 w-full rounded-2xl text-sm font-black"
        >
          <Link href="/home">
            {lang === "th" ? "กลับหน้าแรก" : "Back to home"}
          </Link>
        </Button>
      </div>
    </div>
  );
}
