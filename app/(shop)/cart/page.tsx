"use client";

import Link from "next/link";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  ClipboardList,
  Copy,
  ShoppingCart,
  Store,
  Trash2,
  Truck,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCart, type CartItem } from "@/lib/cart";
import { useLanguage } from "@/lib/language-context";
import { EmailInput } from "@/components/shared/email-input";
import { PhoneInput } from "@/components/shared/phone-input";
import { ProvinceSelect } from "@/components/shared/province-select";
import { safeParseWithLang, checkoutFormSchema, normalizePhone, normalizeEmail } from "@/lib/schemas-i18n";
import { isPostalValidForProvince } from "@/lib/thai-provinces";
import type { Lang } from "@/lib/schemas-i18n";
import { SwipeableCartItem, itemKey, money } from "@/components/shop/cart/swipeable-cart-item";
import { ReceiptView } from "@/components/shop/cart/receipt-view";
import { TimeSelect } from "./components/TimeSelect";
type Step = "cart" | "payment" | "info" | "success";
type DeliveryMode = "delivery" | "pickup";

type Order = {
  id: string;
  total: number;
  status: string;
  customer?: {
    name: string;
    phone: string;
    email: string;
    address: string;
  };
};

function saveOrderLookup(orderId: string, phone: string) {
  try {
    const existing = JSON.parse(localStorage.getItem("shop-order-ids") ?? "[]") as string[];
    localStorage.setItem(
      "shop-order-ids",
      JSON.stringify(Array.from(new Set([orderId, ...existing])).slice(0, 20)),
    );
    localStorage.setItem("shop-last-phone", phone);
  } catch { }
}

const bankAccountName = "นันทเดช วงศ์ไชยา";
const bankAccountNumber = "6621540027";

