"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  Image as ImageIcon,
  Minus,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCart, type CartItem } from "@/lib/cart";
import { useLanguage } from "@/lib/language-context";

type Step = "cart" | "payment" | "info";
type DeliveryMode = "delivery" | "pickup";

type Order = {
  id: string;
  total: number;
  status: string;
};

function money(value: number) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(value);
}

function saveOrderLookup(orderId: string, phone: string) {
  try {
    const existing = JSON.parse(localStorage.getItem("shop-order-ids") ?? "[]") as string[];
    localStorage.setItem(
      "shop-order-ids",
      JSON.stringify(Array.from(new Set([orderId, ...existing])).slice(0, 20)),
    );
    localStorage.setItem("shop-last-phone", phone);
  } catch {}
}

export default function CartPage() {
  const { items, total, count, updateQty, removeItem, clearCart } = useCart();
  const { lang, t } = useLanguage();
  const [step, setStep] = useState<Step>("cart");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [slipPreview, setSlipPreview] = useState("");
  const [slipImage, setSlipImage] = useState("");
  const [removeTarget, setRemoveTarget] = useState<CartItem | null>(null);
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>("delivery");
  const fileRef = useRef<HTMLInputElement>(null);

  const confirmRemoveText =
    lang === "th" ? "ต้องการลบสินค้านี้ออกจากตะกร้าใช่ไหม?" : "Remove this item from cart?";

  function requestRemove(item: CartItem) {
    setRemoveTarget(item);
  }

  function confirmRemove() {
    if (!removeTarget) return;
    removeItem(removeTarget.productId, removeTarget.selectedOption);
    setRemoveTarget(null);
  }

  function decreaseQty(item: CartItem) {
    if (item.quantity <= 1) {
      requestRemove(item);
      return;
    }

    updateQty(item.productId, item.quantity - 1, item.selectedOption);
  }

  function handleSlipFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const result = String(loadEvent.target?.result ?? "");
      setSlipPreview(result);
      setSlipImage(result);
    };
    reader.readAsDataURL(file);
  }

  function goPayment() {
    if (!items.length) return;
    setMessage("");
    setStep("payment");
  }

  function goInfo() {
    if (!slipImage) {
      setMessage(lang === "th" ? "กรุณาอัปโหลดสลิปก่อน" : "Please upload a payment slip first.");
      return;
    }

    setMessage("");
    setStep("info");
  }

  function checkoutValidationMessage({
    name,
    phone,
    address,
    district,
    province,
    postalCode,
    pickupTime,
  }: {
    name: string;
    phone: string;
    address: string;
    district: string;
    province: string;
    postalCode: string;
    pickupTime: string;
  }) {
    const missing: string[] = [];
    const invalid: string[] = [];

    if (!name) missing.push(lang === "th" ? "ชื่อผู้รับ" : "recipient name");

    if (!phone) {
      missing.push(lang === "th" ? "เบอร์โทรศัพท์" : "phone number");
    } else if (phone.length < 9) {
      invalid.push(lang === "th" ? "เบอร์โทรศัพท์ต้องมีอย่างน้อย 9 หลัก" : "phone number must be at least 9 digits");
    }

    if (deliveryMode === "pickup") {
      if (!pickupTime) missing.push(lang === "th" ? "เวลารับสินค้า" : "pickup time");
    } else {
      if (!address) missing.push(lang === "th" ? "ที่อยู่จัดส่ง" : "shipping address");
      if (!district) missing.push(lang === "th" ? "เขต/อำเภอ" : "district");
      if (!province) missing.push(lang === "th" ? "จังหวัด" : "province");

      if (!postalCode) {
        missing.push(lang === "th" ? "รหัสไปรษณีย์" : "postal code");
      } else if (!/^\d{5}$/.test(postalCode)) {
        invalid.push(lang === "th" ? "รหัสไปรษณีย์ต้องมี 5 หลัก" : "postal code must be 5 digits");
      }
    }

    const messages: string[] = [];
    if (missing.length) {
      messages.push(
        lang === "th"
          ? `กรุณากรอก: ${missing.join(", ")}`
          : `Please fill in: ${missing.join(", ")}`
      );
    }
    messages.push(...invalid);

    return messages.join(" • ");
  }

  async function handleCheckout(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!items.length) return;

    setMessage("");
    setCreatedOrder(null);

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").replace(/\D/g, "");
    const address = String(formData.get("address") ?? "").trim();
    const district = String(formData.get("district") ?? "").trim();
    const province = String(formData.get("province") ?? "").trim();
    const postalCode = String(formData.get("postalCode") ?? "").trim();
    const pickupTime = String(formData.get("pickupTime") ?? "").trim();
    const validationError = checkoutValidationMessage({
      name,
      phone,
      address,
      district,
      province,
      postalCode,
      pickupTime,
    });

    if (validationError) {
      setMessage(validationError);
      return;
    }

    setLoading(true);
    const fullAddress =
      deliveryMode === "pickup"
        ? `รับเองที่ D1${pickupTime ? ` เวลา ${pickupTime}` : ""}`
        : [address, district, province, postalCode].filter(Boolean).join(" ");

    try {
      const orderResponse = await fetch("/api/backend/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: { name, phone, address: fullAddress },
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            selectedOption: item.selectedOption,
          })),
        }),
      });
      const orderPayload = (await orderResponse.json()) as {
        data?: Order;
        error?: string;
      };

      if (!orderResponse.ok || !orderPayload.data) {
        throw new Error(orderPayload.error ?? "Unable to create order");
      }

      const slipResponse = await fetch(`/api/backend/orders/${orderPayload.data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: slipImage, amount: total }),
      });
      const slipPayload = (await slipResponse.json()) as {
        data?: Order;
        error?: string;
      };

      if (!slipResponse.ok) {
        throw new Error(slipPayload.error ?? "Order created, but slip upload failed");
      }

      setCreatedOrder(slipPayload.data ?? orderPayload.data);
      saveOrderLookup(orderPayload.data.id, phone);
      clearCart();
      setSlipPreview("");
      setSlipImage("");
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Checkout failed");
    } finally {
      setLoading(false);
    }
  }

  const itemList = (
    <section className="space-y-3">
      {!items.length ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-5 py-12 text-center">
          <p className="text-sm font-bold text-gray-500">
            {lang === "th" ? "ยังไม่มีสินค้าในตะกร้า" : "Your cart is empty."}
          </p>
        </div>
      ) : null}

      {items.map((item) => (
        <div key={`${item.productId}-${item.selectedOption ?? ""}`} className="flex gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-50">
            {item.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
            ) : (
              <ImageIcon className="h-7 w-7 text-gray-300" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-black text-gray-900">{item.name}</p>
            {item.selectedOption ? (
              <p className="mt-0.5 text-[10px] font-bold text-gray-400">{item.selectedOption}</p>
            ) : null}
            <p className="mt-1 text-xs font-semibold text-[#85241F]">{money(item.price)}</p>
            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 rounded-xl border border-gray-200 px-2 py-1">
                <button
                  onClick={() => decreaseQty(item)}
                  className="flex h-7 w-7 items-center justify-center text-gray-500"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-6 text-center text-sm font-black">{item.quantity}</span>
                <button
                  onClick={() => updateQty(item.productId, item.quantity + 1, item.selectedOption)}
                  disabled={item.stock !== undefined && item.quantity >= item.stock}
                  className="flex h-7 w-7 items-center justify-center text-gray-500 disabled:opacity-30"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <button
                onClick={() => requestRemove(item)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </section>
  );

  return (
    <main className="min-h-screen bg-white px-5 py-6 pb-24 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase text-gray-400">{t("nav.cart")}</p>
            <h1 className="text-2xl font-black text-gray-900">
              {step === "payment"
                ? lang === "th" ? "ชำระเงิน" : "Payment"
                : step === "info"
                  ? lang === "th" ? "ข้อมูลจัดส่ง" : "Delivery info"
                  : lang === "th" ? "ตะกร้าสินค้า" : "Shopping cart"}
            </h1>
          </div>
          <Button asChild variant="outline" className="rounded-xl">
            <Link href="/home">{lang === "th" ? "เลือกสินค้า" : "Shop"}</Link>
          </Button>
        </header>

        {createdOrder ? (
          <section className="mb-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-emerald-800">
            <CheckCircle2 className="mb-2 h-6 w-6" />
            <p className="text-sm font-black">
              {lang === "th" ? "คำสั่งซื้อสำเร็จ" : "Order successful"}
            </p>
            <p className="mt-1 text-xs font-semibold">
              ORDER ID: #{createdOrder.id.slice(-8).toUpperCase()} · {money(createdOrder.total)}
            </p>
            <Button asChild className="mt-3 h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700">
              <Link href="/profile">{lang === "th" ? "ดูสถานะคำสั่งซื้อ" : "Track order"}</Link>
            </Button>
          </section>
        ) : null}

        {message ? (
          <div className="mb-5 rounded-xl border border-[#85241F]/20 bg-[#85241F]/5 px-4 py-3 text-sm font-semibold text-[#85241F]">
            {message}
          </div>
        ) : null}

        {step === "cart" ? (
          <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
            {itemList}
            <aside className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
                <span className="text-sm font-black text-gray-900">
                  {lang === "th" ? "สรุปคำสั่งซื้อ" : "Order summary"}
                </span>
                <span className="text-xs font-bold text-gray-400">
                  {count} {t("shop.items_count")}
                </span>
              </div>
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-500">{t("checkout.total")}</span>
                <span className="text-xl font-black text-[#85241F]">{money(total)}</span>
              </div>
              <Button
                disabled={!items.length}
                onClick={goPayment}
                className="h-12 w-full rounded-xl bg-[#85241F] text-sm font-black hover:bg-[#B72D2A]"
              >
                {lang === "th" ? "ชำระเงิน" : "Pay now"}
              </Button>
            </aside>
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
              <p className="mt-1 text-2xl font-black text-[#85241F]">{money(total)}</p>
            </div>
            <div className="mb-4 flex justify-center rounded-2xl border border-gray-100 bg-gray-50 p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/qr-payment.png" alt="payment QR" className="max-h-56 object-contain" />
            </div>
            <div className="rounded-xl border border-dashed border-gray-200 p-3">
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleSlipFile} />
              {slipPreview ? (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={slipPreview} alt="payment slip" className="max-h-56 w-full rounded-lg object-contain" />
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
          <section className="mx-auto max-w-xl rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <button
              onClick={() => setStep("payment")}
              className="mb-4 inline-flex items-center gap-2 text-xs font-bold text-gray-500"
            >
              <ArrowLeft className="h-4 w-4" />
              {lang === "th" ? "กลับไปชำระเงิน" : "Back to payment"}
            </button>
            <form onSubmit={handleCheckout} className="space-y-3">
              <div className="grid grid-cols-2 rounded-xl bg-gray-100 p-1">
                <button
                  type="button"
                  onClick={() => setDeliveryMode("delivery")}
                  className={`h-10 rounded-lg text-sm font-black transition-colors ${
                    deliveryMode === "delivery"
                      ? "bg-white text-[#85241F] shadow-sm"
                      : "text-gray-500"
                  }`}
                >
                  {lang === "th" ? "จัดส่ง" : "Delivery"}
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryMode("pickup")}
                  className={`h-10 rounded-lg text-sm font-black transition-colors ${
                    deliveryMode === "pickup"
                      ? "bg-white text-[#85241F] shadow-sm"
                      : "text-gray-500"
                  }`}
                >
                  {lang === "th" ? "รับเอง" : "Pickup"}
                </button>
              </div>
              <Input name="name" placeholder={lang === "th" ? "ชื่อผู้รับ" : "Recipient name"} className="h-11 rounded-xl" />
              <Input name="phone" placeholder={t("checkout.label.phone")} className="h-11 rounded-xl" />
              {deliveryMode === "delivery" ? (
                <>
                  <Textarea name="address" placeholder={t("checkout.label.address")} className="min-h-28 rounded-xl" />
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <Input name="district" placeholder={lang === "th" ? "เขต/อำเภอ" : "District"} className="h-11 rounded-xl" />
                    <Input name="province" placeholder={lang === "th" ? "จังหวัด" : "Province"} className="h-11 rounded-xl" />
                    <Input name="postalCode" placeholder={lang === "th" ? "รหัสไปรษณีย์" : "Postal code"} className="h-11 rounded-xl" />
                  </div>
                </>
              ) : (
                <div className="rounded-2xl border border-[#85241F]/10 bg-[#85241F]/5 p-3">
                  <p className="text-sm font-black text-[#85241F]">
                    {lang === "th" ? "รับสินค้าเองที่ D1" : "Pickup at D1"}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-gray-500">
                    {lang === "th" ? "กรุณาระบุเวลาที่สะดวกมารับสินค้า" : "Please enter your preferred pickup time."}
                  </p>
                  <Input name="pickupTime" placeholder={lang === "th" ? "เวลาที่จะมารับ" : "Pickup time"} className="mt-3 h-11 rounded-xl bg-white" />
                </div>
              )}
              <div className="rounded-xl bg-gray-50 p-3 text-xs font-bold text-gray-500">
                <div className="flex justify-between">
                  <span>{count} {t("shop.items_count")}</span>
                  <span className="text-[#85241F]">{money(total)}</span>
                </div>
              </div>
              <Button
                disabled={loading || !items.length}
                className="h-12 w-full rounded-xl bg-[#85241F] text-sm font-black hover:bg-[#B72D2A]"
                type="submit"
              >
                <ClipboardList className="h-4 w-4" />
                {loading ? t("checkout.creating_order") : t("checkout.confirm_button")}
              </Button>
            </form>
          </section>
        ) : null}
      </div>

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
                {removeTarget.name}
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
