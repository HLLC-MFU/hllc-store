"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CartItem } from "@/lib/cart";
import { money } from "./swipeable-cart-item";

type OrderCustomer = {
  name: string;
  phone: string;
  email: string;
  address: string;
};

type Order = {
  id: string;
  total: number;
  status: string;
  customer?: OrderCustomer;
};

interface ReceiptViewProps {
  lang: "th" | "en";
  createdOrder: Order;
  receiptItems: CartItem[];
}

export function ReceiptView({ lang, createdOrder, receiptItems }: ReceiptViewProps) {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center py-10 text-center">
      <div className="w-full max-w-sm">
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 success-pop">
          <CheckCircle2 className="h-14 w-14 text-emerald-600" />
        </div>
        <h1 className="text-2xl font-black text-gray-900">
          {lang === "th" ? "คำสั่งซื้อสำเร็จ!" : "Order placed!"}
        </h1>
        <p className="mt-2 text-sm font-semibold text-gray-500">
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
              {receiptItems.map((item, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="flex justify-between items-start gap-4">
                    <span className="break-words line-clamp-2">
                      {item.name[lang] || item.name.th}
                    </span>
                    <span className="shrink-0 font-bold">
                      {money(item.price * item.quantity)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px] text-neutral-500 pl-2">
                    <span>
                      {item.quantity} x {money(item.price)}
                      {item.selectedOption ? ` (${item.selectedOption})` : ""}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="my-4 text-center text-neutral-400">
            *-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*
          </div>

          {/* Subtotals & Total */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-neutral-600">
              <span>{lang === "th" ? "ยอดรวม" : "Subtotal"}</span>
              <span>{money(createdOrder.total)}</span>
            </div>
            <div className="flex justify-between text-neutral-600">
              <span>{lang === "th" ? "วิธีชำระเงิน" : "Payment"}</span>
              <span className="font-bold">{lang === "th" ? "โอนเงิน (สลิป)" : "Bank Transfer"}</span>
            </div>
            <div className="flex justify-between font-bold text-sm text-neutral-900 pt-1.5 border-t border-dashed border-neutral-300">
              <span>{lang === "th" ? "ยอดชำระสุทธิ" : "Total"}</span>
              <span>{money(createdOrder.total)}</span>
            </div>
          </div>

          <div className="my-4 text-center text-neutral-400">
            *-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*
          </div>

          {/* Footer Info */}
          <div className="space-y-1 text-[10px] text-neutral-500">
            <div className="flex justify-between">
              <span>{lang === "th" ? "เลขพัสดุ:" : "Tracking No.:"}</span>
              <span className="font-bold text-neutral-700">{createdOrder.customer?.phone || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span>{lang === "th" ? "วันที่:" : "Date:"}</span>
              <span>{new Date().toLocaleString(lang === "th" ? "th-TH" : "en-US", { dateStyle: "short", timeStyle: "short" })}</span>
            </div>
          </div>

          <div className="my-4 text-center text-neutral-400">
            *-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*
          </div>

          {/* Barcode */}
          <div className="text-center space-y-3">
            <div className="flex justify-center items-center h-8 w-full gap-[1px] opacity-75 mix-blend-multiply my-1 select-none">
              {[2, 1, 3, 1, 2, 4, 1, 2, 1, 3, 2, 1, 4, 1, 2, 1, 3, 1, 2, 4, 1, 2, 1, 3, 2].map((w, i) => (
                <div key={i} className="bg-neutral-800 h-full" style={{ width: `${w}px` }} />
              ))}
            </div>

            <p className="text-[9px] text-neutral-400 tracking-widest font-mono">
              *{createdOrder.customer?.phone}*
            </p>
          </div>

          <div className="receipt-edge-bottom" />
        </div>
        <Button
          asChild
          className="mt-6 h-13 w-full rounded-2xl bg-emerald-600 text-sm font-black hover:bg-emerald-700"
        >
          <Link href="/profile">
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
