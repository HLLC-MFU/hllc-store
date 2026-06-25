"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, ArrowLeft, Check, Copy, ImageIcon, Landmark, X } from "lucide-react";
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

function openInChrome() {
  const { host, pathname, search, protocol } = window.location;
  window.location.href = `intent://${host}${pathname}${search}#Intent;scheme=${protocol.replace(":", "")};action=android.intent.action.VIEW;end`;
}

export function PaymentStep({
  lang, t, selectedPayableTotal, selectedShippingFee,
  slipPreview, slipError, orderError, onSlipFile, onClearSlip, onBack, onContinue,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [settings, setSettings] = useState<PaymentSettings | null>(null);
  const [copied, setCopied] = useState(false);
  const isLineApp = typeof navigator !== "undefined" && /Line\//i.test(navigator.userAgent);
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
    const text = settings.bankAccountNumber.replace(/-/g, "");
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      } else {
        const el = document.createElement("textarea");
        el.value = text;
        el.style.cssText = "position:fixed;opacity:0;pointer-events:none";
        document.body.appendChild(el);
        el.focus();
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
      }
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
        <div className={`rounded-2xl border transition-all duration-300 overflow-hidden ${copied ? "border-emerald-500 bg-emerald-50/70 ring-1 ring-emerald-500/10" : "border-gray-200 bg-white"}`}>
          {/* Bank name + account name */}
          <div className="flex items-center gap-3 px-3 pt-3 pb-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <Landmark className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase text-gray-400">
                {lang === "th" ? "บัญชีรับชำระ" : "Payment account"}
              </p>
              <p className="mt-0.5 text-sm font-black text-gray-950">{(lang === "en" && settings.bankNameEn) ? settings.bankNameEn : settings.bankName}</p>
              <p className="mt-0.5 whitespace-pre-line text-xs font-semibold leading-snug text-gray-500">{settings.bankAccountName}</p>
            </div>
          </div>
          {/* Account number + copy */}
          <div className={`flex items-center justify-between gap-2 border-t px-3 py-2.5 ${copied ? "border-emerald-200 bg-emerald-50" : "border-gray-100 bg-gray-50"}`}>
            <p className="font-mono text-lg font-black tracking-wide text-brand">{settings.bankAccountNumber}</p>
            <button
              type="button"
              onClick={copyAccount}
              className="flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 text-xs font-black text-gray-700 shadow-sm hover:bg-gray-50"
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
          ) : isLineApp ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-50">
                <AlertCircle className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <p className="text-sm font-black text-gray-700">
                  {lang === "th" ? "ไม่รองรับในแอป LINE" : "Not supported in LINE app"}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  {lang === "th" ? "กรุณาเปิดลิ้งค์นี้ใน Chrome" : "Please open this link in Chrome"}
                </p>
              </div>
              <button
                type="button"
                onClick={openInChrome}
                className="rounded-xl bg-brand px-6 py-2.5 text-sm font-black text-white active:scale-95 transition-transform shadow-md shadow-brand/20"
              >
                {lang === "th" ? "เปิดใน Chrome" : "Open in Chrome"}
              </button>
            </div>
          ) : (
            <label className={`relative flex w-full cursor-pointer flex-col items-center gap-3 py-10 ${slipError ? "text-red-400" : "text-gray-400"}`}>
              <input type="file" accept="image/*" className="absolute inset-0 h-full w-full cursor-pointer opacity-0" onChange={onSlipFile} />
              <div className={`flex h-14 w-14 items-center justify-center rounded-full ${slipError ? "bg-red-50" : "bg-gray-100"}`}>
                <ImageIcon className="h-6 w-6" />
              </div>
              <span className="text-xs font-bold">{lang === "th" ? "แตะเพื่ออัปโหลดสลิป" : "Tap to upload slip"}</span>
            </label>
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
