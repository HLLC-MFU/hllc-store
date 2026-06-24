"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useRef, useCallback, useMemo, useEffect, type RefObject } from "react";
import { ChevronLeft, ChevronRight, ShoppingCart, Plus, AlertCircle, X, Delete } from "lucide-react";
import { useCart } from "@/lib/client/cart";
import { useCartFly } from "@/lib/client/cart-fly";
import { vibrateTap } from "@/lib/client/haptics";
import { useLanguage } from "@/lib/client/language-context";
import { ShopFooter } from "@/components/shop/shop-footer";

export type LocalizedText = {
  th: string;
  en?: string;
};

export type ProductOption = {
  label: string;
  labelEn?: string;
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
  charmImages?: Record<string, string>;
  comingSoon?: boolean;
};

const currencyFormatter = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  maximumFractionDigits: 0,
});

function money(value: number) {
  return currencyFormatter.format(value);
}

type CharmColorId = string;

const CHARM_PRICE = 30;
const FREE_LETTERS = 2;
const LETTER_PRICE = 10;
const MAX_LETTERS = 9;
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export function ProductDetailView({ product }: { product: ProductDetailProduct }) {
  const router = useRouter();
  const { addItem, items } = useCart();
  const { flyToCart } = useCartFly();
  const { lang, t } = useLanguage();
  const addBtnRef = useRef<HTMLButtonElement>(null);

  const images = product.imageUrls ?? [];
  const options = product.options ?? [];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedOptionLabel, setSelectedOptionLabel] = useState("");
  const [charmOpen, setCharmOpen] = useState(false);
  const [charmStep, setCharmStep] = useState<"color" | "letters">("color");
  const [charmColor, setCharmColor] = useState<CharmColorId | "">("");
  const [charmLetters, setCharmLetters] = useState<string[]>([]);
  const [charmPrompt, setCharmPrompt] = useState<"cart" | "buy" | null>(null);
  const pendingSourceEl = useRef<HTMLElement | null>(null);
  const pendingAction = useRef<{ type: "cart" | "buy"; sourceEl: HTMLElement | null } | null>(null);
  const [tempColor, setTempColor] = useState<CharmColorId | "">("");
  const [tempLetters, setTempLetters] = useState<string[]>([]);
  const [toast, setToast] = useState<{ kind: "added" | "alert"; text: string } | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(null);

  const selectedOption = options.find((option) => option.label === selectedOptionLabel);
  const selectedOptionStock = selectedOption ? (selectedOption.stock ?? product.stock) : product.stock;
  const displayImages = selectedOption?.imageUrl
    ? [selectedOption.imageUrl, ...images.filter((src) => src !== selectedOption.imageUrl)]
    : images;
  const outOfStock = !product.comingSoon && (options.length > 0
    ? options.every((option) => (option.stock ?? product.stock) < 1)
    : product.stock < 1);
  const selectedOptionOutOfStock = Boolean(selectedOption && selectedOptionStock < 1);
  const mustSelectOption = false;

  const showToast = useCallback((kind: "added" | "alert", text: string) => {
    setToast({ kind, text });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2000);
  }, []);

  // Charm add-on derived values
  const charmExtraLetters = Math.max(0, charmLetters.length - FREE_LETTERS);
  const charmAddon = charmColor ? CHARM_PRICE + charmExtraLetters * LETTER_PRICE : 0;
  const unitPrice = product.price + charmAddon;
  const charmCustomName = charmColor ? `charm:${charmColor}:${charmLetters.join("")}` : undefined;
  const tempExtraLetters = Math.max(0, tempLetters.length - FREE_LETTERS);
  const tempCharmAddon = tempColor ? CHARM_PRICE + tempExtraLetters * LETTER_PRICE : 0;
  const charmOptions = product.options ?? [];
  const selectedCharmOption = charmOptions.find((o) => o.label === charmColor);
  const tempCharmOption = charmOptions.find((o) => o.label === tempColor);

  // Cycle through charm images in the "add" button when no charm is selected
  const charmImageValues = charmOptions.map((o) => o.imageUrl).filter(Boolean) as string[];
  const [cycleIdx, setCycleIdx] = useState(0);
  useEffect(() => {
    if (charmImageValues.length < 2 || charmColor) return;
    const id = setInterval(() => setCycleIdx((i) => (i + 1) % charmImageValues.length), 2200);
    return () => clearInterval(id);
  }, [charmImageValues.length, charmColor]);

  function openCharmModal() {
    setTempColor(charmColor);
    setTempLetters([...charmLetters]);
    setCharmStep(charmColor ? "letters" : "color");
    setCharmOpen(true);
  }
  function cancelCharmModal() {
    setCharmOpen(false);
    pendingAction.current = null;
  }
  function confirmCharm() {
    if (tempLetters.length < 2) return;
    setCharmColor(tempColor);
    setCharmLetters([...tempLetters]);
    setCharmOpen(false);
    // pendingAction is handled by useEffect below after state settles
  }
  function removeCharm() {
    setCharmColor("");
    setCharmLetters([]);
  }

  // After charm is confirmed, trigger any pending cart/buy action
  useEffect(() => {
    if (!pendingAction.current || !charmColor) return;
    const action = pendingAction.current;
    pendingAction.current = null;
    handleAddToCart(action.sourceEl ?? undefined, true);
    if (action.type === "buy") router.push("/cart?selectAll=1");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [charmColor]);

  // How many of this product/option are already in the cart.
  const cartQty = useMemo(
    () => items
      .filter(
        (i) =>
          i.productId === product.id &&
          (i.selectedOption ?? "") === (selectedOption?.label ?? ""),
      )
      .reduce((sum, i) => sum + i.quantity, 0),
    [items, product.id, selectedOption],
  );

  function handleAddToCart(sourceEl?: HTMLElement | null, skipCharmPrompt = false): boolean {
    vibrateTap();
    if (mustSelectOption) {
      showToast("alert", t("product.select_option_first"));
      return false;
    }
    if (selectedOptionOutOfStock || outOfStock) {
      showToast("alert", t("product.out_of_stock_toast"));
      return false;
    }

    const remaining = selectedOptionStock - cartQty;
    if (remaining <= 0) {
      showToast("alert", t("product.stock_limit", { stock: selectedOptionStock }));
      return false;
    }

    if (!skipCharmPrompt && product.allowCustomName && !charmColor) {
      pendingSourceEl.current = sourceEl ?? addBtnRef.current;
      setCharmPrompt("cart");
      return false;
    }

    const addCount = Math.min(quantity, remaining);
    for (let i = 0; i < addCount; i++) {
      addItem({
        productId: product.id,
        name: product.name,
        description: product.description,
        price: unitPrice,
        stock: selectedOptionStock,
        imageUrl: displayImages[0] ?? "",
        selectedOption: selectedOption?.label ?? "",
        customName: product.allowCustomName ? charmCustomName : undefined,
        allowCustomName: product.allowCustomName,
      });
    }
    const flySource = sourceEl ?? addBtnRef.current;
    if (flySource) flyToCart(flySource, displayImages[0]);
    showToast("added", t("product.added_to_cart", { count: addCount }));
    return true;
  }

  function handleBuyNow() {
    vibrateTap();
    if (mustSelectOption) {
      showToast("alert", t("product.select_option_first"));
      return;
    }
    if (selectedOptionOutOfStock || outOfStock) {
      showToast("alert", t("product.out_of_stock_toast"));
      return;
    }
    if (product.allowCustomName && !charmColor) {
      setCharmPrompt("buy");
      return;
    }
    if (!handleAddToCart(undefined, true)) return;
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
    <>
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

      {/* Back button — desktop only */}
      <div className="px-4 md:px-6 pt-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="hidden md:flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-gray-700 transition-colors mb-4 -ml-1 cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" />
          {t("nav.back")}
        </button>
      </div>

      {/* Layout: 1 col mobile, 2 col desktop */}
      <div className="mx-auto max-w-6xl px-4 pb-28 lg:pb-10 lg:grid lg:grid-cols-[1fr_420px] lg:gap-12 lg:items-start">

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
                  className="relative w-full h-full shrink-0 snap-center"
                >
                  <Image
                    fill
                    src={src}
                    alt={`${product.name[lang] || product.name.th} ${i + 1}`}
                    className="object-contain"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    priority={i === 0}
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
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center text-gray-600 hover:bg-gray-50 active:scale-90 transition-all"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}
                {/* Next */}
                {currentIndex < displayImages.length - 1 && (
                  <button
                    type="button"
                    onClick={() => scrollTo(currentIndex + 1, scrollContainerRef)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center text-gray-600 hover:bg-gray-50 active:scale-90 transition-all"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                )}
                {/* Dots */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/30 backdrop-blur-sm rounded-full px-2 py-1">
                  {displayImages.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => scrollTo(i, scrollContainerRef)}
                      className={`rounded-full transition-all ${i === currentIndex ? "w-4 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/60"}`}
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

        {/* Unified info card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

          {/* Name + Price */}
          <div className="flex items-start justify-between gap-3 px-4 py-4">
            <h1 className="flex-1 min-w-0 text-xl font-black text-gray-900 leading-snug">
              {product.name[lang] || product.name.th}
              <span className="ml-1.5 text-brand">✦</span>
            </h1>
            <span className="shrink-0 bg-brand text-white text-sm font-black px-3 py-1 rounded-full whitespace-nowrap">
              {money(product.price)}
            </span>
          </div>

          {/* Description */}
          {descriptionText && (
            <>
              <div className="border-t border-gray-100" />
              <div className="px-4 py-4">
                <p className="text-sm font-bold text-gray-900 mb-3">{t("product.details")}</p>
                <ul className="space-y-1.5">
                  {descriptionText.split("\n").filter((line) => line.trim()).map((line, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-500 leading-relaxed">
                      <span className="text-brand shrink-0 mt-0.5">•</span>
                      <span>{line.replace(/^[•\-*]\s*/, "")}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}


          {/* Charm add-on */}
          {product.allowCustomName && (
            <>
              <div className="border-t border-gray-100" />
              {charmColor && selectedCharmOption ? (
                <div className="flex items-center gap-3 px-4 py-3.5">
                  <div className="h-9 w-9 shrink-0 rounded-xl overflow-hidden border border-gray-200 shadow-sm flex items-center justify-center">
                    {selectedCharmOption.imageUrl ? (
                      <Image src={selectedCharmOption.imageUrl} alt={selectedCharmOption.labelEn || selectedCharmOption.label} width={36} height={36} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-gray-200" />
                    )}
                  </div>
                  <button type="button" onClick={openCharmModal} className="flex-1 min-w-0 text-left">
                    <p className="text-[11px] font-black text-gray-900">
                      {t("charm.keychain")} — {lang === "en" && selectedCharmOption.labelEn ? selectedCharmOption.labelEn : selectedCharmOption.label}
                    </p>
                    {charmLetters.length > 0 ? (
                      <p className="mt-0.5 text-[11px] font-black tracking-widest text-brand">
                        {charmLetters.join(" ")}
                      </p>
                    ) : (
                      <p className="mt-0.5 text-[10px] font-semibold text-gray-400">
                        {t("charm.tap_add_letters")}
                      </p>
                    )}
                  </button>
                  <span className="shrink-0 text-sm font-black text-brand">+{charmAddon}฿</span>
                  <button
                    type="button"
                    onClick={removeCharm}
                    className="shrink-0 flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 hover:border-red-200 hover:bg-red-100 hover:text-red-500 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div className="px-4 py-3">
                  <button
                    type="button"
                    onClick={openCharmModal}
                    className="flex w-full items-center gap-3 px-3 py-3 rounded-2xl bg-[#fdf3f3] border border-brand/20 hover:bg-brand-tint hover:border-brand/40 active:scale-[0.98] transition-all duration-150 cursor-pointer"
                  >
                    <div className="relative h-11 w-11 shrink-0">
                      <div className="h-full w-full rounded-xl overflow-hidden border border-brand/20 bg-white flex items-center justify-center shadow-sm">
                        {charmImageValues[cycleIdx] ? (
                          <Image key={cycleIdx} src={charmImageValues[cycleIdx]} alt="keychain" width={44} height={44} className="h-full w-full object-cover animate-in fade-in duration-700" />
                        ) : (
                          <Plus className="h-4 w-4 text-brand" />
                        )}
                      </div>
                      <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-brand flex items-center justify-center shadow-sm">
                        <Plus className="h-2.5 w-2.5 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-black text-brand">
                        {t("charm.add_keychain")}
                      </p>
                      <p className="text-[10px] font-semibold text-brand/60">
                        {t("charm.pick_color_letters")}
                      </p>
                    </div>
                    <span className="text-xs font-black text-white bg-brand px-3 py-1.5 rounded-xl shadow-sm shadow-brand/30">+{CHARM_PRICE}฿</span>
                  </button>
                </div>
              )}
            </>
          )}

          {/* Product Options — shown for non-charm products that have variants */}
          {!product.allowCustomName && options.length > 0 && (
            <>
              <div className="border-t border-gray-100" />
              <div className="px-4 py-4">
                <p className="mb-3 text-sm font-bold text-gray-900">
                  {lang === "th" ? "เลือกตัวเลือก" : "Select option"}
                </p>
                <div className="flex flex-wrap gap-2">
                  {options.map((option) => {
                    const stock = option.stock ?? product.stock;
                    const soldOut = stock < 1;
                    const selected = selectedOptionLabel === option.label;
                    return (
                      <button
                        key={option.label}
                        type="button"
                        disabled={soldOut}
                        onClick={() => selectOption(option.label)}
                        className={`flex h-9 items-center justify-center rounded-2xl border-2 px-4 text-sm font-black transition-all ${
                          selected
                            ? "border-brand bg-brand-tint text-brand"
                            : soldOut
                            ? "cursor-not-allowed border-gray-100 bg-gray-50 text-gray-300"
                            : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                        }`}
                      >
                        {option.label}
                        {soldOut && <span className="ml-1 text-[9px]">({lang === "th" ? "หมด" : "OOS"})</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* Quantity */}
          <div className="border-t border-gray-100 flex items-center justify-between px-4 py-4">
            <span className="text-sm font-semibold text-gray-700">
              {t("product.quantity")}
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
                onClick={() => setQuantity((q) => Math.min(Math.max(0, selectedOptionStock - cartQty), q + 1))}
                disabled={mustSelectOption || selectedOptionOutOfStock || quantity >= Math.max(0, selectedOptionStock - cartQty)}
                className="w-8 h-8 rounded-full bg-brand flex items-center justify-center text-white hover:bg-[#6b1c18] transition-colors text-lg leading-none disabled:bg-gray-200 disabled:text-gray-400"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Charm Modal */}
        {product.allowCustomName && charmOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={cancelCharmModal} />
                <div className="relative w-full max-w-md bg-white rounded-4xl shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden max-h-[95vh] flex flex-col">

                  {/* Charm image + info header */}
                  {charmStep === "color" && (() => {
                    const previewOption = charmOptions.find(o => o.label === tempColor) ?? charmOptions[0];
                    const previewImg = previewOption?.imageUrl;
                    return (
                      <div className="relative border-b border-gray-100">
                        <div className="flex gap-4 px-4 py-4">
                          {/* Charm preview image — left */}
                          <div className="relative w-28 h-28 shrink-0 rounded-2xl overflow-hidden bg-gray-50 border border-gray-100">
                            {previewImg && (
                              <Image
                                src={previewImg}
                                alt={previewOption ? (lang === "en" && previewOption.labelEn ? previewOption.labelEn : previewOption.label) : ""}
                                fill
                                className="object-contain"
                                sizes="112px"
                              />
                            )}
                          </div>
                          {/* Price + free letters info — right */}
                          <div className="flex flex-col justify-center gap-2 flex-1 min-w-0 pr-8">
                            <span className="text-2xl font-black text-brand">+{CHARM_PRICE}฿</span>
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
                                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white text-[8px] font-black">✓</span>
                                {lang === "th" ? `ตัวอักษรฟรี ${FREE_LETTERS} ตัว` : `${FREE_LETTERS} free letters`}
                              </div>
                              <div className="text-[11px] text-gray-400 font-medium">
                                {lang === "th" ? `ตัวอักษรเพิ่มเติม +${LETTER_PRICE}฿ ตัว` : `+${LETTER_PRICE}฿ per extra letter`}
                              </div>
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={cancelCharmModal}
                          className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })()}

                  {/* Step indicator (letters step only) */}
                  {charmStep === "letters" && (
                    <div className="flex items-center justify-between px-5 pt-5 pb-4 shrink-0">
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black bg-emerald-500 text-white">✓</div>
                        <span className="text-[11px] font-black text-emerald-600">{t("charm.color_step")}</span>
                        <div className="h-px w-6 bg-emerald-300" />
                        <div className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black bg-brand text-white">2</div>
                        <span className="text-[11px] font-black text-gray-900">{t("charm.letters_step")}</span>
                      </div>
                      <button type="button" onClick={cancelCharmModal} className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  {/* Step 1: Color */}
                  {charmStep === "color" && (
                    <div className="px-5 py-4 overflow-y-auto">
                      <p className="mb-3 text-sm font-black text-gray-900">
                        {lang === "th" ? "สีสายห้อย" : "Charm Color"} <span className="text-xs font-semibold text-gray-400 ml-1">(+{CHARM_PRICE}฿)</span>
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {charmOptions.map((option) => {
                          const selected = tempColor === option.label;
                          const displayName = lang === "en" && option.labelEn ? option.labelEn : option.label;
                          return (
                            <button
                              key={option.label}
                              type="button"
                              onClick={() => setTempColor(option.label)}
                              className={`flex items-center gap-1.5 h-9 rounded-2xl border-2 pl-1.5 pr-3 text-sm font-black transition-all ${
                                selected
                                  ? "border-brand bg-brand/5 text-brand"
                                  : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                              }`}
                            >
                              {option.imageUrl ? (
                                <Image
                                  src={option.imageUrl}
                                  alt={displayName}
                                  width={24}
                                  height={24}
                                  className="h-6 w-6 rounded-full object-cover shrink-0"
                                />
                              ) : (
                                <span className="h-6 w-6 rounded-full bg-gray-100 shrink-0" />
                              )}
                              {displayName}
                            </button>
                          );
                        })}
                      </div>
                      <button
                        type="button"
                        onClick={() => setCharmStep("letters")}
                        disabled={!tempColor}
                        className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-brand text-sm font-black text-white shadow-lg shadow-brand/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98]"
                      >
                        {t("charm.next_add_letters")}
                      </button>
                    </div>
                  )}

                  {/* Step 2: Letters */}
                  {charmStep === "letters" && (
                    <div className="px-5 pb-5">
                      {/* Free letters info */}
                      <div className="mb-3 flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          {Array.from({ length: FREE_LETTERS }).map((_, i) => (
                            <span key={i} className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black ${i < tempLetters.length ? "bg-brand text-white" : "bg-gray-900 text-white opacity-20"}`}>
                              {tempLetters[i] ?? "•"}
                            </span>
                          ))}
                        </div>
                        <span className="text-[11px] font-black text-gray-900">
                          {t("charm.free_letters", { count: FREE_LETTERS })}
                        </span>
                        <span className="text-[10px] font-semibold text-gray-400">
                          · {t("charm.extra_letter_price", { price: LETTER_PRICE })}
                        </span>
                      </div>

                      {/* Selected letters display */}
                      <div className="mb-3 flex min-h-10 items-center gap-1.5">
                        <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
                          {tempLetters.length > 0 ? (
                            tempLetters.map((letter, idx) => (
                              <span
                                key={idx}
                                className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-sm font-black text-white shadow-sm"
                              >
                                {letter}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs font-semibold text-gray-400">
                              {t("charm.tap_letters_below")}
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setTempLetters((prev) => prev.slice(0, -1))}
                          disabled={tempLetters.length === 0}
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 hover:border-red-200 hover:bg-red-100 hover:text-red-500 disabled:opacity-30 transition-colors"
                        >
                          <Delete className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Price breakdown */}
                      <div className="mb-4 flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2.5 text-[11px]">
                        <div className="flex items-center gap-1.5">
                          {tempCharmOption?.imageUrl && (
                            <Image src={tempCharmOption.imageUrl} alt="" width={16} height={16} className="h-4 w-4 rounded-full border border-white shadow-sm object-cover" />
                          )}
                          <span className="font-semibold text-gray-500">
                            {t("charm.charm_label")} +{CHARM_PRICE}฿
                            {tempExtraLetters > 0 && ` · ตัวอักษร +${tempExtraLetters}×${LETTER_PRICE}฿`}
                          </span>
                        </div>
                        <span className="font-black text-brand">+{tempCharmAddon}฿</span>
                      </div>

                      {/* A–Z grid */}
                      <div className="grid grid-cols-7 gap-1.5">
                        {ALPHABET.map((letter) => (
                          <button
                            key={letter}
                            type="button"
                            onClick={() => {
                              if (tempLetters.length < MAX_LETTERS) {
                                setTempLetters((prev) => [...prev, letter]);
                              }
                            }}
                            disabled={tempLetters.length >= MAX_LETTERS}
                            className="flex h-10 w-full items-center justify-center rounded-xl bg-gray-100 text-sm font-black text-gray-700 transition-all hover:bg-brand-tint hover:text-brand active:scale-90 disabled:opacity-30"
                          >
                            {letter}
                          </button>
                        ))}
                      </div>

                      {/* Actions */}
                      <div className="mt-4 flex gap-2">
                        <button
                          type="button"
                          onClick={() => setCharmStep("color")}
                          className="flex h-12 flex-1 items-center justify-center rounded-2xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 active:scale-[0.98] transition-all"
                        >
                          ← {t("charm.change_color")}
                        </button>
                        <button
                          type="button"
                          onClick={confirmCharm}
                          disabled={tempLetters.length < 2}
                          className="flex h-12 flex-1 items-center justify-center rounded-2xl bg-brand text-sm font-black text-white shadow-lg shadow-brand/20 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none disabled:shadow-none"
                        >
                          {t("charm.confirm")}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
        {/* Action bar — desktop only (mobile uses fixed bar below) */}
        <div className="mt-2 hidden lg:block">
          {product.comingSoon ? (
            <div className="w-full py-3.5 rounded-2xl bg-gray-100 text-center text-sm font-bold text-gray-400">
              {lang === "th" ? "เร็วๆ นี้" : "Coming Soon"}
            </div>
          ) : outOfStock ? (
            <div className="w-full py-3.5 rounded-2xl bg-gray-100 text-center text-sm font-bold text-gray-400">
              {t("product.out_of_stock")}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button
                ref={addBtnRef}
                type="button"
                onClick={(e) => handleAddToCart(e.currentTarget)}
                disabled={mustSelectOption || selectedOptionOutOfStock}
                className="flex items-center justify-center w-11 h-11 rounded-2xl bg-brand-tint text-brand active:scale-95 transition-transform shrink-0 disabled:opacity-45 disabled:active:scale-100"
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
                className="flex-1 flex items-center justify-center rounded-2xl bg-brand h-11 text-sm font-bold text-white active:scale-95 transition-transform disabled:bg-gray-300 disabled:text-gray-500 disabled:active:scale-100"
              >
                {t("product.buy_now")}
              </button>
            </div>
          )}
        </div>
      </div>

      </div>{/* end grid */}

      {/* Fixed bottom bar — mobile only */}
      <div className="lg:hidden fixed inset-x-0 bottom-0 z-20 bg-white border-t border-gray-100 px-4 py-3">
        {product.comingSoon ? (
          <div className="w-full py-3.5 rounded-2xl bg-gray-100 text-center text-sm font-bold text-gray-400">
            {lang === "th" ? "เร็วๆ นี้" : "Coming Soon"}
          </div>
        ) : outOfStock ? (
          <div className="w-full py-3.5 rounded-2xl bg-gray-100 text-center text-sm font-bold text-gray-400">
            {t("product.out_of_stock")}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={(e) => handleAddToCart(e.currentTarget)}
              disabled={mustSelectOption || selectedOptionOutOfStock}
              className="flex items-center justify-center w-11 h-11 rounded-2xl bg-brand-tint text-brand active:scale-95 transition-transform shrink-0 disabled:opacity-45 disabled:active:scale-100"
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
              className="flex-1 flex items-center justify-center rounded-2xl bg-brand h-11 text-sm font-bold text-white active:scale-95 transition-transform disabled:bg-gray-300 disabled:text-gray-500 disabled:active:scale-100"
            >
              {t("product.buy_now")}
            </button>
          </div>
        )}
      </div>
    </div>

    <ShopFooter />

    {/* Charm prompt modal */}
    {charmPrompt && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center px-6 bg-black/40 backdrop-blur-sm"
        onClick={() => setCharmPrompt(null)}
      >
        <div
          className="w-full max-w-sm rounded-3xl bg-white px-5 pt-6 pb-5 shadow-2xl animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Preview image row */}
          {charmImageValues.length > 0 && (
            <div className="flex justify-center gap-2 mb-4">
              {charmImageValues.slice(0, 4).map((url, i) => (
                <Image key={i} src={url} alt="keychain" width={48} height={48} className="h-12 w-12 rounded-xl object-cover border border-gray-100" />
              ))}
            </div>
          )}
          <p className="text-base font-black text-gray-900 text-center">เพิ่มสายห้อยไหม?</p>
          <p className="mt-1 text-xs text-gray-400 text-center font-medium">
            {t("charm.add_prompt_sub")}
          </p>
          <div className="mt-5 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                pendingAction.current = { type: charmPrompt, sourceEl: pendingSourceEl.current };
                setCharmPrompt(null);
                openCharmModal();
              }}
              className="w-full rounded-2xl bg-brand py-3.5 text-sm font-black text-white cursor-pointer active:scale-[0.98] transition-transform"
            >
              {t("charm.add_with_price")}
            </button>
            <button
              type="button"
              onClick={() => {
                setCharmPrompt(null);
                if (charmPrompt === "buy") {
                  handleAddToCart(undefined, true);
                  router.push("/cart?selectAll=1");
                } else {
                  handleAddToCart(pendingSourceEl.current, true);
                }
              }}
              className="w-full rounded-2xl border border-gray-200 py-3 text-sm font-bold text-gray-600 cursor-pointer"
            >
              {t("charm.no_thanks")}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
