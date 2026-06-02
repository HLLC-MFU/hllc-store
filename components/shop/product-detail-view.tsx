"use client";

import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import { ChevronLeft, ShoppingBag, Truck } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useLanguage } from "@/lib/language-context";

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
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const shipping = product.shipping ?? 50;
  const outOfStock = product.stock < 1;

  function handleAddToCart() {
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

  const scrollToImage = (index: number) => {
    setCurrentIndex(index);
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollTo({
        left: index * container.clientWidth,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 flex items-center h-12 px-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center justify-center w-8 h-8 -ml-1 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft className="h-5 w-5 text-gray-700" />
        </button>
      </div>

      {/* Main image - Horizontal Scroll Gallery */}
      <div className="relative w-full aspect-square bg-gray-50 overflow-hidden">
        {images.length > 0 ? (
          <>
            <div
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="w-full h-full flex overflow-x-auto snap-x snap-mandatory scroll-smooth scrollbar-none"
            >
              {images.map((src, i) => (
                <div key={i} className="w-full h-full shrink-0 snap-center flex items-center justify-center bg-gray-50">
                  <img
                    src={src}
                    alt={`${product.name[lang] || product.name.th} ${i + 1}`}
                    className="w-full h-full object-contain"
                  />
                </div>
              ))}
            </div>
            {/* Dot indicators overlay */}
            {images.length > 1 && (
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 z-10 pointer-events-none">
                {images.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === currentIndex ? "w-4 bg-[#85241F]" : "w-1.5 bg-gray-300"
                    }`}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center" />
        )}
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-none border-b border-gray-100">
          {images.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => scrollToImage(i)}
              className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                i === currentIndex
                  ? "border-[#85241F]"
                  : "border-transparent opacity-50 hover:opacity-80"
              }`}
            >
              <img src={src} alt={`${product.name} ${i + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Info section */}
      <div className="flex-1 px-4 pt-4 pb-28 flex flex-col gap-4">
        {/* Price + Name */}
        <div>
          <p className="text-3xl font-black text-[#85241F] leading-none">
            {money(product.price)}
          </p>
          <h1 className="mt-1.5 text-lg font-bold text-gray-900 leading-snug">
            {product.name[lang] || product.name.th}
          </h1>
        </div>

        <div className="border-t border-gray-100" />

        {/* Shipping row */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2.5 text-sm text-gray-500">
            <Truck className="h-4 w-4 shrink-0 text-gray-400" />
            <span>{lang === "th" ? "ค่าจัดส่ง" : "Shipping"}</span>
            <span className="ml-auto font-semibold text-gray-900">{money(shipping)}</span>
          </div>
        </div>

        {/* Description */}
        {product.description && (product.description[lang] || product.description.th) && (
          <>
            <div className="border-t border-gray-100" />
            <div>
              <p className="text-sm font-bold text-gray-900 mb-1.5">
                {lang === "th" ? "รายละเอียด" : "Description"}
              </p>
              <p className="text-sm leading-relaxed text-gray-500">
                {product.description[lang] || product.description.th}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Bottom action bar */}
      <div className="fixed inset-x-0 bottom-0 z-20 bg-white border-t border-gray-100 px-4 py-3">
        {outOfStock ? (
          <div className="w-full py-3.5 rounded-xl bg-gray-100 text-center text-sm font-bold text-gray-400">
            {lang === "th" ? "สินค้าหมด" : "Out of Stock"}
          </div>
        ) : (
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={handleAddToCart}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-[#85241F] py-3 text-sm font-bold text-[#85241F] active:scale-95 transition-transform"
            >
              <ShoppingBag className="h-4 w-4" />
              {lang === "th" ? "เพิ่มลงตะกร้า" : "Add to Cart"}
            </button>
            <button
              type="button"
              onClick={handleBuyNow}
              className="flex flex-1 items-center justify-center rounded-xl bg-[#85241F] py-3 text-sm font-bold text-white active:scale-95 transition-transform"
            >
              {lang === "th" ? "ซื้อเลย" : "Buy Now"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
