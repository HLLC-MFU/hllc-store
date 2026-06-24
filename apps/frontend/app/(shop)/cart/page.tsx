"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ShoppingCart } from "lucide-react";
import { useCart, type CartItem } from "@/lib/client/cart";
import { useLanguage } from "@/lib/client/language-context";
import { safeParseWithLang, checkoutFormSchema, normalizePhone, normalizeEmail } from "@hllc/shared/validation/schemas-i18n";
import type { Lang } from "@hllc/shared/validation/schemas-i18n";
import { attachPaymentSlip, cancelPublicOrder, createOrder } from "@/lib/modules/orders";
import { fetchStoreProducts } from "@/lib/modules/products/api";
import { fetchShippingSettings, fetchCharmSettings, fetchHomeContent, type ShippingSettings } from "@/lib/modules/settings";
import { calcShippingFee, DEFAULT_SHIPPING_RATES } from "@/lib/config/shipping";
import { isRemoteArea } from "@hllc/shared/data/remote-areas";
import { isIslandArea } from "@hllc/shared/data/island-areas";
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

const MAX_SLIP_BYTES = 2 * 1024 * 1024;

function saveOrderLookup(orderId: string, phone: string) {
  try {
    const existing = JSON.parse(localStorage.getItem("shop-order-ids") ?? "[]") as string[];
    localStorage.setItem("shop-order-ids", JSON.stringify(Array.from(new Set([orderId, ...existing])).slice(0, 20)));
    localStorage.setItem("shop-last-phone", phone);
  } catch { }
}

