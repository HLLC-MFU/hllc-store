"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, ShoppingCart } from "lucide-react";
import { useCart, type CartItem } from "@/lib/client/cart";
import { useLanguage } from "@/lib/client/language-context";
import { safeParseWithLang, checkoutFormSchema, normalizePhone, normalizeEmail } from "@/lib/validation/schemas-i18n";
import type { Lang } from "@/lib/validation/schemas-i18n";
import { attachPaymentSlip, cancelPublicOrder, createOrder } from "@/lib/modules/orders";
import { SwipeableCartItem, itemKey } from "@/components/shop/cart/swipeable-cart-item";
import { ReceiptView } from "@/components/shop/cart/receipt-view";
import { CartSummaryPanel } from "./components/CartSummaryPanel";
import { PaymentStep } from "./components/PaymentStep";
import { InfoStep } from "./components/InfoStep";
import { ConfirmOrderModal, RemoveItemModal } from "./components/CartModals";

type Step = "cart" | "payment" | "info" | "success";
type DeliveryMode = "delivery" | "pickup";

type Order = {
  id: string;
  subtotal?: number;
  shippingFee?: number;
  deliveryMode?: DeliveryMode;
  total: number;
  status: string;
  customer?: { name: string; phone: string; email: string; address: string };
};

const MAX_SLIP_BYTES = 5 * 1024 * 1024;

function saveOrderLookup(orderId: string, phone: string) {
  try {
    const existing = JSON.parse(localStorage.getItem("shop-order-ids") ?? "[]") as string[];
    localStorage.setItem("shop-order-ids", JSON.stringify(Array.from(new Set([orderId, ...existing])).slice(0, 20)));
    localStorage.setItem("shop-last-phone", phone);
  } catch { }
}

function itemShippingFee(item: CartItem) {
  if (item.quantity <= 0) return 0;
  return (item.shippingFirstItem ?? 0) + (item.shippingAdditionalItem ?? 0) * Math.max(0, item.quantity - 1);
}

