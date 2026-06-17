"use client";

import { Check } from "lucide-react";
import type { CartItem } from "@/lib/client/cart";
import { CheckoutFooter } from "./CheckoutFooter";

type Props = {
  lang: "th" | "en";
  allSelected: boolean;
  onToggleSelectAll: () => void;
  selectedCount: number;
  selectedTotal: number;
  baseShipping: number;
  onPay: () => void;
  items: CartItem[];
};

export function CartSummaryPanel({
  lang, allSelected, onToggleSelectAll,
  selectedCount, selectedTotal, baseShipping, onPay, items,
}: Props) {
  if (!items.length) return null;

  return (
    <CheckoutFooter
      lang={lang}
      total={selectedTotal}
      buttonLabel={lang === "th" ? "ดำเนินการต่อ" : "Continue"}
      count={selectedCount}
      onButtonClick={onPay}
      leftSlot={
        <button
          type="button"
          onClick={onToggleSelectAll}
          className="flex shrink-0 items-center gap-2 active:scale-95 transition-transform cursor-pointer select-none"
          aria-checked={allSelected}
          role="checkbox"
          aria-label={lang === "th" ? "เลือกทั้งหมด" : "Select all"}
        >
          <div className={`flex h-6 w-6 items-center justify-center rounded-lg border-2 transition-colors ${allSelected ? "border-brand bg-brand" : "border-gray-300 bg-white"}`}>
            {allSelected && <Check className="h-3.5 w-3.5 text-white" />}
          </div>
          <span className="text-sm font-bold text-gray-700">{lang === "th" ? "ทั้งหมด" : "All"}</span>
        </button>
      }
    />
  );
}
