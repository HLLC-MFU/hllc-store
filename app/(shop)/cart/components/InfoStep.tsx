"use client";

import { ArrowLeft, Mail, MapPin, Phone, Store, Truck, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { AddressSelect } from "@/components/shared/address-select";
import { TimeSelect } from "./TimeSelect";
import { CheckoutFooter } from "./CheckoutFooter";

const fmt = new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 });
const money = (v: number) => fmt.format(v);

const inputCls = "h-14 rounded-none border-0 bg-transparent text-sm font-semibold shadow-none placeholder:text-gray-400 focus-visible:ring-0";

function formatPhoneDisplay(raw: string) {
  const digits = raw.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function FieldRow({ icon, children, error }: { icon: React.ReactNode; children: React.ReactNode; error?: string }) {
  return (
    <div className={`relative ${error ? "rounded-xl ring-1 ring-red-300" : ""}`}>
      <div className="relative flex items-center">
        <span className={`absolute left-3.5 z-10 pointer-events-none ${error ? "text-red-400" : "text-gray-400"}`}>{icon}</span>
        <div className="w-full [&>input]:pl-10 [&>textarea]:pl-10 [&>div>input]:pl-10">{children}</div>
      </div>
      {error ? <p className="px-4 pt-0.5 pb-3 text-xs font-bold text-red-500">{error}</p> : null}
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
  pickupLocation?: string;
  pickupHours?: string;
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
  itemsLength, onBack, onSubmit, pickupLocation, pickupHours,
}: Props) {
  return (
    <section className="bg-gray-50 mx-auto max-w-xl pb-24 animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="px-4 pt-4 flex flex-col gap-4">

      <button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-gray-700 transition-colors">
        <ArrowLeft className="h-4 w-4" />
        {t("checkout.back")}
      </button>

      <form id="checkout-info-form" onSubmit={onSubmit} className="flex flex-col gap-4">

        {/* Delivery mode */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col gap-3">
          <p className="text-xs font-black uppercase tracking-wider text-gray-400">
            {t("checkout.fulfillment")}
          </p>
          <div className="grid grid-cols-2 rounded-xl bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => setDeliveryMode("delivery")}
              className={`flex h-11 items-center justify-center gap-2 rounded-lg text-sm font-black transition-all ${deliveryMode === "delivery" ? "bg-white text-[#85241F] shadow-sm" : "text-gray-500"}`}
            >
              <Truck className="h-4 w-4" />
              {t("checkout.delivery")}
            </button>
            <button
              type="button"
              onClick={() => setDeliveryMode("pickup")}
              className={`flex h-11 items-center justify-center gap-2 rounded-lg text-sm font-black transition-all ${deliveryMode === "pickup" ? "bg-white text-[#85241F] shadow-sm" : "text-gray-500"}`}
            >
              <Store className="h-4 w-4" />
              {t("checkout.pickup")}
            </button>
          </div>
        </div>

        {/* Recipient */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col gap-3">
          <p className="text-xs font-black text-gray-400 uppercase tracking-wider">
            {t("checkout.recipient")}
          </p>
          <div className="divide-y divide-gray-100 rounded-xl border border-gray-100 ">
            <FieldRow icon={<User className="h-4 w-4" />} error={fieldErrors.name}>
              <Input
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("checkout.placeholder.fullname")}
                aria-invalid={Boolean(fieldErrors.name)}
                className={`${inputCls} ${fieldErrors.name ? "text-red-700 placeholder:text-red-300" : ""}`}
              />
            </FieldRow>
            <FieldRow icon={<Phone className="h-4 w-4" />} error={fieldErrors.phone}>
              <Input
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={formatPhoneDisplay(phone)}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder={t("checkout.placeholder.phone")}
                aria-invalid={Boolean(fieldErrors.phone)}
                className={`${inputCls} ${fieldErrors.phone ? "!text-red-700 placeholder:!text-red-300" : ""}`}
              />
            </FieldRow>
            <FieldRow icon={<Mail className="h-4 w-4" />} error={fieldErrors.email}>
              <Input
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("checkout.placeholder.email")}
                aria-invalid={Boolean(fieldErrors.email)}
                className={`${inputCls} ${fieldErrors.email ? "!text-red-700 placeholder:!text-red-300" : ""}`}
              />
            </FieldRow>
          </div>
          <p className="text-[11px] font-semibold text-gray-400">
            {t("checkout.email_note")}
          </p>
        </div>

        {/* Address / Pickup */}
        {deliveryMode === "delivery" ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col gap-3">
            <p className="text-xs font-black text-gray-400 uppercase tracking-wider">
              {t("checkout.shipping_address")}
            </p>
            <div className="divide-y divide-gray-100 rounded-xl border border-gray-100 mb-0.5">
              <FieldRow icon={<MapPin className="h-4 w-4" />} error={fieldErrors.address}>
                <Input
                  name="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={t("checkout.placeholder.address")}
                  aria-invalid={Boolean(fieldErrors.address)}
                  className={`${inputCls} ${fieldErrors.address ? "text-red-700 placeholder:text-red-300" : ""}`}
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
                error={fieldErrors.province || fieldErrors.district || fieldErrors.subDistrict || fieldErrors.postalCode}
              />
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Store className="h-4 w-4 text-[#85241F]" />
              <p className="text-sm font-black text-[#85241F]">
                {pickupLocation ? `รับสินค้าเองที่ ${pickupLocation}` : t("checkout.pickup_at_d1")}
              </p>
            </div>
            <p className="text-xs font-semibold text-gray-400">
              {t("checkout.pickup_time_note")}
            </p>
            <TimeSelect name="pickupTime" error={fieldErrors.pickupTime} pickupHours={pickupHours} />
            {fieldErrors.pickupTime && <p className="mt-1.5 text-xs font-bold text-red-500">{fieldErrors.pickupTime}</p>}
          </div>
        )}

        {/* Summary */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-4 py-3 space-y-2 text-sm font-bold">
          <div className="flex items-center justify-between text-gray-500">
            <span>{selectedCount} {t("shop.items_count")}</span>
            <span className="text-[#85241F]">{money(selectedTotal)}</span>
          </div>
          <div className="flex items-center justify-between text-gray-500">
            <span>{t("checkout.shipping")}</span>
            <span>{selectedShippingFee > 0 ? money(selectedShippingFee) : t("checkout.shipping.free")}</span>
          </div>
          <div className="flex items-center justify-between border-t border-gray-100 pt-2 text-gray-900">
            <span>{t("checkout.total")}</span>
            <span className="text-[#85241F]">{money(selectedPayableTotal)}</span>
          </div>
        </div>

      </form>

      </div>

      <CheckoutFooter
        lang={lang}
        total={selectedPayableTotal}
        buttonLabel={t("checkout.proceed_to_pay")}
        buttonType="submit"
        formId="checkout-info-form"
        disabled={!itemsLength}
        loading={loading}
        deliveryMode={deliveryMode}
      />
    </section>
  );
}
