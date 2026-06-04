"use client";

import { ArrowLeft, ClipboardList, Store, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EmailInput } from "@/components/shared/email-input";
import { PhoneInput } from "@/components/shared/phone-input";
import { ProvinceSelect } from "@/components/shared/province-select";
import { TimeSelect } from "./TimeSelect";

const fmt = new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 });
const money = (v: number) => fmt.format(v);

type Props = {
  lang: "th" | "en";
  t: (key: string) => string;
  deliveryMode: "delivery" | "pickup";
  phone: string; setPhone: (v: string) => void;
  email: string; setEmail: (v: string) => void;
  province: string; setProvince: (v: string) => void;
  postalCode: string; setPostalCode: (v: string) => void;
  fieldErrors: Record<string, string>;
  loading: boolean;
  selectedCount: number;
  selectedTotal: number;
  selectedShippingFee: number;
  selectedPayableTotal: number;
  itemsLength: number;
  onBack: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
};

export function InfoStep({
  lang, t, deliveryMode,
  phone, setPhone, email, setEmail,
  province, setProvince, postalCode, setPostalCode,
  fieldErrors, loading,
  selectedCount, selectedTotal, selectedShippingFee, selectedPayableTotal,
  itemsLength, onBack, onSubmit,
}: Props) {
  return (
    <section className="mx-auto max-w-xl animate-in fade-in slide-in-from-bottom-2 duration-200">
      <button
        onClick={onBack}
        className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        {lang === "th" ? "กลับ" : "Back"}
      </button>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-3 text-sm font-bold">
          <span className="flex items-center gap-2 text-gray-500">
            {deliveryMode === "delivery" ? <Truck className="h-4 w-4" /> : <Store className="h-4 w-4" />}
            {lang === "th" ? "วิธีรับสินค้า" : "Fulfillment"}
          </span>
          <span className="text-[#85241F]">
            {deliveryMode === "delivery"
              ? lang === "th" ? "จัดส่ง" : "Delivery"
              : lang === "th" ? "รับเอง" : "Pickup"}
          </span>
        </div>

        {/* Recipient */}
        <div className="flex flex-col gap-2">
          <p className="text-xs font-black text-gray-400 uppercase tracking-wider px-1">
            {lang === "th" ? "ข้อมูลผู้รับ" : "Recipient"}
          </p>
          <Input
            name="name"
            placeholder={lang === "th" ? "ชื่อ-นามสกุล *" : "Full name *"}
            className="h-12 rounded-2xl border-gray-300 text-sm font-semibold placeholder:text-gray-400 focus-visible:border-[#85241F] focus-visible:ring-1 focus-visible:ring-[#85241F]/20"
          />
          <PhoneInput
            name="phone" value={phone} onChange={setPhone} lang={lang}
            placeholder={t("checkout.label.phone")}
            className="h-12 rounded-2xl border-gray-300 text-sm font-semibold placeholder:text-gray-400 focus:border-[#85241F]"
          />
          <EmailInput
            name="email" value={email} onChange={setEmail} lang={lang}
            placeholder={t("checkout.label.email")}
            className="h-12 rounded-2xl border-gray-300 text-sm font-semibold placeholder:text-gray-400 focus:border-[#85241F]"
          />
          <p className="-mt-1 px-1 text-[11px] font-semibold text-gray-400">
            {lang === "th"
              ? "ใช้อีเมลนี้เพื่อรับการแจ้งเตือนสถานะคำสั่งซื้อและการจัดส่ง"
              : "We use this email for order status and delivery notifications."}
          </p>
        </div>

        {/* Address / Pickup */}
        {deliveryMode === "delivery" ? (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-black text-gray-400 uppercase tracking-wider px-1">
              {lang === "th" ? "ที่อยู่จัดส่ง" : "Shipping address"}
            </p>
            <Textarea
              name="address"
              placeholder={lang === "th" ? "บ้านเลขที่, อาคาร, หมู่, ถนน, แขวง/ตำบล *" : "House no., building, street, subdistrict *"}
              className="min-h-24 rounded-2xl border-gray-300 text-sm font-semibold placeholder:text-gray-400 focus-visible:border-[#85241F] focus-visible:ring-1 focus-visible:ring-[#85241F]/20 resize-none"
            />
            <Input
              name="district"
              placeholder={lang === "th" ? "เขต/อำเภอ" : "District"}
              className="h-12 rounded-2xl border-gray-300 text-sm font-semibold placeholder:text-gray-400 focus-visible:border-[#85241F] focus-visible:ring-1 focus-visible:ring-[#85241F]/20"
            />
            <input type="hidden" name="province" value={province} />
            <ProvinceSelect value={province} onChange={setProvince} lang={lang as "th" | "en"} />
            <Input
              name="postalCode"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, "").slice(0, 5))}
              placeholder={lang === "th" ? "รหัสไปรษณีย์" : "Postal code"}
              className="h-12 rounded-2xl border-gray-300 text-sm font-semibold placeholder:text-gray-400 focus-visible:border-[#85241F] focus-visible:ring-1 focus-visible:ring-[#85241F]/20"
              inputMode="numeric" maxLength={5}
            />
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-[#85241F]/15 bg-[#85241F]/5 p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Store className="h-4 w-4 text-[#85241F]" />
              <p className="text-sm font-black text-[#85241F]">
                {lang === "th" ? "รับสินค้าเองที่ D1" : "Pickup at D1"}
              </p>
            </div>
            <p className="text-xs font-semibold text-gray-400">
              {lang === "th" ? "กรุณาระบุเวลาที่สะดวกมารับสินค้า" : "Please select your preferred pickup time."}
            </p>
            <TimeSelect name="pickupTime" />
            {fieldErrors.pickupTime && (
              <p className="mt-1.5 text-xs font-semibold text-red-500">{fieldErrors.pickupTime}</p>
            )}
          </div>
        )}

        {/* Summary */}
        <div className="mt-2 space-y-2 rounded-2xl bg-gray-50 px-4 py-3 text-sm font-bold">
          <div className="flex items-center justify-between text-gray-500">
            <span>{selectedCount} {t("shop.items_count")}</span>
            <span className="text-[#85241F]">{money(selectedTotal)}</span>
          </div>
          <div className="flex items-center justify-between text-gray-500">
            <span>{t("checkout.shipping")}</span>
            <span>{selectedShippingFee > 0 ? money(selectedShippingFee) : t("checkout.shipping.free")}</span>
          </div>
          <div className="flex items-center justify-between border-t border-gray-200 pt-2 text-gray-900">
            <span>{t("checkout.total")}</span>
            <span className="text-[#85241F]">{money(selectedPayableTotal)}</span>
          </div>
        </div>

        <Button
          disabled={loading || !itemsLength}
          className="h-13 w-full rounded-2xl bg-[#85241F] text-sm font-black hover:bg-[#B72D2A] shadow-lg shadow-[#85241F]/20"
          type="submit"
        >
          <ClipboardList className="h-4 w-4" />
          {loading ? t("checkout.creating_order") : t("checkout.confirm_button")}
        </Button>
      </form>
    </section>
  );
}
