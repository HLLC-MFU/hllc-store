"use client";

import { useState } from "react";
import { Truck } from "lucide-react";
import { Button } from "@/components/ui/button";

const fmt = new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 });
const money = (v: number) => fmt.format(v);

type Props = {
  lang: "th" | "en";
  /** Big total shown next to the button. */
  total: number;
  /** Primary action label, e.g. "ดำเนินการต่อ". */
  buttonLabel: string;
  /** Optional count appended to the label, e.g. (2). */
  count?: number;
  /** "button" fires onClick; "submit" submits the form referenced by formId. */
  buttonType?: "button" | "submit";
  onButtonClick?: () => void;
  formId?: string;
  disabled?: boolean;
  loading?: boolean;
  /** Extra content on the left, e.g. the cart's select-all checkbox. */
  leftSlot?: React.ReactNode;
};

export function CheckoutFooter({
  lang, total, buttonLabel, count,
  buttonType = "button", onButtonClick, formId,
  disabled, loading, leftSlot,
}: Props) {
  const [showRates, setShowRates] = useState(false);

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-100 bg-white">
      {/* Shipping rates popover */}
      {showRates && (
        <>
          <div className="absolute inset-0 -top-[100vh]" onClick={() => setShowRates(false)} />
          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-72 bg-white rounded-2xl border border-gray-100 shadow-xl p-4 animate-in slide-in-from-bottom-2 duration-150 z-10">
            <p className="text-xs font-black text-gray-900 mb-3">
              {lang === "th" ? "อัตราค่าจัดส่ง" : "Shipping rates"}
            </p>
            <div className="grid grid-cols-4 gap-x-2 gap-y-1.5 items-center">
              {/* Header row */}
              <div />
              <p className="text-center text-[10px] font-black text-gray-500">{lang === "th" ? "ทั่วไป" : "Standard"}</p>
              <p className="text-center text-[10px] font-black text-gray-500">{lang === "th" ? "ห่างไกล" : "Remote"}</p>
              <p className="text-center text-[10px] font-black text-gray-500">{lang === "th" ? "พิเศษ" : "Island"}</p>
              {/* Divider */}
              <div className="col-span-4 border-t border-gray-100" />
              {/* Row 1 */}
              <p className="text-[10px] font-semibold text-gray-400">{lang === "th" ? "ชิ้นแรก" : "1st item"}</p>
              <p className="text-center text-sm font-black text-gray-900">฿50</p>
              <p className="text-center text-sm font-black text-gray-900">฿80</p>
              <p className="text-center text-sm font-black text-gray-900">฿100</p>
              {/* Row 2 */}
              <p className="text-[10px] font-semibold text-gray-400">{lang === "th" ? "ชิ้นต่อไป" : "each after"}</p>
              <p className="text-center text-sm font-black text-gray-900">+฿10</p>
              <p className="text-center text-sm font-black text-gray-900">+฿15</p>
              <p className="text-center text-sm font-black text-gray-900">+฿15</p>
            </div>
          </div>
        </>
      )}

      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
        {leftSlot}

        <div className="ml-auto flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowRates((v) => !v)}
            className={`flex items-center justify-center h-9 w-9 rounded-xl transition-colors shrink-0 ${showRates ? "bg-[#85241F] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
          >
            <Truck className="h-4 w-4" />
          </button>
          <span className="text-gray-300">|</span>
          <span className="text-base font-black text-[#85241F]">{money(total)}</span>
        </div>

        <Button
          type={buttonType}
          form={buttonType === "submit" ? formId : undefined}
          onClick={onButtonClick}
          disabled={disabled || loading}
          className="h-13 w-[35%] shrink-0 rounded-2xl bg-[#85241F] px-5 text-base font-black hover:bg-[#B72D2A] shadow-lg shadow-[#85241F]/20"
        >
          {loading ? "..." : buttonLabel}{count != null ? ` (${count})` : ""}
        </Button>
      </div>
    </div>
  );
}
