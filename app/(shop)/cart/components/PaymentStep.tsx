"use client";

import { useRef } from "react";
import { ArrowLeft, Check, Copy, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const fmt = new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 });
const money = (v: number) => fmt.format(v);

const BANK_ACCOUNT_NAME = "นันทเดช วงศ์ไชยา";
const BANK_ACCOUNT_NUMBER = "6621540027";

type Props = {
  lang: "th" | "en";
  t: (key: string) => string;
  selectedPayableTotal: number;
  selectedShippingFee: number;
  copiedAccount: boolean;
  slipPreview: string;
  slipError: string;
  onCopyAccount: () => void;
  onSlipFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearSlip: () => void;
  onBack: () => void;
  onContinue: () => void;
};

export function PaymentStep({
  lang, t, selectedPayableTotal, selectedShippingFee,
  copiedAccount, slipPreview, slipError, onCopyAccount, onSlipFile,
  onClearSlip, onBack, onContinue,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <section className="mx-auto max-w-xl rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <button onClick={onBack} className="mb-4 inline-flex items-center gap-2 text-xs font-bold text-gray-500">
        <ArrowLeft className="h-4 w-4" />
        {lang === "th" ? "กลับตะกร้า" : "Back to cart"}
      </button>

      <div className="mb-4 rounded-2xl bg-[#85241F]/5 p-4 text-center">
        <p className="text-xs font-bold text-gray-500">{t("checkout.payment_amount")}</p>
        <p className="mt-1 text-2xl font-black text-[#85241F]">{money(selectedPayableTotal)}</p>
        {selectedShippingFee > 0 && (
          <p className="mt-1 text-xs font-bold text-gray-500">
            {lang === "th" ? "รวมค่าส่ง " : "Includes shipping "}
            {money(selectedShippingFee)}
          </p>
        )}
      </div>

      <div className={`mb-4 rounded-2xl border p-3 transition-all duration-300 ${copiedAccount ? "border-emerald-500 bg-emerald-50/70 ring-1 ring-emerald-500/10" : "border-[#1E63B6]/10 bg-[#1E63B6]/5"}`}>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-[#1E63B6]/10 relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/bangkokBank.jpg" alt="Bangkok Bank" className="h-full w-full object-cover scale-110" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase text-[#1E63B6]">
              {lang === "th" ? "บัญชีรับชำระ" : "Payment account"}
            </p>
            <p className="mt-0.5 text-sm font-black text-gray-950">
              {lang === "th" ? "ธนาคารกรุงเทพ" : "Bangkok Bank"}
            </p>
            <p className="mt-1 truncate text-xs font-bold text-gray-500">{BANK_ACCOUNT_NAME}</p>
            <p className="mt-1 font-mono text-lg font-black tracking-wide text-[#85241F]">{BANK_ACCOUNT_NUMBER}</p>
          </div>
          <button
            type="button"
            onClick={onCopyAccount}
            className="flex h-10 shrink-0 items-center gap-1.5 rounded-xl border border-[#1E63B6]/20 bg-white px-3 text-xs font-black text-[#1E63B6] shadow-sm hover:bg-[#1E63B6]/5"
          >
            {copiedAccount ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copiedAccount ? (lang === "th" ? "คัดลอกแล้ว" : "Copied") : (lang === "th" ? "คัดลอก" : "Copy")}
          </button>
        </div>
      </div>

      <div className={`rounded-xl border border-dashed p-3 ${slipError ? "border-red-300 bg-red-50/30" : "border-gray-200"}`}>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onSlipFile} />
        {slipPreview ? (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={slipPreview} alt="payment slip" className="max-h-56 w-full rounded-lg object-contain" />
            <button
              onClick={onClearSlip}
              className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-500 shadow"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className={`flex w-full flex-col items-center gap-2 py-10 ${slipError ? "text-red-400" : "text-gray-400"}`}
          >
            <Upload className="h-7 w-7" />
            <span className="text-xs font-bold">{t("checkout.upload_tap")}</span>
          </button>
        )}
      </div>
      {slipError && (
        <p className="text-xs font-semibold text-red-500 flex items-center gap-1.5">
          <span>⚠</span> {slipError}
        </p>
      )}

      <Button onClick={onContinue} className="mt-4 h-12 w-full rounded-xl bg-[#85241F] text-sm font-black hover:bg-[#B72D2A]">
        {t("checkout.continue")}
      </Button>
    </section>
  );
}