export default function CartPage() {
  const { items, updateQty, removeItem, clearCart, syncFromProducts } = useCart();
  const { lang, t } = useLanguage();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [blockedProductIds, setBlockedProductIds] = useState<Set<string>>(new Set());
  const selectableItems = useMemo(() => items.filter(i => !blockedProductIds.has(i.productId)), [items, blockedProductIds]);
  const allSelected = useMemo(() => selectableItems.length > 0 && selectableItems.every(i => selectedIds.has(itemKey(i))), [selectableItems, selectedIds]);
  const { selectedItems, selectedTotal, selectedCount, hasOutOfStock, hasBlocked } = useMemo(() => {
    const selected = items.filter(i => selectedIds.has(itemKey(i)));
    const total = selected.reduce((sum, i) => {
      let charm = 0;
      if (i.customName?.startsWith("charm:")) {
        const letters = i.customName.slice(6).split(":")[1] ?? "";
        charm = 30 + Math.max(0, letters.length - 2) * 10;
      }
      return sum + (i.price + charm) * i.quantity;
    }, 0);
    const count = selected.reduce((sum, i) => sum + i.quantity, 0);
    const hasOutOfStock = selected.some(
      (i) => i.stock !== undefined && i.quantity > i.stock,
    );
    const hasBlocked = selected.some((i) => blockedProductIds.has(i.productId));
    return { selectedItems: selected, selectedTotal: total, selectedCount: count, hasOutOfStock, hasBlocked };
  }, [items, selectedIds, blockedProductIds]);

  const [shippingRates, setShippingRates] = useState<ShippingSettings>(DEFAULT_SHIPPING_RATES);
  const [charmImages, setCharmImages] = useState<Record<string, string>>({});
  const [charmOptions, setCharmOptions] = useState<Array<{ label: string; labelEn?: string; imageUrl?: string }>>([]);

  const autoSelected = useRef(false);
  useEffect(() => {
    if (autoSelected.current || items.length === 0) return;
    autoSelected.current = true;
    setSelectedIds(new Set(items.filter(i => !blockedProductIds.has(i.productId)).map(itemKey)));
  }, [items, blockedProductIds]);

  // Deselect blocked items whenever the blocked set updates
  useEffect(() => {
    if (blockedProductIds.size === 0) return;
    setSelectedIds(prev => {
      const next = new Set(prev);
      let changed = false;
      for (const item of items) {
        if (blockedProductIds.has(item.productId)) {
          const key = itemKey(item);
          if (next.has(key)) { next.delete(key); changed = true; }
        }
      }
      return changed ? next : prev;
    });
  }, [blockedProductIds, items]);

  // Refresh cart lines against the latest product data once on open, so admin
  // price/shipping/stock edits apply without removing and re-adding the item.
  const synced = useRef(false);
  useEffect(() => {
    if (synced.current) return;
    synced.current = true;
    Promise.all([fetchStoreProducts(), fetchHomeContent().catch(() => null)]).then(([products, homeContent]) => {
      syncFromProducts(products);
      // Build charm image map from product options (label → imageUrl) for option-based charm products
      const optionImages: Record<string, string> = {};
      const opts: Array<{ label: string; labelEn?: string; imageUrl?: string }> = [];
      for (const p of products) {
        if (p.allowCustomName && p.options) {
          for (const opt of p.options) {
            if (opt.label && opt.imageUrl) optionImages[opt.label] = opt.imageUrl;
            if (opt.label && !opts.find(o => o.label === opt.label)) opts.push({ label: opt.label, labelEn: opt.labelEn, imageUrl: opt.imageUrl });
          }
        }
      }
      setCharmImages(prev => ({ ...prev, ...optionImages }));
      if (opts.length) setCharmOptions(opts);
      // Build blocked product IDs from block status or product.comingSoon
      const blocked = new Set<string>();
      for (const p of products) {
        if (p.comingSoon) { blocked.add(p.id); continue; }
        if (!homeContent) continue;
        let blockId: string | null = null;
        if (p.category === "bottle") blockId = "bottle";
        else if (p.category === "bracelet-charm" && p.group === "secret-set") blockId = "secret-set";
        const status = blockId ? homeContent.blocks[blockId]?.blockStatus : undefined;
        if (status === "comingSoon" || status === "closed") blocked.add(p.id);
      }
      setBlockedProductIds(blocked);
    }).catch(() => { });
    fetchShippingSettings().then(setShippingRates).catch(() => { });
    fetchCharmSettings().then(r => setCharmImages(prev => ({ ...prev, ...(r.images ?? {}) }))).catch(() => { });
  }, [syncFromProducts]);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds(allSelected ? new Set() : new Set(items.filter(i => !blockedProductIds.has(i.productId)).map(itemKey)));
  }, [allSelected, items, blockedProductIds]);

  const toggleSelect = useCallback((item: CartItem) => {
    const key = itemKey(item);
    setSelectedIds(prev => { const next = new Set(prev); if (next.has(key)) { next.delete(key); } else { next.add(key); } return next; });
  }, []);

  const handleCharmEdit = useCallback((item: CartItem) => (oldCustomName: string | undefined, newCustomName: string) => {
    const oldKey = itemKey({ ...item, customName: oldCustomName });
    const newKey = itemKey({ ...item, customName: newCustomName });
    setSelectedIds(prev => {
      if (!prev.has(oldKey)) return prev;
      const next = new Set(prev);
      next.delete(oldKey);
      next.add(newKey);
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
  const [slipError, setSlipError] = useState("");
  const [removeTarget, setRemoveTarget] = useState<CartItem | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const pendingFormRef = useRef<FormData | null>(null);
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>("delivery");
  const [name, setName] = useState(() => { try { return localStorage.getItem("checkout-name") ?? ""; } catch { return ""; } });
  const [email, setEmail] = useState(() => { try { return localStorage.getItem("checkout-email") ?? ""; } catch { return ""; } });
  const [phone, setPhone] = useState(() => { try { return localStorage.getItem("checkout-phone") ?? ""; } catch { return ""; } });
  const [address, setAddress] = useState(() => { try { return localStorage.getItem("checkout-address") ?? ""; } catch { return ""; } });
  const [district, setDistrict] = useState(() => { try { return localStorage.getItem("checkout-district") ?? ""; } catch { return ""; } });
  const [province, setProvince] = useState(() => { try { return localStorage.getItem("checkout-province") ?? ""; } catch { return ""; } });
  const [subDistrict, setSubDistrict] = useState(() => { try { return localStorage.getItem("checkout-subDistrict") ?? ""; } catch { return ""; } });
  const [postalCode, setPostalCode] = useState(() => { try { return localStorage.getItem("checkout-postalCode") ?? ""; } catch { return ""; } });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const clearFieldError = useCallback((...fields: string[]) => {
    setFieldErrors((current) => {
      if (!fields.some((field) => current[field])) return current;
      const next = { ...current };
      fields.forEach((field) => { delete next[field]; });
      return next;
    });
  }, []);

  const selectedShippingLines = useMemo(
    () => selectedItems.map((i) => ({ quantity: i.quantity })),
    [selectedItems],
  );

  const selectedShippingFee = useMemo(() => {
    const island = isIslandArea(postalCode);
    return calcShippingFee(selectedShippingLines, deliveryMode, {
      island,
      remote: !island && isRemoteArea(postalCode),
      rates: shippingRates,
    });
  }, [selectedShippingLines, deliveryMode, postalCode, shippingRates]);
  const selectedPayableTotal = selectedTotal + selectedShippingFee;
  // Cart preview: delivery-rate base from each product's own shipping fee, before
  // any special-area surcharge (which needs the province entered at checkout).
  const baseShippingPreview = useMemo(() => calcShippingFee(selectedShippingLines, "delivery", { rates: shippingRates }), [selectedShippingLines, shippingRates]);

  const confirmRemoveText = useMemo(() => lang === "th" ? "ต้องการลบสินค้านี้ออกจากตะกร้าใช่ไหม?" : "Remove this item from cart?", [lang]);

  const confirmRemove = useCallback(() => {
    if (!removeTarget) return;
    removeItem(removeTarget.productId, removeTarget.selectedOption, removeTarget.customName);
    setRemoveTarget(null);
  }, [removeTarget, removeItem]);

  const decreaseQty = useCallback((item: CartItem) => {
    if (item.quantity <= 1) { setRemoveTarget(item); return; }
    updateQty(item.productId, item.quantity - 1, item.selectedOption, item.customName);
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
      setSlipError(lang === "th" ? "รูปไฟล์ใหญ่เกินไป" : "Image is too large, please keep it under 2 MB");
      event.target.value = "";
      return;
    }
    setSlipError("");
    const reader = new FileReader();
    reader.onload = (e) => {
      const r = String(e.target?.result ?? "");
      if (r.length > 2_900_000) {
        setSlipError(lang === "th" ? "รูปไฟล์ใหญ่เกินไป ขอไม่เกิน 2 MB นะ" : "Image is too large, please keep it under 2 MB");
        return;
      }
      setSlipPreview(r);
      setSlipImage(r);
    };
    reader.readAsDataURL(file);
  }, [lang]);

  const goInfo = useCallback(() => {
    if (!selectedItems.length) { setMessage(lang === "th" ? "กรุณาเลือกสินค้าก่อน" : "Please select items first."); return; }
    setMessage(""); setStep("info");
  }, [selectedItems.length, lang]);

  const confirmPayment = useCallback(() => {
    if (!slipImage) {
      setMessage("");
      setSlipError(lang === "th" ? "กรุณาอัปโหลดสลิปก่อน" : "Please upload a payment slip first.");
      return;
    }
    setMessage(""); setSlipError(""); setShowConfirmModal(true);
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
      province, subDistrict: String(raw.subDistrict ?? "").trim(), postalCode: String(raw.postalCode ?? "").trim(),
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
    setMessage(""); setSlipError(""); setStep("payment");
  }, [loading, items.length, deliveryMode, lang, phone, email, province]);

  const submitOrder = useCallback(async () => {
    if (loading) return;
    const formData = pendingFormRef.current;
    if (!formData || !selectedItems.length) return;
    if (!slipImage) {
      setSlipError(lang === "th" ? "กรุณาอัปโหลดสลิปก่อน" : "Please upload a payment slip first.");
      setShowConfirmModal(false);
      return;
    }
    if (slipImage.length > 2_900_000) {
      setSlipError(lang === "th" ? "รูปไฟล์ใหญ่เกินไป ขอไม่เกิน 2 MB นะ" : "Image is too large, please keep it under 2 MB");
      setShowConfirmModal(false);
      return;
    }
    setShowConfirmModal(false); setLoading(true); setCreatedOrder(null);
    const name = String(formData.get("name") ?? "").trim();
    const rawPhone = String(formData.get("phone") ?? "").replace(/\D/g, "");
    const rawEmail = String(formData.get("email") ?? "").trim().toLowerCase();
    const address = String(formData.get("address") ?? "").trim();
    const district = String(formData.get("district") ?? "").trim();
    const sub = String(formData.get("subDistrict") ?? "").trim();
    const prov = String(formData.get("province") ?? "").trim();
    const postal = String(formData.get("postalCode") ?? "").trim();
    const pickupTime = String(formData.get("pickupTime") ?? "").trim();
    const pickupPlace = shippingRates.pickupLocation || "ร้าน";
    const fullAddress = deliveryMode === "pickup"
      ? `รับเองที่ ${pickupPlace}${pickupTime ? ` เวลา ${pickupTime}` : ""}`
      : [address, sub, district, prov, postal].filter(Boolean).join(" ");
    try {
      const order = await createOrder({
        customer: {
          name, phone: rawPhone, email: rawEmail, address: fullAddress,
          ...(deliveryMode === "delivery" ? { province: prov, district, postalCode: postal } : {}),
        },
        items: selectedItems.map((item) => ({ productId: item.productId, quantity: item.quantity, selectedOption: item.selectedOption || undefined, customName: item.customName || undefined })),
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
    <main className="min-h-screen bg-gray-100">
      <div className="mx-auto max-w-5xl">

        {step === "success" && createdOrder && (
          <ReceiptView lang={lang} createdOrder={createdOrder} receiptItems={receiptItems} />
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
            <Link href="/home" className="mt-2 bg-brand hover:bg-brand-hover text-white font-black text-sm px-6 py-3 rounded-2xl transition-all active:scale-95 shadow-md shadow-brand/20">
              {lang === "th" ? "ไปเลือกสินค้า" : "Start shopping"}
            </Link>
          </div>
        )}

        {step === "cart" && !!items.length && (
          <>
            {/* Item list */}
            <section className="px-4 pt-4 pb-28 space-y-3">
              <div className="space-y-3">
                {items.map((item) => (
                  <SwipeableCartItem
                    key={itemKey(item)} item={item} lang={lang}
                    selected={selectedIds.has(itemKey(item))} onSelect={toggleSelect}
                    onDecrease={decreaseQty} onIncrease={(i) => { const total = items.filter((c) => c.productId === i.productId).reduce((s, c) => s + c.quantity, 0); if (i.stock === undefined || total < i.stock) updateQty(i.productId, i.quantity + 1, i.selectedOption, i.customName); }}
                    onRemove={(i) => removeItem(i.productId, i.selectedOption, i.customName)}
                    onCharmEdit={handleCharmEdit(item)}
                    charmImages={charmImages}
                    charmOptions={charmOptions}
                    isBlocked={blockedProductIds.has(item.productId)}
                  />
                ))}
              </div>

              <CartSummaryPanel
                lang={lang}
                allSelected={allSelected} onToggleSelectAll={toggleSelectAll}
                selectedCount={selectedCount} selectedTotal={selectedTotal}
                baseShipping={baseShippingPreview}
                onPay={goInfo} items={items}
                disabledReason={hasBlocked ? (lang === "th" ? "ไม่เปิดขาย" : "Unavailable") : hasOutOfStock ? (lang === "th" ? "สต็อกไม่พอ" : "Stock exceeded") : selectedCount === 0 ? (lang === "th" ? "เลือกสินค้าก่อน" : "Select items") : undefined}
              />
            </section>
          </>
        )}

        {step === "payment" && (
          <PaymentStep
            lang={lang} t={t}
            selectedPayableTotal={selectedPayableTotal} selectedShippingFee={selectedShippingFee}
            slipPreview={slipPreview} slipError={slipError} orderError={message}
            onSlipFile={handleSlipFile}
            onClearSlip={() => { setSlipPreview(""); setSlipImage(""); setSlipError(""); }}
            onBack={() => setStep("info")} onContinue={confirmPayment}
          />
        )}

        {step === "info" && (
          <InfoStep
            lang={lang} t={t} deliveryMode={deliveryMode} setDeliveryMode={(v) => { setDeliveryMode(v); setFieldErrors({}); }}
            name={name} setName={(v) => { setName(v); clearFieldError("name"); try { localStorage.setItem("checkout-name", v); } catch { } }}
            phone={phone} setPhone={(v) => { setPhone(v); clearFieldError("phone"); try { localStorage.setItem("checkout-phone", v); } catch { } }}
            email={email} setEmail={(v) => { setEmail(v); clearFieldError("email"); try { localStorage.setItem("checkout-email", v); } catch { } }}
            address={address} setAddress={(v) => { setAddress(v); clearFieldError("address"); try { localStorage.setItem("checkout-address", v); } catch { } }}
            district={district} setDistrict={(v) => { setDistrict(v); clearFieldError("district"); try { localStorage.setItem("checkout-district", v); } catch { } }}
            province={province} setProvince={(v) => { setProvince(v); clearFieldError("province"); try { localStorage.setItem("checkout-province", v); } catch { } }}
            subDistrict={subDistrict} setSubDistrict={(v) => { setSubDistrict(v); clearFieldError("subDistrict"); try { localStorage.setItem("checkout-subDistrict", v); } catch { } }}
            postalCode={postalCode} setPostalCode={(v) => { setPostalCode(v); clearFieldError("postalCode"); try { localStorage.setItem("checkout-postalCode", v); } catch { } }}
            fieldErrors={fieldErrors} loading={loading}
            selectedCount={selectedCount} selectedTotal={selectedTotal}
            selectedShippingFee={selectedShippingFee} selectedPayableTotal={selectedPayableTotal}
            selectedItems={selectedItems}
            itemsLength={items.length} onBack={() => setStep("cart")} onSubmit={handleCheckout}
            pickupLocation={shippingRates.pickupLocation}
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
