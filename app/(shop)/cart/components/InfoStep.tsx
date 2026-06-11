"use client";

import { ArrowLeft, Mail, MapPin, Store, Truck, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { EmailInput } from "@/components/shared/email-input";
import { PhoneInput } from "@/components/shared/phone-input";
import { AddressSelect } from "@/components/shared/address-select";
import { TimeSelect } from "./TimeSelect";
import { CheckoutFooter } from "./CheckoutFooter";

const fmt = new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 });
const money = (v: number) => fmt.format(v);

const inputCls = "h-12 rounded-none border-0 bg-transparent text-sm font-semibold shadow-none placeholder:text-gray-400 focus-visible:ring-0";

function FieldRow({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="relative flex items-center">
      <span className="absolute left-3.5 z-10 text-gray-400 pointer-events-none">{icon}</span>
      <div className="w-full [&>input]:pl-10 [&>textarea]:pl-10 [&>div>input]:pl-10">{children}</div>
    </div>
  );
}

type Props = {
  lang: "th" | "en";
  t: (key: string) => string;
  deliveryMode: "delivery" | "pickup";
  setDeliveryMode: (mode: "delivery" | "pickup") => void;
  name: string; setName: (v: string) => void;
  phone: string; setPhone: (v: string) => void;
  email: string; setEmail: (v: string) => void;
  address: string; setAddress: (v: string) => void;
  district: string; setDistrict: (v: string) => void;
  province: string; setProvince: (v: string) => void;
  subDistrict: string; setSubDistrict: (v: string) => void;
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
  lang, t, deliveryMode, setDeliveryMode,
  name, setName, phone, setPhone, email, setEmail,
  address, setAddress, district, setDistrict,
  province, setProvince, subDistrict, setSubDistrict, postalCode, setPostalCode,
  fieldErrors, loading,
  selectedCount, selectedTotal, selectedShippingFee, selectedPayableTotal,
  itemsLength, onBack, onSubmit,
}: Props) {
  return (
    <section className="mx-auto max-w-xl pb-24 animate-in fade-in slide-in-from-bottom-2 duration-200">
      <button onClick={onBack} className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-gray-700 transition-colors">
        <ArrowLeft className="h-4 w-4" />
        {lang === "th" ? "กลับ" : "Back"}
      </button>

      <form id="checkout-info-form" onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <p className="px-1 text-xs font-black uppercase tracking-wider text-gray-400">
            {lang === "th" ? "วิธีรับสินค้า" : "Fulfillment"}
          </p>
          <div className="grid grid-cols-2 rounded-2xl bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => setDeliveryMode("delivery")}
              className={`flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-black transition-colors ${deliveryMode === "delivery" ? "bg-white text-[#85241F] shadow-sm" : "text-gray-500"}`}
            >
              <Truck className="h-4 w-4" />
              {lang === "th" ? "จัดส่ง" : "Delivery"}
            </button>
            <button
              type="button"
              onClick={() => setDeliveryMode("pickup")}
              className={`flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-black transition-colors ${deliveryMode === "pickup" ? "bg-white text-[#85241F] shadow-sm" : "text-gray-500"}`}
            >
              <Store className="h-4 w-4" />
              {lang === "th" ? "รับเอง" : "Pickup"}
            </button>
          </div>
        </div>

        {/* Recipient */}
        <div className="flex flex-col gap-2">
          <p className="text-xs font-black text-gray-400 uppercase tracking-wider px-1">
            {lang === "th" ? "ข้อมูลผู้รับ" : "Recipient"}
          </p>

          <div className="divide-y divide-gray-100">
            <FieldRow icon={<User className="h-4 w-4" />}>
              <Input
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={lang === "th" ? "ชื่อ-นามสกุล" : "Full name"}
                className={inputCls}
              />
            </FieldRow>

            <PhoneInput
              name="phone" value={phone} onChange={setPhone} lang={lang}
              placeholder={lang === "th" ? "เบอร์โทรศัพท์" : "Phone number"}
              className={inputCls}
            />

            <FieldRow icon={<Mail className="h-4 w-4" />}>
              <EmailInput
                name="email" value={email} onChange={setEmail} lang={lang}
                placeholder={lang === "th" ? "อีเมล" : "Email"}
                className={inputCls}
              />
            </FieldRow>
          </div>
          <p className="px-1 text-[11px] font-semibold text-gray-400">
            {lang === "th" ? "ใช้อีเมลนี้เพื่อรับการแจ้งเตือนสถานะคำสั่งซื้อ" : "We use this email for order status notifications."}
          </p>
        </div>

        {/* Address / Pickup */}
        {deliveryMode === "delivery" ? (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-black text-gray-400 uppercase tracking-wider px-1">
              {lang === "th" ? "ที่อยู่จัดส่ง" : "Shipping address"}
            </p>
            <div className="divide-y divide-gray-100">
              <FieldRow icon={<MapPin className="h-4 w-4" />}>
                <Input
                  name="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={lang === "th" ? "บ้านเลขที่, อาคาร, หมู่, ถนน" : "House no., building, street"}
                  className={inputCls}
                />
              </FieldRow>
              <AddressSelect
                lang={lang}
                value={{ province, district, subDistrict, postalCode }}
                onChange={(v) => {
                  if (v.province !== province) setProvince(v.province);
                  if (v.district !== district) setDistrict(v.district);
                  if (v.subDistrict !== subDistrict) setSubDistrict(v.subDistrict);
                  if (v.postalCode !== postalCode) setPostalCode(v.postalCode);
                }}
                error={fieldErrors.district || fieldErrors.postalCode}
              />
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-[#85241F]/15 bg-[#85241F]/5 p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Store className="h-4 w-4 text-[#85241F]" />
              <p className="text-sm font-black text-[#85241F]">{lang === "th" ? "รับสินค้าเองที่ D1" : "Pickup at D1"}</p>
            </div>
            <p className="text-xs font-semibold text-gray-400">
              {lang === "th" ? "กรุณาระบุเวลาที่สะดวกมารับสินค้า" : "Please select your preferred pickup time."}
            </p>
            <TimeSelect name="pickupTime" />
            {fieldErrors.pickupTime && <p className="mt-1.5 text-xs font-semibold text-red-500">{fieldErrors.pickupTime}</p>}
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

      </form>

      <CheckoutFooter
        lang={lang}
        total={selectedPayableTotal}
        shippingFee={selectedShippingFee}
        buttonLabel={lang === "th" ? "ไปหน้าชำระเงิน" : "Proceed to pay"}
        buttonType="submit"
        formId="checkout-info-form"
        disabled={!itemsLength}
        loading={loading}
      />
    </section>
  );
}
