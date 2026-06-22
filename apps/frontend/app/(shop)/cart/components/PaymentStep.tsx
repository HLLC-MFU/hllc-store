"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, ArrowLeft, Check, Copy, Landmark, Upload, X } from "lucide-react";
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
  orderError?: string;
  onSlipFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearSlip: () => void;
  onBack: () => void;
  onContinue: () => void;
};

export function PaymentStep({
  lang, t, selectedPayableTotal, selectedShippingFee,
  slipPreview, slipError, orderError, onSlipFile, onClearSlip, onBack, onContinue,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [settings, setSettings] = useState<PaymentSettings | null>(null);
  const [copied, setCopied] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    if (!slipError) return;
    setToastMsg(slipError);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(""), 3000);
  }, [slipError]);

  useEffect(() => {
    if (!orderError) return;
    setToastMsg(orderError);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(""), 5000);
  }, [orderError]);

  useEffect(() => {
    let alive = true;
    fetchPaymentSettings().then((s) => { if (alive) setSettings(s); }).catch(() => { });
    return () => { alive = false; };
  }, []);

  async function copyAccount() {
    if (!settings) return;
    try {
      await navigator.clipboard.writeText(settings.bankAccountNumber.replace(/-/g, ""));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch { }
  }

  return (
    <section className="min-h-screen bg-gray-50 mx-auto max-w-xl pb-24 animate-in fade-in slide-in-from-bottom-2 duration-200">

      {/* Toast */}
      <div className={`fixed top-16 left-1/2 -translate-x-1/2 z-50 pointer-events-none transition-all duration-300 ${toastMsg ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"}`}>
        <div className="flex items-center gap-2.5 bg-red-600 text-white px-4 py-3 rounded-2xl shadow-xl shadow-red-900/20 max-w-xs">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="text-sm font-bold leading-snug">{toastMsg}</span>
        </div>
      </div>
      <div className="px-4 pt-4 flex flex-col gap-4">
      <button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-gray-700 transition-colors">
        <ArrowLeft className="h-4 w-4" />
        {lang === "th" ? "กลับ" : "Back"}
      </button>

      <div className="rounded-2xl bg-brand/5 p-4 text-center">
        <p className="text-xs font-bold text-gray-500">{t("checkout.payment_amount")}</p>
        <p className="mt-1 text-2xl font-black text-brand">{money(selectedPayableTotal)}</p>
      </div>

      {!settings ? (
        <div className="h-28 animate-pulse rounded-2xl bg-gray-100" />
      ) : (
        <div className={`rounded-2xl border p-3 transition-all duration-300 ${copied ? "border-emerald-500 bg-emerald-50/70 ring-1 ring-emerald-500/10" : "border-gray-200 bg-white"}`}>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <Landmark className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase text-gray-400">
                {lang === "th" ? "บัญชีรับชำระ" : "Payment account"}
              </p>
              <p className="mt-0.5 text-sm font-black text-gray-950">{settings.bankName}</p>
              <p className="mt-1 truncate text-xs font-bold text-gray-500">{settings.bankAccountName}</p>
              <p className="mt-1 font-mono text-lg font-black tracking-wide text-brand">{settings.bankAccountNumber}</p>
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
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col gap-3">
        <p className="text-xs font-black text-gray-400 uppercase tracking-wider">
          {lang === "th" ? "แนบสลิปการโอน" : "Attach payment slip"}
        </p>
        <div className={`rounded-xl border border-dashed p-3 transition-colors ${slipError ? "border-red-400 bg-red-50 ring-1 ring-red-200" : "border-gray-200"}`}>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onSlipFile} />
          {slipPreview ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={slipPreview} alt="payment slip" loading="lazy" className="max-h-56 w-full rounded-lg object-contain" />
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
              className={`flex w-full flex-col items-center gap-2 py-10 ${slipError ? "text-red-500" : "text-gray-400"}`}
            >
              <Upload className="h-7 w-7" />
              <span className="text-xs font-bold">{t("checkout.upload_tap")}</span>
            </button>
          )}
        </div>
      </div>

      </div>

      <CheckoutFooter
        lang={lang}
        total={selectedPayableTotal}
        buttonLabel={t("checkout.confirm_button")}
        onButtonClick={onContinue}
        disabled={!slipPreview}
      />
    </section>
  );
}