export default function CartPage() {
  const { items, updateQty, removeItem, clearCart } = useCart();
  const { lang, t } = useLanguage();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const allSelected = useMemo(() => items.length > 0 && items.every(i => selectedIds.has(itemKey(i))), [items, selectedIds]);
  const { selectedItems, selectedTotal, selectedCount } = useMemo(() => {
    const selected = items.filter(i => selectedIds.has(itemKey(i)));
    const total = selected.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const count = selected.reduce((sum, i) => sum + i.quantity, 0);
    return { selectedItems: selected, selectedTotal: total, selectedCount: count };
  }, [items, selectedIds]);

  const autoSelected = useRef(false);
  useEffect(() => {
    if (autoSelected.current || items.length === 0) return;
    const isSelectAll = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("selectAll") === "1";
    if (isSelectAll) {
      autoSelected.current = true;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedIds(new Set(items.map(itemKey)));
    }
  }, [items]);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds(allSelected ? new Set() : new Set(items.map(itemKey)));
  }, [allSelected, items]);

  const toggleSelect = useCallback((item: CartItem) => {
    const key = itemKey(item);
    setSelectedIds(prev => { const next = new Set(prev); if (next.has(key)) { next.delete(key); } else { next.add(key); } return next; });
  }, []);

  const [step, setStep] = useState<Step>("cart");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [receiptItems, setReceiptItems] = useState<CartItem[]>([]);
  const [slipPreview, setSlipPreview] = useState("");
  const [slipImage, setSlipImage] = useState("");
  const [slipError, setSlipError] = useState("");
  const [removeTarget, setRemoveTarget] = useState<CartItem | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const pendingFormRef = useRef<FormData | null>(null);
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>("delivery");
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [name, setName] = useState(() => { try { return localStorage.getItem("checkout-name") ?? ""; } catch { return ""; } });
  const [email, setEmail] = useState(() => { try { return localStorage.getItem("checkout-email") ?? ""; } catch { return ""; } });
  const [phone, setPhone] = useState(() => { try { return localStorage.getItem("checkout-phone") ?? ""; } catch { return ""; } });
  const [address, setAddress] = useState(() => { try { return localStorage.getItem("checkout-address") ?? ""; } catch { return ""; } });
  const [district, setDistrict] = useState(() => { try { return localStorage.getItem("checkout-district") ?? ""; } catch { return ""; } });
  const [province, setProvince] = useState(() => { try { return localStorage.getItem("checkout-province") ?? ""; } catch { return ""; } });
  const [postalCode, setPostalCode] = useState(() => { try { return localStorage.getItem("checkout-postalCode") ?? ""; } catch { return ""; } });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const selectedShippingFee = useMemo(() => deliveryMode === "pickup" ? 0 : selectedItems.reduce((sum, item) => sum + itemShippingFee(item), 0), [deliveryMode, selectedItems]);
  const selectedPayableTotal = selectedTotal + selectedShippingFee;

  const confirmRemoveText = useMemo(() => lang === "th" ? "ต้องการลบสินค้านี้ออกจากตะกร้าใช่ไหม?" : "Remove this item from cart?", [lang]);

  const confirmRemove = useCallback(() => {
    if (!removeTarget) return;
    removeItem(removeTarget.productId, removeTarget.selectedOption);
    setRemoveTarget(null);
  }, [removeTarget, removeItem]);

  const decreaseQty = useCallback((item: CartItem) => {
    if (item.quantity <= 1) { setRemoveTarget(item); return; }
    updateQty(item.productId, item.quantity - 1, item.selectedOption);
  }, [updateQty]);

  const handleSlipFile = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setSlipError(lang === "th" ? "รองรับรูปแบบ JPG, PNG, WEBP เท่านั้น" : "Please upload a JPG, PNG, or WEBP image");
      event.target.value = "";
      return;
    }
    if (file.size > MAX_SLIP_BYTES) {
      setSlipError(lang === "th" ? "รูปไฟล์ใหญ่เกินไป ขอไม่เกิน 5 MB นะ" : "Image is too large, please keep it under 5 MB");
      event.target.value = "";
      return;
    }
    setSlipError("");
    const reader = new FileReader();
    reader.onload = (e) => { const r = String(e.target?.result ?? ""); setSlipPreview(r); setSlipImage(r); };
    reader.readAsDataURL(file);
  }, [lang]);

  const goPayment = useCallback(() => {
    if (!selectedItems.length) { setMessage(lang === "th" ? "กรุณาเลือกสินค้าก่อน" : "Please select items first."); return; }
    setMessage(""); setStep("payment");
  }, [selectedItems.length, lang]);

  const copyBankAccount = useCallback(async () => {
    try { await navigator.clipboard.writeText("6621540027"); setCopiedAccount(true); window.setTimeout(() => setCopiedAccount(false), 1800); }
    catch { setMessage(lang === "th" ? "คัดลอกเลขบัญชีไม่สำเร็จ" : "Unable to copy account number."); }
  }, [lang]);

  const goInfo = useCallback(() => {
    if (!slipImage) { setMessage(lang === "th" ? "กรุณาอัปโหลดสลิปก่อน" : "Please upload a payment slip first."); return; }
    setMessage(""); setStep("info");
  }, [slipImage, lang]);

  const handleCheckout = useCallback((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading || !items.length) return;
    setMessage(""); setFieldErrors({});
    const formData = new FormData(event.currentTarget);
    const raw = Object.fromEntries(formData.entries());
    const payload = {
      deliveryMode, name: String(raw.name ?? "").trim(),
      phone: normalizePhone(phone), email: normalizeEmail(email),
      address: String(raw.address ?? "").trim(), district: String(raw.district ?? "").trim(),
      province, postalCode: String(raw.postalCode ?? "").trim(),
      pickupTime: String(raw.pickupTime ?? "").trim(),
    };
    const errs: Record<string, string> = {};
    if (deliveryMode === "pickup" && !payload.pickupTime) {
      errs.pickupTime = lang === "th" ? "กรุณาเลือกเวลารับสินค้า" : "Please select a pickup time";
    }
    const result = safeParseWithLang(checkoutFormSchema(lang as Lang), payload, lang as Lang);
    if (!result.success) Object.assign(errs, result.fieldErrors ?? {});
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      setMessage(Object.values(errs)[0] ?? (lang === "th" ? "กรุณากรอกข้อมูลให้ครบถ้วน" : "Please fill in all required fields"));
      return;
    }
    pendingFormRef.current = formData;
    setShowConfirmModal(true);
  }, [loading, items.length, deliveryMode, lang, phone, email, province]);

  const submitOrder = useCallback(async () => {
    if (loading) return;
    const formData = pendingFormRef.current;
    if (!formData || !selectedItems.length) return;
    setShowConfirmModal(false); setLoading(true); setCreatedOrder(null);
    const name = String(formData.get("name") ?? "").trim();
    const rawPhone = String(formData.get("phone") ?? "").replace(/\D/g, "");
    const rawEmail = String(formData.get("email") ?? "").trim().toLowerCase();
    const address = String(formData.get("address") ?? "").trim();
    const district = String(formData.get("district") ?? "").trim();
    const prov = String(formData.get("province") ?? "").trim();
    const postal = String(formData.get("postalCode") ?? "").trim();
    const pickupTime = String(formData.get("pickupTime") ?? "").trim();
    const fullAddress = deliveryMode === "pickup"
      ? `รับเองที่ D1${pickupTime ? ` เวลา ${pickupTime}` : ""}`
      : [address, district, prov, postal].filter(Boolean).join(" ");
    try {
      const order = await createOrder({
        customer: { name, phone: rawPhone, email: rawEmail, address: fullAddress },
        items: selectedItems.map((item) => ({ productId: item.productId, quantity: item.quantity, selectedOption: item.selectedOption || undefined })),
        deliveryMode,
      });

      try {
        await attachPaymentSlip(order.id, slipImage);
      } catch {
        // Roll back — cancel the order so it doesn't stay as pending_payment
        await cancelPublicOrder(order.id, "slip upload failed");
        throw new Error(lang === "th" ? "อัปโหลดสลิปไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" : "Slip upload failed, please try again");
      }

      saveOrderLookup(order.id, rawPhone);
      setCreatedOrder(order); setReceiptItems(selectedItems);
      setMessage(""); clearCart(); setStep("success");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Checkout failed");
    } finally {
      setLoading(false);
    }
  }, [loading, selectedItems, deliveryMode, slipImage, clearCart, lang]);

  return (
    <main className="min-h-screen bg-white px-5 py-6 pb-24 lg:px-10">
      <div className="mx-auto max-w-5xl">

        {step === "success" && createdOrder && (
          <ReceiptView lang={lang} createdOrder={createdOrder} receiptItems={receiptItems} />
        )}

        {step !== "success" && message && (
          <div className="mb-5 rounded-xl border border-[#85241F]/20 bg-[#85241F]/5 px-4 py-3 text-sm font-semibold text-[#85241F]">
            {message}
          </div>
        )}

        {step === "cart" && !items.length && (
          <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4 text-center">
            <div className="w-20 h-20 rounded-3xl bg-gray-100 flex items-center justify-center">
              <ShoppingCart className="w-9 h-9 text-gray-400" />
            </div>
            <div>
              <p className="text-lg font-black text-gray-900">{lang === "th" ? "รถเข็นว่างเปล่าเลย!" : "Your cart is empty!"}</p>
              <p className="mt-1 text-sm text-gray-400 font-medium">{lang === "th" ? "ไปเลือกสินค้าที่ถูกใจก่อนนะ" : "Go pick something you like"}</p>
            </div>
            <Link href="/home" className="mt-2 bg-[#85241F] hover:bg-[#B72D2A] text-white font-black text-sm px-6 py-3 rounded-2xl transition-all active:scale-95 shadow-md shadow-[#85241F]/20">
              {lang === "th" ? "ไปเลือกสินค้า" : "Start shopping"}
            </Link>
          </div>
        )}

        {step === "cart" && !!items.length && (
          <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
            {/* Item list */}
            <section className="space-y-3">
              {items.length > 0 && (
                <div className="flex items-center justify-between mb-3">
                  <button type="button" onClick={toggleSelectAll}
                    className="flex items-center gap-2 h-10 px-2 -mx-2 rounded-xl hover:bg-gray-50 active:scale-[0.98] transition-all cursor-pointer select-none"
                    aria-label={lang === "th" ? "เลือกรายการทั้งหมด" : "Select all items"}
                    aria-checked={allSelected} role="checkbox"
                  >
                    <div className={`h-6 w-6 rounded-lg border-2 flex items-center justify-center transition-colors ${allSelected ? "bg-[#85241F] border-[#85241F]" : "border-gray-300 bg-white"}`}>
                      {allSelected && <Check className="h-3.5 w-3.5 text-white" />}
                    </div>
                    <span className="text-sm font-bold text-gray-700">{lang === "th" ? "เลือกทั้งหมด" : "Select all"}</span>
                  </button>
                  <span className="text-sm text-gray-400">{items.length} {lang === "th" ? "รายการ" : `item${items.length > 1 ? "s" : ""}`}</span>
                </div>
              )}
              <div className="space-y-3">
                {items.map((item) => (
                  <SwipeableCartItem
                    key={itemKey(item)} item={item} lang={lang}
                    selected={selectedIds.has(itemKey(item))} onSelect={toggleSelect}
                    onDecrease={decreaseQty} onIncrease={(i) => updateQty(i.productId, i.quantity + 1, i.selectedOption)}
                    onRemove={(i) => removeItem(i.productId, i.selectedOption)}
                  />
                ))}
              </div>
            </section>

            <CartSummaryPanel
              lang={lang} t={t}
              selectedCount={selectedCount} selectedTotal={selectedTotal}
              selectedShippingFee={selectedShippingFee} selectedPayableTotal={selectedPayableTotal}
              deliveryMode={deliveryMode} setDeliveryMode={setDeliveryMode}
              onPay={goPayment} items={items}
            />
          </div>
        )}

        {step === "payment" && (
          <PaymentStep
            lang={lang} t={t}
            selectedPayableTotal={selectedPayableTotal} selectedShippingFee={selectedShippingFee}
            copiedAccount={copiedAccount} slipPreview={slipPreview} slipError={slipError}
            onCopyAccount={copyBankAccount} onSlipFile={handleSlipFile}
            onClearSlip={() => { setSlipPreview(""); setSlipImage(""); setSlipError(""); }}
            onBack={() => setStep("cart")} onContinue={goInfo}
          />
        )}

        {step === "info" && (
          <InfoStep
            lang={lang} t={t} deliveryMode={deliveryMode}
            name={name} setName={(v) => { setName(v); try { localStorage.setItem("checkout-name", v); } catch {} }}
            phone={phone} setPhone={(v) => { setPhone(v); try { localStorage.setItem("checkout-phone", v); } catch {} }}
            email={email} setEmail={(v) => { setEmail(v); try { localStorage.setItem("checkout-email", v); } catch {} }}
            address={address} setAddress={(v) => { setAddress(v); try { localStorage.setItem("checkout-address", v); } catch {} }}
            district={district} setDistrict={(v) => { setDistrict(v); try { localStorage.setItem("checkout-district", v); } catch {} }}
            province={province} setProvince={(v) => { setProvince(v); try { localStorage.setItem("checkout-province", v); } catch {} }}
            postalCode={postalCode} setPostalCode={(v) => { setPostalCode(v); try { localStorage.setItem("checkout-postalCode", v); } catch {} }}
            fieldErrors={fieldErrors} loading={loading}
            selectedCount={selectedCount} selectedTotal={selectedTotal}
            selectedShippingFee={selectedShippingFee} selectedPayableTotal={selectedPayableTotal}
            itemsLength={items.length} onBack={() => setStep("payment")} onSubmit={handleCheckout}
          />
        )}
      </div>

      {showConfirmModal && (
        <ConfirmOrderModal
          lang={lang} t={t} loading={loading}
          selectedCount={selectedCount} selectedPayableTotal={selectedPayableTotal} selectedShippingFee={selectedShippingFee}
          onCancel={() => !loading && setShowConfirmModal(false)} onConfirm={submitOrder}
        />
      )}

      {removeTarget && (
        <RemoveItemModal
          lang={lang} item={removeTarget} confirmText={confirmRemoveText}
          onCancel={() => setRemoveTarget(null)} onConfirm={confirmRemove}
        />
      )}
    </main>
  );
}
