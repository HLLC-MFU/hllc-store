"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, useCallback } from "react";
import { ShoppingCart, ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useLanguage } from "@/lib/language-context";
import { PageHeader } from "@/components/shop/page-header";

export type LocalizedText = {
  th: string;
  en?: string;
};

export type ProductDetailProduct = {
  id: string;
  name: LocalizedText;
  description?: LocalizedText;
  price: number;
  stock: number;
  imageUrls?: string[];
  shipping?: number;
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
  const { addItem } = useCart();
  const { lang } = useLanguage();

  const images = product.imageUrls ?? [];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [expanded, setExpanded] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(null);

  const outOfStock = product.stock < 1;

  const triggerToast = useCallback(() => {
    setShowToast(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setShowToast(false), 2000);
  }, []);

  function handleAddToCart() {
    for (let i = 0; i < quantity; i++) {
      addItem({
        productId: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        stock: product.stock,
        imageUrl: images[0] ?? "",
        selectedOption: "",
      });
    }
    triggerToast();
  }

  function handleBuyNow() {
    handleAddToCart();
    router.push("/cart");
  }

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const index = Math.round(container.scrollLeft / container.clientWidth);
    if (index !== currentIndex && index >= 0 && index < images.length) {
      setCurrentIndex(index);
    }
  };

  const descriptionText = product.description
    ? product.description[lang] || product.description.th
    : "";

  return (
    <div className="min-h-screen bg-white px-5 py-6 pb-24 flex flex-col">
      {/* Toast */}
      <div className={`fixed inset-0 z-50 flex items-center justify-center pointer-events-none transition-opacity duration-300 ${showToast ? "opacity-100" : "opacity-0"}`}>
        <div className="flex items-center gap-3 bg-gray-900/90 text-white px-6 py-4 rounded-2xl shadow-xl">
          <ShoppingCart className="h-5 w-5 text-green-400 shrink-0" />
          <span className="text-sm font-semibold">
            {lang === "th" ? `เพิ่มลงตะกร้าแล้ว ${quantity} ชิ้น` : `Added ${quantity} item${quantity > 1 ? "s" : ""} to cart`}
          </span>
        </div>
      </div>
      <PageHeader title={lang === "th" ? "รายละเอียดสินค้า" : "Product Details"} backHref="/home" />

      {/* Image Card */}
      <div className="rounded-2xl bg-gray-100 overflow-hidden">
        {images.length > 0 ? (
          <div className="relative aspect-square">
            <div
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="w-full h-full flex overflow-x-auto snap-x snap-mandatory scroll-smooth scrollbar-none"
            >
              {images.map((src, i) => (
                <div
                  key={i}
                  className="w-full h-full shrink-0 snap-center flex items-center justify-center"
                >
                  <img
                    src={src}
                    alt={`${product.name[lang] || product.name.th} ${i + 1}`}
                    className="w-full h-full object-contain"
                  />
                </div>
              ))}
            </div>
            {images.length > 1 && (
              <div className="absolute bottom-3 right-3 bg-black/40 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                {currentIndex + 1}/{images.length}
              </div>
            )}
          </div>
        ) : (
          <div className="aspect-square bg-gray-100" />
        )}
      </div>

      {/* Info section */}
      <div className="flex-1 pt-4 flex flex-col gap-3">

        {/* Card: Name + Price */}
        <div className="bg-gray-50 rounded-2xl px-4 py-4 border border-gray-100 flex items-center justify-between gap-3">
          <h1 className="flex-1 min-w-0 text-base font-bold text-gray-900 leading-snug">
            {product.name[lang] || product.name.th}
          </h1>
          <p className="shrink-0 text-lg font-black text-[#85241F]">
            {money(product.price)}
          </p>
        </div>

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
              onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
              className="w-8 h-8 rounded-full bg-[#85241F] flex items-center justify-center text-white hover:bg-[#6b1c18] transition-colors text-lg leading-none"
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

      </div>

      {/* Bottom action bar */}
      <div className="fixed inset-x-0 bottom-0 z-20 bg-white border-t border-gray-100 px-4 py-3">
        {outOfStock ? (
          <div className="w-full py-3.5 rounded-2xl bg-gray-100 text-center text-sm font-bold text-gray-400">
            {lang === "th" ? "สินค้าหมด" : "Out of Stock"}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            {/* Total price */}
            <div className="flex flex-col justify-center shrink-0">
              <span className="text-xs text-gray-400 font-medium">
                {lang === "th" ? "ราคารวม" : "Total"}
              </span>
              <span className="text-base font-black text-[#85241F] leading-tight">
                {money(product.price * quantity)}
              </span>
            </div>

            {/* Divider */}
            <div className="w-px h-8 bg-gray-200 shrink-0" />

            {/* Add to cart */}
            <button
              type="button"
              onClick={handleAddToCart}
              className="flex items-center justify-center w-11 h-11 rounded-2xl bg-[#fce8e7] text-[#85241F] active:scale-95 transition-transform shrink-0"
            >
              <ShoppingCart className="h-5 w-5" />
            </button>

            {/* Buy now */}
            <button
              type="button"
              onClick={handleBuyNow}
              className="flex-1 flex items-center justify-center rounded-2xl bg-[#85241F] h-11 text-sm font-bold text-white active:scale-95 transition-transform"
            >
              {lang === "th" ? "ซื้อเลย" : "Buy Now"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