export default function CartPage() {
  const { items, updateQty, removeItem, clearCart } = useCart();
  const { lang, t } = useLanguage();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  const allSelected = useMemo(() => {
    return items.length > 0 && items.every(i => selectedIds.has(itemKey(i)));
  }, [items, selectedIds]);

  const { selectedItems, selectedTotal, selectedCount } = useMemo(() => {
    const selected = items.filter(i => selectedIds.has(itemKey(i)));
    const total = selected.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const count = selected.reduce((sum, i) => sum + i.quantity, 0);
    return { selectedItems: selected, selectedTotal: total, selectedCount: count };
  }, [items, selectedIds]);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds(allSelected ? new Set() : new Set(items.map(itemKey)));
  }, [allSelected, items]);

  const toggleSelect = useCallback((item: CartItem) => {
    const key = itemKey(item);
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const [step, setStep] = useState<Step>("cart");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [receiptItems, setReceiptItems] = useState<CartItem[]>([]);
  const [slipPreview, setSlipPreview] = useState("");
  const [slipImage, setSlipImage] = useState("");
  const [removeTarget, setRemoveTarget] = useState<CartItem | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const pendingFormRef = useRef<FormData | null>(null);
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>("delivery");
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [province, setProvince] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [postalError, setPostalError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  const confirmRemoveText = useMemo(() => {
    return lang === "th" ? "ต้องการลบสินค้านี้ออกจากตะกร้าใช่ไหม?" : "Remove this item from cart?";
  }, [lang]);

  const confirmRemove = useCallback(() => {
    if (!removeTarget) return;
    removeItem(removeTarget.productId, removeTarget.selectedOption);
    setRemoveTarget(null);
  }, [removeTarget, removeItem]);

  const decreaseQty = useCallback((item: CartItem) => {
    if (item.quantity <= 1) {
      setRemoveTarget(item);
      return;
    }

    updateQty(item.productId, item.quantity - 1, item.selectedOption);
  }, [updateQty]);

  const handleIncrease = useCallback((item: CartItem) => {
    updateQty(item.productId, item.quantity + 1, item.selectedOption);
  }, [updateQty]);

  const handleRemove = useCallback((item: CartItem) => {
    removeItem(item.productId, item.selectedOption);
  }, [removeItem]);

  const handleSlipFile = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const result = String(loadEvent.target?.result ?? "");
      setSlipPreview(result);
      setSlipImage(result);
    };
    reader.readAsDataURL(file);
  }, []);

  const goPayment = useCallback(() => {
    if (!selectedItems.length) {
      setMessage(lang === "th" ? "กรุณาเลือกสินค้าก่อน" : "Please select items first.");
      return;
    }
    setMessage("");
    setStep("payment");
  }, [selectedItems.length, lang]);

  const copyBankAccount = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(bankAccountNumber);
      setCopiedAccount(true);
      window.setTimeout(() => setCopiedAccount(false), 1800);
    } catch {
      setMessage(lang === "th" ? "คัดลอกเลขบัญชีไม่สำเร็จ" : "Unable to copy account number.");
    }
  }, [lang]);

  const goInfo = useCallback(() => {
    if (!slipImage) {
      setMessage(lang === "th" ? "กรุณาอัปโหลดสลิปก่อน" : "Please upload a payment slip first.");
      return;
    }

    setMessage("");
    setStep("info");
  }, [slipImage, lang]);

  const handleCheckout = useCallback((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;
    if (!items.length) return;

    setMessage("");
    setFieldErrors({});
    const formData = new FormData(event.currentTarget);
    const raw = Object.fromEntries(formData.entries());

    const payload = {
      deliveryMode,
      name: String(raw.name ?? "").trim(),
      phone: normalizePhone(phone),
      email: normalizeEmail(email),
      address: String(raw.address ?? "").trim(),
      district: String(raw.district ?? "").trim(),
      province: String(raw.province ?? "").trim(),
      postalCode: String(raw.postalCode ?? "").trim(),
      pickupTime: String(raw.pickupTime ?? "").trim(),
    };

    const errs: Record<string, string> = {};

    // Pickup time required
    if (deliveryMode === "pickup" && !payload.pickupTime) {
      errs.pickupTime = lang === "th" ? "กรุณาเลือกเวลารับสินค้า" : "Please select a pickup time";
    }

    // Postal code matches province
    if (deliveryMode === "delivery" && postalCode && province && !isPostalValidForProvince(postalCode, province)) {
      errs.postalCode = lang === "th" ? "รหัสไปรษณีย์ไม่ตรงกับจังหวัดที่เลือก" : "Postal code does not match the selected province";
    }

    const result = safeParseWithLang(checkoutFormSchema(lang as Lang), payload, lang as Lang);
    if (!result.success) {
      Object.assign(errs, result.fieldErrors ?? {});
    }

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      // scroll to first error field
      setTimeout(() => {
        document.querySelector("[data-field-error]")?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 50);
      return;
    }

    pendingFormRef.current = formData;
    setShowConfirmModal(true);
  }, [loading, items.length, deliveryMode, lang, phone, email, postalCode, province]);

  const submitOrder = useCallback(async () => {
    if (loading) return;
    const formData = pendingFormRef.current;
    if (!formData || !selectedItems.length) return;

    setShowConfirmModal(false);
    setLoading(true);
    setCreatedOrder(null);

    const name = String(formData.get("name") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").replace(/\D/g, "");
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const address = String(formData.get("address") ?? "").trim();
    const district = String(formData.get("district") ?? "").trim();
    const province = String(formData.get("province") ?? "").trim();
    const postalCode = String(formData.get("postalCode") ?? "").trim();
    const pickupTime = String(formData.get("pickupTime") ?? "").trim();

    const fullAddress =
      deliveryMode === "pickup"
        ? `รับเองที่ D1${pickupTime ? ` เวลา ${pickupTime}` : ""}`
        : [address, district, province, postalCode].filter(Boolean).join(" ");

    try {
      const orderResponse = await fetch("/api/backend/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: { name, phone, email, address: fullAddress },
          items: selectedItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            selectedOption: item.selectedOption,
          })),
        }),
      });
      const orderPayload = (await orderResponse.json()) as { data?: Order; error?: string };

      if (!orderResponse.ok || !orderPayload.data) {
        throw new Error(orderPayload.error ?? "Unable to create order");
      }

      const slipResponse = await fetch(`/api/backend/orders/${orderPayload.data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: slipImage }),
      });
      const slipPayload = (await slipResponse.json()) as { data?: Order; error?: string };

      if (!slipResponse.ok) {
        throw new Error(slipPayload.error ?? "Order created, but slip upload failed");
      }

      setReceiptItems(selectedItems);
      setCreatedOrder(slipPayload.data ?? orderPayload.data);
      saveOrderLookup(orderPayload.data.id, phone);
      clearCart();
      setSlipPreview("");
      setSlipImage("");
      setMessage("");
      setStep("success");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Checkout failed");
    } finally {
      setLoading(false);
    }
  }, [loading, selectedItems, deliveryMode, slipImage, clearCart]);

  const itemList = (
    <section className="space-y-3">
      {!items.length ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <div className="w-20 h-20 rounded-3xl bg-gray-100 flex items-center justify-center">
            <ShoppingCart className="w-9 h-9 text-gray-400" />
          </div>
          <div>
            <p className="text-lg font-black text-gray-900">
              {lang === "th" ? "รถเข็นว่างเปล่าเลย!" : "Your cart is empty!"}
            </p>
            <p className="mt-1 text-sm text-gray-400 font-medium">
              {lang === "th" ? "ไปเลือกสินค้าที่ถูกใจก่อนนะ" : "Go pick something you like"}
            </p>
          </div>
          <Link
            href="/home"
            className="mt-2 bg-[#85241F] hover:bg-[#B72D2A] text-white font-black text-sm px-6 py-3 rounded-2xl transition-all active:scale-95 shadow-md shadow-[#85241F]/20"
          >
            {lang === "th" ? "ไปเลือกสินค้า" : "Start shopping"}
          </Link>
        </div>
      ) : null}

      {/* Select all header */}
      {items.length > 0 && (
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            onClick={toggleSelectAll}
            className="flex items-center gap-2 h-10 px-2 -mx-2 rounded-xl hover:bg-gray-50 active:scale-[0.98] transition-all cursor-pointer select-none"
            aria-label={lang === "th" ? "เลือกรายการทั้งหมด" : "Select all items"}
            aria-checked={allSelected}
            role="checkbox"
          >
            <div className={`h-6 w-6 rounded-lg border-2 flex items-center justify-center transition-colors ${allSelected ? "bg-[#85241F] border-[#85241F]" : "border-gray-300 bg-white"}`}>
              {allSelected && <Check className="h-3.5 w-3.5 text-white" />}
            </div>
            <span className="text-sm font-bold text-gray-700">
              {lang === "th" ? "เลือกทั้งหมด" : "Select all"}
            </span>
          </button>
          <span className="text-sm text-gray-400">
            {items.length} {lang === "th" ? "รายการ" : `item${items.length > 1 ? "s" : ""}`}
          </span>
        </div>
      )}

      <div className="space-y-3">
        {items.map((item) => (
          <SwipeableCartItem
            key={itemKey(item)}
            item={item}
            lang={lang}
            selected={selectedIds.has(itemKey(item))}
            onSelect={toggleSelect}
            onDecrease={decreaseQty}
            onIncrease={handleIncrease}
            onRemove={handleRemove}
          />
        ))}
      </div>
    </section>
  );

  return (
    <main className="min-h-screen bg-white px-5 py-6 pb-24 lg:px-10">
      <div className="mx-auto max-w-5xl">

        {step === "success" && createdOrder ? (
          <ReceiptView lang={lang} createdOrder={createdOrder} receiptItems={receiptItems} />
        ) : null}

        {step !== "success" && message ? (
          <div className="mb-5 rounded-xl border border-[#85241F]/20 bg-[#85241F]/5 px-4 py-3 text-sm font-semibold text-[#85241F]">
            {message}
          </div>
        ) : null}

        {step === "cart" ? (
          <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
            {itemList}
            {items.length > 0 && (
              <aside className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
                  <span className="text-sm font-black text-gray-900">
                    {lang === "th" ? "สรุปคำสั่งซื้อ" : "Order summary"}
                  </span>
                  <span className="text-xs font-bold text-gray-400">
                    {lang === "th" ? `เลือก ${selectedCount} ชิ้น` : `${selectedCount} selected`}
                  </span>
                </div>
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-500">{t("checkout.total")}</span>
                  <span className="text-xl font-black text-[#85241F]">{money(selectedTotal)}</span>
                </div>
                <Button
                  onClick={goPayment}
                  className="h-12 w-full rounded-xl bg-[#85241F] text-sm font-black hover:bg-[#B72D2A]"
                >
                  {lang === "th" ? "ชำระเงิน" : "Pay now"}
                </Button>
              </aside>
            )}
          </div>
        ) : null}

        {step === "payment" ? (
          <section className="mx-auto max-w-xl rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <button
              onClick={() => setStep("cart")}
              className="mb-4 inline-flex items-center gap-2 text-xs font-bold text-gray-500"
            >
              <ArrowLeft className="h-4 w-4" />
              {lang === "th" ? "กลับตะกร้า" : "Back to cart"}
            </button>
            <div className="mb-4 rounded-2xl bg-[#85241F]/5 p-4 text-center">
              <p className="text-xs font-bold text-gray-500">{t("checkout.payment_amount")}</p>
              <p className="mt-1 text-2xl font-black text-[#85241F]">{money(selectedTotal)}</p>
            </div>
            <div className={`mb-4 rounded-2xl border p-3 transition-all duration-300 ${copiedAccount
                ? "border-emerald-500 bg-emerald-50/70 shadow-sm shadow-emerald-500/5 ring-1 ring-emerald-500/10"
                : "border-[#1E63B6]/10 bg-[#1E63B6]/5"
              }`}>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-[#1E63B6]/10 relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/bangkokBank.jpg"
                    alt="Bangkok Bank"
                    className="h-full w-full object-cover scale-110 transition-transform"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-black uppercase text-[#1E63B6]">
                    {lang === "th" ? "บัญชีรับชำระ" : "Payment account"}
                  </p>
                  <p className="mt-0.5 text-sm font-black text-gray-950">
                    {lang === "th" ? "ธนาคารกรุงเทพ" : "Bangkok Bank"}
                  </p>
                  <p className="mt-1 truncate text-xs font-bold text-gray-500">
                    {bankAccountName}
                  </p>
                  <p className="mt-1 font-mono text-lg font-black tracking-wide text-[#85241F]">
                    {bankAccountNumber}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={copyBankAccount}
                  className="flex h-10 shrink-0 items-center gap-1.5 rounded-xl border border-[#1E63B6]/20 bg-white px-3 text-xs font-black text-[#1E63B6] shadow-sm transition-colors hover:bg-[#1E63B6]/5"
                >
                  {copiedAccount ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copiedAccount
                    ? lang === "th" ? "คัดลอกแล้ว" : "Copied"
                    : lang === "th" ? "คัดลอก" : "Copy"}
                </button>
              </div>
            </div>
            <div className="rounded-xl border border-dashed border-gray-200 p-3">
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleSlipFile} />
              {slipPreview ? (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={slipPreview}
                    alt="payment slip"
                    className="max-h-56 w-full rounded-lg object-contain"
                  />
                  <button
                    onClick={() => {
                      setSlipPreview("");
                      setSlipImage("");
                    }}
                    className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-500 shadow"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex w-full flex-col items-center gap-2 py-10 text-gray-400"
                >
                  <Upload className="h-7 w-7" />
                  <span className="text-xs font-bold">{t("checkout.upload_tap")}</span>
                </button>
              )}
            </div>
            <Button
              onClick={goInfo}
              className="mt-4 h-12 w-full rounded-xl bg-[#85241F] text-sm font-black hover:bg-[#B72D2A]"
            >
              {t("checkout.continue")}
            </Button>
          </section>
        ) : null}

        {step === "info" ? (
          <section className="mx-auto max-w-xl animate-in fade-in slide-in-from-bottom-2 duration-200">

            <button
              onClick={() => setStep("payment")}
              className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              {lang === "th" ? "กลับ" : "Back"}
            </button>

            <form onSubmit={handleCheckout} className="flex flex-col gap-4">

              {/* Delivery toggle */}
              <div className="grid grid-cols-2 gap-2">
                {([
                  { mode: "delivery", icon: Truck, label: lang === "th" ? "จัดส่ง" : "Delivery" },
                  { mode: "pickup",   icon: Store, label: lang === "th" ? "รับเอง" : "Pickup"   },
                ] as const).map(({ mode, icon: Icon, label }) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setDeliveryMode(mode)}
                    className={`flex h-12 items-center justify-center gap-2 rounded-2xl border-2 text-sm font-black transition-all ${
                      deliveryMode === mode
                        ? "border-[#85241F] bg-[#85241F]/5 text-[#85241F]"
                        : "border-gray-200 bg-white text-gray-400 hover:border-gray-300"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                ))}
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
                  name="phone"
                  value={phone}
                  onChange={setPhone}
                  lang={lang}
                  placeholder={t("checkout.label.phone")}
                  className="h-12 rounded-2xl border-gray-300 text-sm font-semibold placeholder:text-gray-400 focus:border-[#85241F]"
                />
                <EmailInput
                  name="email"
                  value={email}
                  onChange={setEmail}
                  lang={lang}
                  placeholder={t("checkout.label.email")}
                  className="h-12 rounded-2xl border-gray-300 text-sm font-semibold placeholder:text-gray-400 focus:border-[#85241F]"
                />
              </div>

              {/* Address or Pickup */}
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
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1">
                      <input type="hidden" name="province" value={province} />
                      <ProvinceSelect value={province} onChange={(v) => {
                        setProvince(v);
                        if (postalCode.length === 5) {
                          setPostalError(isPostalValidForProvince(postalCode, v) ? "" :
                            lang === "th" ? "รหัสไปรษณีย์ไม่ตรงกับจังหวัด" : "Postal code mismatch");
                        }
                      }} lang={lang} error={undefined} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Input
                        name="postalCode"
                        value={postalCode}
                        onChange={(e) => {
                          const v = e.target.value.replace(/\D/g, "").slice(0, 5);
                          setPostalCode(v);
                          if (v.length === 5) {
                            setPostalError(isPostalValidForProvince(v, province) ? "" :
                              lang === "th" ? "รหัสไปรษณีย์ไม่ตรงกับจังหวัด" : "Postal code mismatch");
                          } else setPostalError("");
                        }}
                        placeholder={lang === "th" ? "รหัสไปรษณีย์" : "Postal code"}
                        className={`h-12 rounded-2xl border-gray-300 text-sm font-semibold placeholder:text-gray-400 focus-visible:ring-1 ${postalError ? "border-red-300 focus-visible:border-red-400 focus-visible:ring-red-400/20" : "focus-visible:border-[#85241F] focus-visible:ring-[#85241F]/20"}`}
                        inputMode="numeric"
                        maxLength={5}
                      />
                      {postalError && <p className="text-xs font-semibold text-red-500 px-1">{postalError}</p>}
                    </div>
                  </div>
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

              {/* Summary + Submit */}
              <div className="mt-2 rounded-2xl bg-gray-50 px-4 py-3 flex items-center justify-between">
                <span className="text-sm font-bold text-gray-500">{selectedCount} {t("shop.items_count")}</span>
                <span className="text-base font-black text-[#85241F]">{money(selectedTotal)}</span>
              </div>

              <Button
                disabled={loading || !items.length}
                className="h-13 w-full rounded-2xl bg-[#85241F] text-sm font-black hover:bg-[#B72D2A] shadow-lg shadow-[#85241F]/20"
                type="submit"
              >
                <ClipboardList className="h-4 w-4" />
                {loading ? t("checkout.creating_order") : t("checkout.confirm_button")}
              </Button>
            </form>
          </section>
        ) : null}
      </div>

      {showConfirmModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <ClipboardList className="h-6 w-6" />
            </div>
            <h2 className="text-center text-base font-black text-gray-900">
              {lang === "th" ? "ยืนยันคำสั่งซื้อ?" : "Confirm order?"}
            </h2>
            <p className="mt-2 text-center text-sm font-semibold text-gray-500">
              {lang === "th" ? "กดยืนยันเพื่อส่งคำสั่งซื้อของคุณ" : "Press confirm to place your order"}
            </p>
            <div className="mt-3 rounded-2xl bg-gray-50 p-3 text-center">
              <p className="text-xs font-bold text-gray-500">
                {selectedCount} {t("shop.items_count")}
              </p>
              <p className="mt-0.5 text-xl font-black text-[#85241F]">{money(selectedTotal)}</p>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={loading}
                onClick={() => !loading && setShowConfirmModal(false)}
                className="h-11 rounded-xl font-black"
              >
                {lang === "th" ? "ยกเลิก" : "Cancel"}
              </Button>
              <Button
                type="button"
                onClick={submitOrder}
                disabled={loading}
                className="h-11 rounded-xl bg-emerald-600 font-black hover:bg-emerald-700"
              >
                {loading ? "..." : lang === "th" ? "ยืนยัน" : "Confirm"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {removeTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
              <Trash2 className="h-6 w-6" />
            </div>
            <h2 className="text-center text-base font-black text-gray-900">
              {lang === "th" ? "ลบสินค้าออกจากตะกร้า?" : "Remove item?"}
            </h2>
            <p className="mt-2 text-center text-sm font-semibold text-gray-500">
              {confirmRemoveText}
            </p>
            <div className="mt-4 rounded-2xl bg-gray-50 p-3">
              <p className="truncate text-sm font-black text-gray-900">
                {removeTarget.name[lang] || removeTarget.name.th}
              </p>
              <p className="mt-1 text-xs font-bold text-[#85241F]">
                {money(removeTarget.price)} x {removeTarget.quantity}
              </p>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setRemoveTarget(null)}
                className="h-11 rounded-xl font-black"
              >
                {lang === "th" ? "ยกเลิก" : "Cancel"}
              </Button>
              <Button
                type="button"
                onClick={confirmRemove}
                className="h-11 rounded-xl bg-red-600 font-black hover:bg-red-700"
              >
                {lang === "th" ? "ลบสินค้า" : "Remove"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
