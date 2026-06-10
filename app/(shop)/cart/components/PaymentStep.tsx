"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Check, Copy, Landmark, Upload, X } from "lucide-react";
import { CheckoutFooter } from "./CheckoutFooter";
import { fetchPaymentSettings, type PaymentSettings } from "@/lib/modules/settings";

const fmt = new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 });
const money = (v: number) => fmt.format(v);

type Props = {
  lang: "th" | "en";
  t: (key: string) => string;
  selectedPayableTotal: number;
  selectedShippingFee: number;
  slipPreview: string;
  slipError: string;
  onSlipFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearSlip: () => void;
  onBack: () => void;
  onContinue: () => void;
};

export function PaymentStep({
  lang, t, selectedPayableTotal, selectedShippingFee,
  slipPreview, slipError, onSlipFile, onClearSlip, onBack, onContinue,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [settings, setSettings] = useState<PaymentSettings | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchPaymentSettings().then((s) => { if (alive) setSettings(s); }).catch(() => {});
    return () => { alive = false; };
  }, []);

  async function copyAccount() {
    if (!settings) return;
    try {
      await navigator.clipboard.writeText(settings.bankAccountNumber.replace(/-/g, ""));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {}
  }

  return (
    <section className="mx-auto max-w-xl pb-24 animate-in fade-in slide-in-from-bottom-2 duration-200">
      <button onClick={onBack} className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-gray-700 transition-colors">
        <ArrowLeft className="h-4 w-4" />
        {lang === "th" ? "กลับ" : "Back"}
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

      {!settings ? (
        <div className="mb-4 h-28 animate-pulse rounded-2xl bg-gray-100" />
      ) : (
        <div className={`mb-4 rounded-2xl border p-3 transition-all duration-300 ${copied ? "border-emerald-500 bg-emerald-50/70 ring-1 ring-emerald-500/10" : "border-gray-200 bg-gray-50"}`}>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#85241F]/10 text-[#85241F]">
              <Landmark className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase text-gray-400">
                {lang === "th" ? "บัญชีรับชำระ" : "Payment account"}
              </p>
              <p className="mt-0.5 text-sm font-black text-gray-950">{settings.bankName}</p>
              <p className="mt-1 truncate text-xs font-bold text-gray-500">{settings.bankAccountName}</p>
              <p className="mt-1 font-mono text-lg font-black tracking-wide text-[#85241F]">{settings.bankAccountNumber}</p>
            </div>
            <button
              type="button"
              onClick={copyAccount}
              className="flex h-10 shrink-0 items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 text-xs font-black text-gray-700 shadow-sm hover:bg-gray-50"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? (lang === "th" ? "คัดลอกแล้ว" : "Copied") : (lang === "th" ? "คัดลอก" : "Copy")}
            </button>
          </div>
        </div>
      )}

      {/* Slip upload */}
      <p className="mb-1.5 px-1 text-xs font-black text-gray-400">
        {lang === "th" ? "แนบสลิปการโอน" : "Attach payment slip"}
      </p>
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

      <CheckoutFooter
        lang={lang}
        total={selectedPayableTotal}
        shippingFee={selectedShippingFee}
        buttonLabel={t("checkout.confirm_button")}
        onButtonClick={onContinue}
      />
    </section>
  );
}
