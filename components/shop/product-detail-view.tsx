"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, useCallback, useMemo, type RefObject } from "react";
import { ChevronLeft, ChevronRight, ShoppingCart, Plus, AlertCircle, Pencil } from "lucide-react";
import { useCart } from "@/lib/client/cart";
import { useCartFly } from "@/lib/client/cart-fly";
import { vibrateTap } from "@/lib/client/haptics";
import { useLanguage } from "@/lib/client/language-context";

export type LocalizedText = {
  th: string;
  en?: string;
};

export type ProductOption = {
  label: string;
  imageUrl?: string;
  stock?: number;
};

export type ProductDetailProduct = {
  id: string;
  name: LocalizedText;
  description?: LocalizedText;
  price: number;
  stock: number;
  options?: ProductOption[];
  allowCustomName?: boolean;
  customNameMaxLength?: number;
  imageUrls?: string[];
  shippingFirstItem?: number;
  shippingAdditionalItem?: number;
  remoteShippingFirstItem?: number;
  remoteShippingAdditionalItem?: number;
  islandShippingFirstItem?: number;
  islandShippingAdditionalItem?: number;
};

const currencyFormatter = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  maximumFractionDigits: 0,
});

function money(value: number) {
  return currencyFormatter.format(value);
}

export function ProductDetailView({ product }: { product: ProductDetailProduct }) {
  const router = useRouter();
  const { addItem, items } = useCart();
  const { flyToCart } = useCartFly();
  const { lang } = useLanguage();
  const addBtnRef = useRef<HTMLButtonElement>(null);

  const images = product.imageUrls ?? [];
  const options = product.options ?? [];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedOptionLabel, setSelectedOptionLabel] = useState("");
  const [expanded, setExpanded] = useState(false);
  const customNameMax = product.customNameMaxLength && product.customNameMaxLength > 0 ? product.customNameMaxLength : 12;
  const [customNameOpen, setCustomNameOpen] = useState(false);
  const [customName, setCustomName] = useState("");
  const [toast, setToast] = useState<{ kind: "added" | "alert"; text: string } | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(null);

  const selectedOption = options.find((option) => option.label === selectedOptionLabel);
  const selectedOptionStock = selectedOption ? (selectedOption.stock ?? product.stock) : product.stock;
  const displayImages = selectedOption?.imageUrl
    ? [selectedOption.imageUrl, ...images.filter((src) => src !== selectedOption.imageUrl)]
    : images;
  const outOfStock = options.length > 0
    ? options.every((option) => (option.stock ?? product.stock) < 1)
    : product.stock < 1;
  const selectedOptionOutOfStock = Boolean(selectedOption && selectedOptionStock < 1);
  const mustSelectOption = options.length > 0 && !selectedOption;

  const showToast = useCallback((kind: "added" | "alert", text: string) => {
    setToast({ kind, text });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2000);
  }, []);

  // How many of this product/option are already in the cart.
  const trimmedCustomName = customName.trim();
  const cartQty = useMemo(
    () => items
      .filter(
        (i) =>
          i.productId === product.id &&
          (i.selectedOption ?? "") === (selectedOption?.label ?? "") &&
          (i.customName ?? "") === (product.allowCustomName ? trimmedCustomName : ""),
      )
      .reduce((sum, i) => sum + i.quantity, 0),
    [items, product.id, selectedOption, product.allowCustomName, trimmedCustomName],
  );

  function handleAddToCart(sourceEl?: HTMLElement | null) {
    vibrateTap();
    if (mustSelectOption) {
      showToast("alert", lang === "th" ? "กรุณาเลือกตัวเลือกสินค้าก่อน" : "Please choose an option first");
      return false;
    }
    if (selectedOptionOutOfStock || outOfStock) {
      showToast("alert", lang === "th" ? "สินค้าหมดแล้ว" : "Out of stock");
      return false;
    }

    const remaining = selectedOptionStock - cartQty;
    if (remaining <= 0) {
      showToast("alert", lang === "th"
        ? `เพิ่มไม่ได้แล้ว มีในสต็อกสูงสุด ${selectedOptionStock} ชิ้น`
        : `Can't add more — only ${selectedOptionStock} in stock`);
      return false;
    }

    const addCount = Math.min(quantity, remaining);
    for (let i = 0; i < addCount; i++) {
      addItem({
        productId: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        stock: selectedOptionStock,
        shippingFirstItem: product.shippingFirstItem ?? 0,
        shippingAdditionalItem: product.shippingAdditionalItem ?? 0,
        remoteShippingFirstItem: product.remoteShippingFirstItem ?? 0,
        remoteShippingAdditionalItem: product.remoteShippingAdditionalItem ?? 0,
        islandShippingFirstItem: product.islandShippingFirstItem ?? 0,
        islandShippingAdditionalItem: product.islandShippingAdditionalItem ?? 0,
        imageUrl: displayImages[0] ?? "",
        selectedOption: selectedOption?.label ?? "",
        customName: product.allowCustomName ? trimmedCustomName : undefined,
      });
    }
    const flySource = sourceEl ?? addBtnRef.current;
    if (flySource) flyToCart(flySource, displayImages[0]);
    showToast("added", lang === "th"
      ? `เพิ่มลงตะกร้าแล้ว ${addCount} ชิ้น`
      : `Added ${addCount} item${addCount > 1 ? "s" : ""} to cart`);
    return true;
  }

  function handleBuyNow() {
    if (!handleAddToCart()) return;
    router.push("/cart?selectAll=1");
  }

  function scrollTo(index: number, ref: RefObject<HTMLDivElement | null>) {
    if (!ref.current) return;
    ref.current.scrollTo({ left: index * ref.current.clientWidth, behavior: "smooth" });
    setCurrentIndex(index);
  }

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const index = Math.round(container.scrollLeft / container.clientWidth);
    if (index !== currentIndex && index >= 0 && index < displayImages.length) {
      setCurrentIndex(index);
    }
  };

  function selectOption(label: string) {
    const nextOption = options.find((option) => option.label === label);
    const nextStock = nextOption ? (nextOption.stock ?? product.stock) : product.stock;
    if (nextStock < 1) return;

    setSelectedOptionLabel(label);
    setQuantity((current) => Math.min(current, nextStock));
    setCurrentIndex(0);
    scrollContainerRef.current?.scrollTo({ left: 0, behavior: "smooth" });
  }

  const descriptionText = product.description
    ? product.description[lang] || product.description.th
    : "";

  return (
    <div className="min-h-screen bg-white animate-in fade-in slide-in-from-bottom-3 duration-300">
      {/* Toast */}
      <div className={`fixed inset-0 z-50 flex items-center justify-center pointer-events-none transition-opacity duration-300 ${toast ? "opacity-100" : "opacity-0"}`}>
        <div className="flex items-center gap-3 bg-gray-900/90 text-white px-6 py-4 rounded-2xl shadow-xl">
          {toast?.kind === "alert"
            ? <AlertCircle className="h-5 w-5 text-amber-400 shrink-0" />
            : <ShoppingCart className="h-5 w-5 text-green-400 shrink-0" />}
          <span className="text-sm font-semibold">{toast?.text}</span>
        </div>
      </div>

      {/* Layout: 1 col mobile, 2 col desktop */}
      <div className="mx-auto max-w-6xl px-4 py-6 lg:grid lg:grid-cols-[1fr_420px] lg:gap-12 lg:items-start pb-28 lg:pb-10">

      {/* Image Card */}
      <div className="rounded-2xl bg-gray-100 overflow-hidden lg:sticky lg:top-6">
        {displayImages.length > 0 ? (
          <div className="relative aspect-square">
            <div
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="w-full h-full flex overflow-x-auto snap-x snap-mandatory scroll-smooth scrollbar-none"
            >
              {displayImages.map((src, i) => (
                <div
                  key={i}
                  className="w-full h-full shrink-0 snap-center flex items-center justify-center"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt={`${product.name[lang] || product.name.th} ${i + 1}`}
                    className="w-full h-full object-contain"
                  />
                </div>
              ))}
            </div>
            {displayImages.length > 1 && (
              <>
                {/* Prev */}
                {currentIndex > 0 && (
                  <button
                    type="button"
                    onClick={() => scrollTo(currentIndex - 1, scrollContainerRef)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm shadow-md flex items-center justify-center text-gray-700 hover:bg-white active:scale-90 transition-all"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}
                {/* Next */}
                {currentIndex < displayImages.length - 1 && (
                  <button
                    type="button"
                    onClick={() => scrollTo(currentIndex + 1, scrollContainerRef)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm shadow-md flex items-center justify-center text-gray-700 hover:bg-white active:scale-90 transition-all"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                )}
                {/* Dots */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                  {displayImages.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => scrollTo(i, scrollContainerRef)}
                      className={`rounded-full transition-all ${i === currentIndex ? "w-4 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/50"}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="aspect-square bg-gray-100" />
        )}
      </div>

      {/* Info section */}
      <div className="pt-4 lg:pt-0 flex flex-col gap-3">

        {/* Card: Name + Price */}
        <div className="bg-gray-50 rounded-2xl px-4 py-4 border border-gray-100 flex items-center justify-between gap-3">
          <h1 className="flex-1 min-w-0 text-base font-bold text-gray-900 leading-snug">
            {product.name[lang] || product.name.th}
          </h1>
          <p className="shrink-0 text-lg font-black text-[#85241F]">
            {money(product.price)}
          </p>
        </div>

        {options.length > 0 && (
          <div className="bg-gray-50 rounded-2xl px-4 py-4 border border-gray-100">
            <p className="mb-3 text-sm font-bold text-gray-900">
              {lang === "th" ? "ตัวเลือกสินค้า" : "Options"}
            </p>
            {mustSelectOption ? (
              <p className="mb-3 text-xs font-bold text-[#85241F]">
                {lang === "th" ? "กรุณาเลือกก่อนสั่งซื้อ" : "Please choose before checkout"}
              </p>
            ) : null}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {options.map((option) => {
                const selected = option.label === selectedOptionLabel;
                const optionStock = option.stock ?? product.stock;
                const optionOutOfStock = optionStock < 1;

                return (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => selectOption(option.label)}
                    disabled={optionOutOfStock}
                    className={`flex h-16 min-w-0 items-center gap-2 rounded-xl border px-2 text-left transition-all ${
                      selected
                        ? "border-[#85241F] bg-white text-[#85241F] shadow-sm ring-2 ring-[#85241F]/10"
                        : optionOutOfStock
                          ? "cursor-not-allowed border-gray-100 bg-gray-100 text-gray-300 opacity-70"
                          : "border-gray-200 bg-white text-gray-700 hover:border-[#85241F]/30"
                    }`}
                  >
                    {option.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={option.imageUrl} alt={option.label} className="h-11 w-11 shrink-0 rounded-lg object-cover" />
                    ) : (
                      <span className="h-11 w-11 shrink-0 rounded-lg bg-gray-100" />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-black">{option.label}</span>
                      <span className={`mt-0.5 block truncate text-[10px] font-bold ${optionOutOfStock ? "text-red-400" : "text-gray-400"}`}>
                        {optionOutOfStock
                          ? (lang === "th" ? "สินค้าหมด" : "Out of stock")
                          : (lang === "th" ? `เหลือ ${optionStock}` : `${optionStock} left`)}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Card: Custom name sticker */}
        {product.allowCustomName && (
          <>
            <div className="bg-gray-50 rounded-2xl px-4 py-4 border border-gray-100">
              <button
                type="button"
                onClick={() => setCustomNameOpen(true)}
                className="flex w-full items-center justify-between gap-2 rounded-2xl border border-[#85241F]/30 bg-white px-4 py-3 text-sm font-black text-[#85241F] transition-colors hover:bg-[#fce8e7] active:scale-[0.98]"
              >
                <span className="flex items-center gap-2">
                  <Pencil className="h-4 w-4" />
                  {lang === "th" ? "ชื่อบนสติกเกอร์" : "Name on sticker"}
                </span>
                {customName.trim() ? (
                  <span className="max-w-[140px] truncate rounded-lg bg-[#85241F]/10 px-2 py-0.5 text-xs font-bold text-[#85241F]">
                    {customName.trim()}
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-gray-400">
                    {lang === "th" ? "แตะเพื่อใส่ชื่อ" : "Tap to add"}
                  </span>
                )}
              </button>
            </div>

            {/* Modal */}
            {customNameOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-5">
                <div className="absolute inset-0 bg-black/45 backdrop-blur-[3px]" onClick={() => setCustomNameOpen(false)} />
                <div className="relative w-full max-w-sm rounded-[2rem] bg-white px-5 pb-5 pt-6 shadow-2xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-200">
                  <div className="mb-6 px-10 text-center">
                    <span className="text-xl font-black text-gray-950">
                      {lang === "th" ? "ชื่อบนสติกเกอร์" : "Name on sticker"}
                    </span>
                    <p className="mt-1 text-xs font-semibold text-gray-400">
                      {lang === "th" ? "ใส่ชื่อที่ต้องการพิมพ์บนสติกเกอร์" : "Enter the name for your sticker"}
                    </p>
                    <button
                      type="button"
                      onClick={() => setCustomNameOpen(false)}
                      className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-[0px] text-gray-500 transition-colors before:text-base before:font-semibold before:content-['x'] hover:bg-gray-200"
                      aria-label={lang === "th" ? "ปิด" : "Close"}
                    >
                      ✕
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      autoFocus
                      value={customName}
                      maxLength={customNameMax}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder={lang === "th" ? `เช่น สมชาย, หมูกรอบ` : `e.g. John, Lily`}
                      className="h-14 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 pr-14 text-base font-semibold text-gray-900 outline-none transition-all focus:border-[#85241F] focus:bg-white focus:ring-4 focus:ring-[#85241F]/10"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                      {customName.length}/{customNameMax}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCustomNameOpen(false)}
                    className="mt-4 flex h-12 w-full items-center justify-center rounded-2xl bg-[#85241F] text-sm font-black text-white shadow-lg shadow-[#85241F]/15 transition-transform active:scale-[0.98]"
                  >
                    {lang === "th" ? "ยืนยัน" : "Confirm"}
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Card: Quantity */}
        <div className="bg-gray-50 rounded-2xl px-4 py-4 border border-gray-100 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700">
            {lang === "th" ? "จำนวน" : "Quantity"}
          </span>
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors text-lg leading-none"
            >
              −
            </button>
            <span className="w-4 text-center text-base font-bold text-gray-900">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(selectedOptionStock, q + 1))}
              disabled={mustSelectOption || selectedOptionOutOfStock || quantity >= selectedOptionStock}
              className="w-8 h-8 rounded-full bg-[#85241F] flex items-center justify-center text-white hover:bg-[#6b1c18] transition-colors text-lg leading-none disabled:bg-gray-200 disabled:text-gray-400"
            >
              +
            </button>
          </div>
        </div>

        {/* Card: Description */}
        {descriptionText && (
          <div className="bg-gray-50 rounded-2xl px-4 py-4 border border-gray-100">
            <p className="text-sm font-bold text-gray-900 mb-2">
              {lang === "th" ? "รายละเอียด" : "Description"}
            </p>
            <p className="text-sm leading-relaxed text-gray-500">
              {expanded ? descriptionText : descriptionText.slice(0, 120)}
              {!expanded && descriptionText.length > 120 && (
                <>
                  {"... "}
                  <button
                    type="button"
                    onClick={() => setExpanded(true)}
                    className="text-[#85241F] font-semibold hover:underline"
                  >
                    {lang === "th" ? "อ่านเพิ่มเติม" : "Learn More"}
                  </button>
                </>
              )}
            </p>
          </div>
        )}

        {/* Action bar — desktop only (mobile uses fixed bar below) */}
        <div className="mt-2 hidden lg:block">
          {outOfStock ? (
            <div className="w-full py-3.5 rounded-2xl bg-gray-100 text-center text-sm font-bold text-gray-400">
              {lang === "th" ? "สินค้าหมด" : "Out of Stock"}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex flex-col justify-center shrink-0">
                <span className="text-xs text-gray-400 font-medium">{lang === "th" ? "ราคารวม" : "Total"}</span>
                <span className="text-base font-black text-[#85241F] leading-tight">{money(product.price * quantity)}</span>
              </div>
              <div className="w-px h-8 bg-gray-200 shrink-0" />
              <button
                ref={addBtnRef}
                type="button"
                onClick={(e) => handleAddToCart(e.currentTarget)}
                disabled={mustSelectOption || selectedOptionOutOfStock}
                className="flex items-center justify-center w-11 h-11 rounded-2xl bg-[#fce8e7] text-[#85241F] active:scale-95 transition-transform shrink-0 disabled:opacity-45 disabled:active:scale-100"
              >
                <span className="relative">
                  <ShoppingCart className="h-5 w-5" />
                  <Plus className="absolute -top-1.5 -right-1.5 h-3 w-3 stroke-3" />
                </span>
              </button>
              <button
                type="button"
                onClick={handleBuyNow}
                disabled={mustSelectOption || selectedOptionOutOfStock}
                className="flex-1 flex items-center justify-center rounded-2xl bg-[#85241F] h-11 text-sm font-bold text-white active:scale-95 transition-transform disabled:bg-gray-300 disabled:text-gray-500 disabled:active:scale-100"
              >
                {lang === "th" ? "ซื้อเลย" : "Buy Now"}
              </button>
            </div>
          )}
        </div>
      </div>

      </div>{/* end grid */}

      {/* Fixed bottom bar — mobile only */}
      <div className="lg:hidden fixed inset-x-0 bottom-0 z-20 bg-white border-t border-gray-100 px-4 py-3">
        {outOfStock ? (
          <div className="w-full py-3.5 rounded-2xl bg-gray-100 text-center text-sm font-bold text-gray-400">
            {lang === "th" ? "สินค้าหมด" : "Out of Stock"}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="flex flex-col justify-center shrink-0">
              <span className="text-xs text-gray-400 font-medium">{lang === "th" ? "ราคารวม" : "Total"}</span>
              <span className="text-base font-black text-[#85241F] leading-tight">{money(product.price * quantity)}</span>
            </div>
            <div className="w-px h-8 bg-gray-200 shrink-0" />
            <button
              type="button"
              onClick={(e) => handleAddToCart(e.currentTarget)}
              disabled={mustSelectOption || selectedOptionOutOfStock}
              className="flex items-center justify-center w-11 h-11 rounded-2xl bg-[#fce8e7] text-[#85241F] active:scale-95 transition-transform shrink-0 disabled:opacity-45 disabled:active:scale-100"
            >
              <span className="relative">
                <ShoppingCart className="h-5 w-5" />
                <Plus className="absolute -top-1.5 -right-1.5 h-3 w-3 stroke-3" />
              </span>
            </button>
            <button
              type="button"
              onClick={handleBuyNow}
              disabled={mustSelectOption || selectedOptionOutOfStock}
              className="flex-1 flex items-center justify-center rounded-2xl bg-[#85241F] h-11 text-sm font-bold text-white active:scale-95 transition-transform disabled:bg-gray-300 disabled:text-gray-500 disabled:active:scale-100"
            >
              {lang === "th" ? "ซื้อเลย" : "Buy Now"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
