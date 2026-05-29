"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Image as ImageIcon, ShoppingCart, X } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useLanguage } from "@/lib/language-context";

export type ProductDetailOption = {
  label: string;
  imageUrl?: string;
};

export type ProductDetailProduct = {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  category?: string;
  options?: ProductDetailOption[];
  imageUrl?: string;
};

function money(value: number) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(value);
}

export function ProductDetailView({ product }: { product: ProductDetailProduct }) {
  const [imagePreview, setImagePreview] = useState<{ src: string; alt: string } | null>(null);
  const router = useRouter();
  const { addItem, count } = useCart();
  const { lang, setLang, t } = useLanguage();
  const options = product.options?.length ? product.options : [{ label: "", imageUrl: product.imageUrl ?? "" }];

  useEffect(() => {
    if (!imagePreview) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setImagePreview(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [imagePreview]);

  function addProductToCart(variantOption?: string, goToCart = false) {
    const selectedVariant = product.options?.find((option) => option.label === variantOption);
    addItem({
      productId: product.id,
      name: product.name,
      description: product.description ?? "",
      price: product.price,
      stock: product.stock,
      imageUrl: selectedVariant?.imageUrl || product.imageUrl,
      selectedOption: variantOption ?? "",
    });

    if (goToCart) {
      setImagePreview(null);
      router.push("/cart");
    }
  }

  function openImagePreview(src: string, alt: string) {
    if (!src) return;
    setImagePreview({ src, alt });
  }

  const languageSwitch = (
    <div className="flex h-11 items-center gap-1.5">
      {(["th", "en"] as const).map((nextLang) => (
        <button
          key={nextLang}
          onClick={() => setLang(nextLang)}
          className={`shop-press rounded-lg px-2.5 py-1 text-xs font-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#85241F]/30 ${
            lang === nextLang
              ? "bg-[#85241F] text-white shadow-sm"
              : "text-gray-400 hover:text-gray-700"
          }`}
        >
          {nextLang.toUpperCase()}
        </button>
      ))}
    </div>
  );

  const cartShortcut = (
    <Link
      href="/cart"
      className="shop-press relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#1F2937] text-white shadow-md shadow-slate-900/20 ring-1 ring-slate-900/10 hover:bg-[#111827] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4B63D]/60"
      aria-label={t("nav.cart")}
    >
      <ShoppingCart className="h-5 w-5" />
      {count > 0 ? (
        <span className="absolute -right-1.5 -top-1.5 min-w-6 rounded-full bg-[#F4B63D] px-1.5 text-center text-[11px] font-black leading-6 text-[#3B1F05] ring-2 ring-white">
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  );

  return (
    <main className="shop-page min-h-screen bg-white">
      <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/home"
              className="shop-press hidden h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-50 text-gray-500 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-200 sm:flex"
              aria-label={lang === "th" ? "กลับหน้าสินค้า" : "Back to products"}
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase text-gray-400">
                {lang === "th" ? "เลือกซื้อ" : "Choose item"}
              </p>
              <h1 className="truncate text-sm font-black text-gray-950 sm:text-base">
                {product.name}
              </h1>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {cartShortcut}
            {languageSwitch}
            <Link
              href="/home"
              className="shop-press flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-50 text-gray-500 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-200"
              aria-label={lang === "th" ? "ปิด" : "Close"}
            >
              <X className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-black text-gray-950">
              {product.options?.length
                ? lang === "th" ? "เลือกประเภทสินค้า" : "Select product type"
                : lang === "th" ? "รายละเอียดสินค้า" : "Product detail"}
            </h2>
            {product.description ? (
              <p className="mt-1 text-xs font-semibold text-gray-400">{product.description}</p>
            ) : null}
          </div>
          <span className="text-xs font-semibold text-gray-400">
            ({options.length} {t("shop.items_count")})
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {options.map((option, index) => {
            const optionImageUrl = option.imageUrl || product.imageUrl || "";
            const optionLabel = option.label || product.category || product.description || "";

            return (
              <article
                key={`${option.label}-${index}`}
                className="shop-card min-w-0 overflow-hidden rounded-2xl bg-white ring-1 ring-gray-100 transition-all hover:shadow-md hover:ring-[#85241F]/30"
              >
                <div className="block w-full text-left">
                  <button
                    type="button"
                    onClick={() => openImagePreview(optionImageUrl, `${product.name} ${option.label}`.trim())}
                    className="relative block aspect-square w-full cursor-zoom-in overflow-hidden bg-[#f7f7f7] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#85241F]/25"
                    aria-label={lang === "th" ? "ดูรูปสินค้า" : "View product image"}
                  >
                    {optionImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={optionImageUrl}
                        alt={`${product.name} ${option.label}`.trim()}
                        className="shop-product-image h-full w-full object-contain p-3"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-gray-300">
                        <ImageIcon className="h-10 w-10" />
                      </div>
                    )}
                    {product.stock < 1 ? (
                      <span className="absolute bottom-2 right-2 rounded-lg bg-gray-900/80 px-1.5 py-0.5 text-[10px] font-black text-white shadow-sm">
                        {t("shop.out_of_stock")}
                      </span>
                    ) : null}
                  </button>
                  <div className="px-2.5 py-2">
                    <p className="line-clamp-2 min-h-9 text-xs font-black leading-snug text-gray-950">
                      {product.name}
                    </p>
                    {optionLabel ? (
                      <p className="mt-1 truncate text-[11px] font-semibold text-gray-500">
                        {optionLabel}
                      </p>
                    ) : null}
                    <p className="mt-1 text-sm font-black text-gray-950">
                      {money(product.price)}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-[minmax(0,1fr)_38px] gap-2 px-2.5 pb-2.5">
                  <button
                    type="button"
                    onClick={() => addProductToCart(option.label, true)}
                    disabled={product.stock < 1}
                    className={`shop-press h-9 min-w-0 rounded-lg text-xs font-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D9001B]/30 ${
                      product.stock < 1
                        ? "bg-gray-100 text-gray-400"
                        : "bg-[#D9001B] text-white hover:bg-[#B72D2A]"
                    }`}
                  >
                    {lang === "th" ? "ซื้อสินค้า" : "Buy"}
                  </button>
                  <button
                    type="button"
                    onClick={() => addProductToCart(option.label)}
                    disabled={product.stock < 1}
                    className={`shop-press flex h-9 w-[38px] items-center justify-center rounded-full border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#85241F]/25 ${
                      product.stock < 1
                        ? "border-gray-200 bg-gray-50 text-gray-400"
                        : "border-[#85241F] bg-white text-[#85241F] hover:bg-[#85241F]/6"
                    }`}
                    aria-label={lang === "th" ? "เพิ่มไปยังรถเข็น" : "Add to cart"}
                  >
                    <ShoppingCart className="h-4 w-4" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {imagePreview ? (
        <div
          className="shop-modal-backdrop fixed inset-0 z-[70] flex items-center justify-center bg-black/85 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setImagePreview(null)}
        >
          <div
            className="shop-modal-panel relative w-full max-w-3xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setImagePreview(null)}
              className="shop-press absolute right-2 top-2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-gray-600 shadow-lg hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              aria-label={lang === "th" ? "ปิดรูป" : "Close image"}
            >
              <X className="h-4 w-4" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imagePreview.src}
              alt={imagePreview.alt}
              className="max-h-[84vh] w-full rounded-2xl bg-white object-contain p-2 shadow-2xl"
            />
          </div>
        </div>
      ) : null}
    </main>
  );
}
