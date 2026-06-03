"use client";

import Link from "next/link";
import Image from "next/image";
import { memo, useCallback, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ClipboardList,
  Copy,
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
    address: string;
  };
};

const currencyFormatter = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  maximumFractionDigits: 0,
});

function money(value: number) {
  return currencyFormatter.format(value);
}

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

function itemKey(item: CartItem) {
  return `${item.productId}-${item.selectedOption ?? ""}`;
}

const SwipeableCartItem = memo(function SwipeableCartItem({
  item,
  lang,
  selected,
  onSelect,
  onDecrease,
  onIncrease,
  onRemove,
}: {
  item: CartItem;
  lang: "th" | "en";
  selected: boolean;
  onSelect: (item: CartItem) => void;
  onDecrease: (item: CartItem) => void;
  onIncrease: (item: CartItem) => void;
  onRemove: (item: CartItem) => void;
}) {
  const [swipeX, setSwipeXState] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const swipeXRef = useRef(0);
  const startX = useRef(0);
  const baseX = useRef(0);
  const dragging = useRef(false);
  const MAX = 80;
  const SNAP = 40;

  function setSwipeX(x: number) {
    swipeXRef.current = x;
    setSwipeXState(x);
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    dragging.current = true;
    setIsDragging(true);
    startX.current = e.clientX;
    baseX.current = swipeXRef.current;
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragging.current) return;
    const delta = e.clientX - startX.current;
    setSwipeX(Math.max(-MAX, Math.min(0, baseX.current + delta)));
  }

  function onPointerUp() {
    if (!dragging.current) return;
    dragging.current = false;
    setIsDragging(false);
    setSwipeX(swipeXRef.current < -SNAP ? -MAX : 0);
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-100 shadow-sm">
      {/* Delete button revealed on swipe */}
      <div className="absolute inset-y-0 right-0 w-20 bg-[#85241F] flex items-center justify-center">
        <button
          type="button"
          onClick={() => onRemove(item)}
          className="text-white p-3 h-full w-full flex items-center justify-center cursor-pointer"
          aria-label={lang === "th" ? "ลบสินค้าออกจากตะกร้า" : "Remove item from cart"}
        >
          <Trash2 className="h-5 w-5" />
        </button>
      </div>

      {/* Sliding card */}
      <div
        style={{
          transform: `translateX(${swipeX}px)`,
          transition: isDragging ? "none" : "transform 0.2s ease",
          touchAction: "pan-y",
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClick={() => { if (swipeXRef.current <= -MAX + 4) setSwipeX(0); }}
        className="relative z-10 flex items-center gap-3 bg-white p-3 select-none"
      >
        {/* Checkbox */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onSelect(item); }}
          className="h-11 w-11 -m-2.5 shrink-0 flex items-center justify-center cursor-pointer rounded-full active:bg-gray-100/50"
          aria-label={lang === "th" ? "เลือกสินค้านี้" : "Select this item"}
          aria-checked={selected}
          role="checkbox"
        >
          <div
            className={`h-6 w-6 rounded-lg border-2 flex items-center justify-center transition-colors ${
              selected ? "bg-[#85241F] border-[#85241F]" : "border-gray-300 bg-white"
            }`}
          >
            {selected && <Check className="h-3.5 w-3.5 text-white" />}
          </div>
        </button>

        {/* Image */}
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-gray-50 flex items-center justify-center relative">
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.name[lang] || item.name.th}
              width={80}
              height={80}
              unoptimized
              className="h-full w-full object-cover"
            />
          ) : (
            <ImageIcon className="h-7 w-7 text-gray-300" />
          )}
        </div>

        {/* Details + Qty */}
        <div className="min-w-0 flex-1 flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 wrap-break-word text-base font-black text-gray-900 leading-snug">
              {item.name[lang] || item.name.th}
            </p>
            {item.selectedOption && (
              <p className="mt-0.5 text-[10px] font-bold text-gray-400">{item.selectedOption}</p>
            )}
            <p className="mt-1 text-base font-black text-[#85241F]">{money(item.price)}</p>
          </div>

          {/* Qty controls — right side */}
          <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => onDecrease(item)}
              className="h-9 w-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 cursor-pointer"
              aria-label={lang === "th" ? "ลดจำนวน" : "Decrease quantity"}
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="w-6 text-center text-sm font-black text-gray-900">{item.quantity}</span>
            <button
              type="button"
              onClick={() => onIncrease(item)}
              disabled={item.stock !== undefined && item.quantity >= item.stock}
              className="h-9 w-9 rounded-full bg-[#85241F] flex items-center justify-center text-white disabled:opacity-30 cursor-pointer"
              aria-label={lang === "th" ? "เพิ่มจำนวน" : "Increase quantity"}
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

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
      next.has(key) ? next.delete(key) : next.add(key);
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

  const checkoutValidationMessage = useCallback(({
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
  }) => {
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
  }, [deliveryMode, lang]);

  const handleCheckout = useCallback((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;
    if (!items.length) return;

    setMessage("");
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").replace(/\D/g, "");
    const address = String(formData.get("address") ?? "").trim();
    const district = String(formData.get("district") ?? "").trim();
    const province = String(formData.get("province") ?? "").trim();
    const postalCode = String(formData.get("postalCode") ?? "").trim();
    const pickupTime = String(formData.get("pickupTime") ?? "").trim();

    const validationError = checkoutValidationMessage({
      name, phone, address, district, province, postalCode, pickupTime,
    });

    if (validationError) {
      setMessage(validationError);
      return;
    }

    pendingFormRef.current = formData;
    setShowConfirmModal(true);
  }, [loading, items.length, checkoutValidationMessage]);

  const submitOrder = useCallback(async () => {
    if (loading) return;
    const formData = pendingFormRef.current;
    if (!formData || !selectedItems.length) return;

    setShowConfirmModal(false);
    setLoading(true);
    setCreatedOrder(null);

    const name = String(formData.get("name") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").replace(/\D/g, "");
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
          customer: { name, phone, address: fullAddress },
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
        {step !== "success" && !items.length ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
            {/* Cute bag illustration */}
            <div className="relative">
              <div className="w-28 h-28 rounded-4xl bg-[#85241F]/8 flex items-center justify-center">
                <div className="w-20 h-20 rounded-3xl bg-[#85241F]/10 flex items-center justify-center">
                  <svg viewBox="0 0 64 64" className="w-14 h-14" fill="none">
                    {/* bag body */}
                    <rect x="10" y="24" width="44" height="32" rx="8" fill="#85241F" opacity="0.15"/>
                    <rect x="10" y="24" width="44" height="32" rx="8" stroke="#85241F" strokeWidth="2.5" fill="none"/>
                    {/* bag handle */}
                    <path d="M22 24 C22 16 42 16 42 24" stroke="#85241F" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
                    {/* smile */}
                    <path d="M26 40 Q32 46 38 40" stroke="#85241F" strokeWidth="2" strokeLinecap="round" fill="none"/>
                    {/* eyes */}
                    <circle cx="26" cy="35" r="2" fill="#85241F"/>
                    <circle cx="38" cy="35" r="2" fill="#85241F"/>
                  </svg>
                </div>
              </div>
              {/* sparkles */}
              <span className="absolute -top-1 -right-1 text-xl">✨</span>
              <span className="absolute bottom-0 -left-2 text-lg">🌸</span>
            </div>

            <div>
              <p className="text-xl font-black text-gray-900">
                {lang === "th" ? "ยังไม่มีสินค้าในรถเข็นเลย" : "Your cart is empty"}
              </p>
              <p className="mt-2 text-sm text-gray-400 font-medium">
                {lang === "th" ? "ไปเลือกสินค้าที่ชอบก่อนนะ~" : "Go find something you love~"}
              </p>
            </div>

            <Link
              href="/home"
              className="bg-[#85241F] hover:bg-[#B72D2A] text-white font-black text-sm px-8 py-3 rounded-2xl transition-all active:scale-95 shadow-md shadow-[#85241F]/20"
            >
              {lang === "th" ? "ไปเลือกสินค้า 🛍️" : "Start shopping 🛍️"}
            </Link>
          </div>
        ) : step !== "success" && (
          <>

            {/* Step Indicator */}
            <div className="mb-8 flex items-center justify-between max-w-xs mx-auto relative px-6 select-none">
              {/* Line Container */}
              <div className="absolute top-3.5 left-[38px] right-[38px] h-0.5 -translate-y-1/2 z-0">
                <div className="w-full h-full bg-gray-100 relative rounded-full overflow-hidden">
                  <div 
                    className="absolute inset-y-0 left-0 bg-[#85241F] transition-all duration-300 rounded-full"
                    style={{
                      width: step === "cart" ? "0%" : step === "payment" ? "50%" : "100%"
                    }}
                  />
                </div>
              </div>
              {[
                { id: "cart", th: "รถเข็น", en: "Cart", num: 1 },
                { id: "payment", th: "ชำระเงิน", en: "Payment", num: 2 },
                { id: "info", th: "จัดส่ง", en: "Delivery", num: 3 },
              ].map((s, idx) => {
                const isActive = step === s.id;
                const isCompleted = 
                  (step === "payment" && idx < 1) || 
                  (step === "info" && idx < 2);
                
                return (
                  <div key={s.id} className="relative z-10 flex flex-col items-center">
                    <div 
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black transition-all duration-300 ${
                        isActive 
                          ? "bg-[#85241F] text-white ring-4 ring-[#85241F]/15 scale-110" 
                          : isCompleted 
                            ? "bg-emerald-600 text-white" 
                            : "bg-white border-2 border-gray-200 text-gray-400"
                      }`}
                    >
                      {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : s.num}
                    </div>
                    <span 
                      className={`mt-1.5 text-[10px] font-bold transition-colors duration-300 ${
                        isActive ? "text-[#85241F]" : "text-gray-400"
                      }`}
                    >
                      {lang === "th" ? s.th : s.en}
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {step === "success" && createdOrder ? (
          <div className="flex min-h-[80vh] flex-col items-center justify-center py-10 text-center">
            <div className="w-full max-w-sm">
              <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 success-pop">
                <CheckCircle2 className="h-14 w-14 text-emerald-600" />
              </div>
              <h1 className="text-2xl font-black text-gray-900">
                {lang === "th" ? "คำสั่งซื้อสำเร็จ!" : "Order placed!"}
              </h1>
              <p className="mt-2 text-sm font-semibold text-gray-500">
                {lang === "th" ? "เราได้รับคำสั่งซื้อของคุณแล้ว" : "We have received your order"}
              </p>
              
              {/* Receipt Wrapper */}
              <div className="receipt-wrapper receipt-animate relative mx-auto mt-8 mb-6 p-6 w-full max-w-[340px] text-left font-mono text-xs text-neutral-800">
                <div className="receipt-edge-top" />
                
                {/* Header */}
                <div className="text-center space-y-1">
                  <h2 className="text-sm font-bold tracking-wider text-neutral-900 uppercase">HLLC STORE</h2>
                </div>

                <div className="my-3 text-center text-neutral-400">
                  *-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*
                </div>

                <div className="text-center font-bold text-neutral-900 tracking-wide uppercase">
                  {lang === "th" ? "ใบเสร็จรับเงิน / RECEIPT" : "CASH RECEIPT"}
                </div>

                <div className="my-3 text-center text-neutral-400">
                  *-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*
                </div>

                {/* Items Table */}
                <div className="space-y-2">
                  <div className="flex justify-between font-bold text-neutral-900">
                    <span>{lang === "th" ? "รายการ" : "Description"}</span>
                    <span>{lang === "th" ? "ราคา" : "Price"}</span>
                  </div>
                  <div className="space-y-1.5">
                    {receiptItems.map((item, idx) => (
                      <div key={idx} className="space-y-0.5">
                        <div className="flex justify-between items-start gap-4">
                          <span className="wrap-break-word line-clamp-2">
                            {item.name[lang] || item.name.th}
                          </span>
                          <span className="shrink-0 font-bold">
                            {money(item.price * item.quantity)}
                          </span>
                        </div>
                        <div className="flex justify-between text-[10px] text-neutral-500 pl-2">
                          <span>
                            {item.quantity} x {money(item.price)}
                            {item.selectedOption ? ` (${item.selectedOption})` : ""}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="my-4 text-center text-neutral-400">
                  *-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*
                </div>

                {/* Subtotals & Total */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-neutral-600">
                    <span>{lang === "th" ? "ยอดรวม" : "Subtotal"}</span>
                    <span>{money(createdOrder.total)}</span>
                  </div>
                  <div className="flex justify-between text-neutral-600">
                    <span>{lang === "th" ? "วิธีชำระเงิน" : "Payment"}</span>
                    <span className="font-bold">{lang === "th" ? "โอนเงิน (สลิป)" : "Bank Transfer"}</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm text-neutral-900 pt-1.5 border-t border-dashed border-neutral-300">
                    <span>{lang === "th" ? "ยอดชำระสุทธิ" : "Total"}</span>
                    <span>{money(createdOrder.total)}</span>
                  </div>
                </div>

                <div className="my-4 text-center text-neutral-400">
                  *-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*
                </div>

                {/* Footer Info */}
                <div className="space-y-1 text-[10px] text-neutral-500">
                  <div className="flex justify-between">
                    <span>{lang === "th" ? "เลขพัสดุ:" : "Tracking No.:"}</span>
                    <span className="font-bold text-neutral-700">{createdOrder.customer?.phone || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{lang === "th" ? "วันที่:" : "Date:"}</span>
                    <span>{new Date().toLocaleString(lang === "th" ? "th-TH" : "en-US", { dateStyle: "short", timeStyle: "short" })}</span>
                  </div>
                </div>

                <div className="my-4 text-center text-neutral-400">
                  *-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*
                </div>

                {/* Barcode */}
                <div className="text-center space-y-3">
                  {/* Barcode component */}
                  <div className="flex justify-center items-center h-8 w-full gap-[1px] opacity-75 mix-blend-multiply my-1 select-none">
                    {[2, 1, 3, 1, 2, 4, 1, 2, 1, 3, 2, 1, 4, 1, 2, 1, 3, 1, 2, 4, 1, 2, 1, 3, 2].map((w, i) => (
                      <div key={i} className="bg-neutral-800 h-full" style={{ width: `${w}px` }} />
                    ))}
                  </div>
                  
                  <p className="text-[9px] text-neutral-400 tracking-widest font-mono">
                    *{createdOrder.customer?.phone}*
                  </p>
                </div>

                <div className="receipt-edge-bottom" />
              </div>
              <Button
                asChild
                className="mt-6 h-13 w-full rounded-2xl bg-emerald-600 text-sm font-black hover:bg-emerald-700"
              >
                <Link href="/profile">
                  {lang === "th" ? "ดูสถานะคำสั่งซื้อ" : "Track my order"}
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="mt-3 h-12 w-full rounded-2xl text-sm font-black"
              >
                <Link href="/home">
                  {lang === "th" ? "กลับหน้าแรก" : "Back to home"}
                </Link>
              </Button>
            </div>
          </div>
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
            <div className={`mb-4 rounded-2xl border p-3 transition-all duration-300 ${
              copiedAccount 
                ? "border-emerald-500 bg-emerald-50/70 shadow-sm shadow-emerald-500/5 ring-1 ring-emerald-500/10" 
                : "border-[#1E63B6]/10 bg-[#1E63B6]/5"
            }`}>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-[#1E63B6]/10 relative">
                  <Image
                    src="/images/image.png"
                    alt="Krungthai"
                    width={48}
                    height={48}
                    className="h-full w-full object-cover scale-110 transition-transform"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-black uppercase text-[#1E63B6]">
                    {lang === "th" ? "บัญชีรับชำระ" : "Payment account"}
                  </p>
                  <p className="mt-0.5 text-sm font-black text-gray-950">
                    {lang === "th" ? "ธนาคารกรุงไทย" : "Krungthai Bank"}
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
                  <Image
                    src={slipPreview}
                    alt="payment slip"
                    width={400}
                    height={224}
                    unoptimized
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
                  className={`h-10 rounded-lg text-sm font-black transition-colors ${deliveryMode === "delivery"
                    ? "bg-white text-[#85241F] shadow-sm"
                    : "text-gray-500"
                    }`}
                >
                  {lang === "th" ? "จัดส่ง" : "Delivery"}
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryMode("pickup")}
                  className={`h-10 rounded-lg text-sm font-black transition-colors ${deliveryMode === "pickup"
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
                  <TimeSelect name="pickupTime" />
                </div>
              )}
              <div className="rounded-xl bg-gray-50 p-3 text-xs font-bold text-gray-500">
                <div className="flex justify-between">
                  <span>{selectedCount} {t("shop.items_count")}</span>
                  <span className="text-[#85241F]">{money(selectedTotal)}</span>
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
