"use client";

import { Truck } from "lucide-react";
import { Button } from "@/components/ui/button";

const fmt = new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 });
const money = (v: number) => fmt.format(v);

type Props = {
  lang: "th" | "en";
  /** Big total shown next to the button. */
  total: number;
  /** Shipping chip (truck icon). Omit to hide; 0 renders as "ฟรี". */
  shippingFee?: number;
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
  lang, total, shippingFee, buttonLabel, count,
  buttonType = "button", onButtonClick, formId,
  disabled, loading, leftSlot,
}: Props) {
  const freeShipping = shippingFee != null && shippingFee <= 0;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-100 bg-white">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
        {leftSlot}

        <div className="ml-auto flex items-center gap-2.5">
          {shippingFee != null && (
            <>
              <span className={`flex items-center gap-1 text-xs font-bold ${freeShipping ? "text-emerald-600" : "text-gray-500"}`}>
                <Truck className="h-4 w-4" />
                {freeShipping ? (lang === "th" ? "ฟรี" : "Free") : money(shippingFee)}
              </span>
              <span className="text-gray-300">|</span>
            </>
          )}
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
