"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronLeft, Package, ShoppingBag, Truck } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useLanguage } from "@/lib/language-context";

export type ProductDetailOption = {
  label: string;
  imageUrl?: string;
};

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
  category?: string;
  options?: ProductDetailOption[];
  imageUrl?: string;
  imageUrls?: string[];
  shipping?: number;
};

function money(value: number) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(value);
}

export function ProductDetailView({ product }: { product: ProductDetailProduct }) {
  const router = useRouter();
  const { addItem } = useCart();
  const { lang } = useLanguage();

  const images = product.imageUrls?.length
    ? product.imageUrls
    : product.imageUrl
    ? [product.imageUrl]
    : [];

  const [currentIndex, setCurrentIndex] = useState(0);

  const tags = product.options?.map((o) => o.label).filter(Boolean) ?? [];
  const shipping = product.shipping ?? 50;
  const outOfStock = product.stock < 1;

  function handleAddToCart() {
    addItem({
      productId: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      imageUrl: product.imageUrl,
      selectedOption: "",
    });
  }

  function handleBuyNow() {
    handleAddToCart();
    router.push("/cart");
  }

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

      {/* Main image */}
      <div className="w-full aspect-square bg-gray-50 flex items-center justify-center">
        {images.length > 0 ? (
          <img
            src={images[currentIndex]}
            alt={product.name[lang] || product.name.th}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="w-full h-full bg-gray-100" />
        )}
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-none border-b border-gray-100">
          {images.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrentIndex(i)}
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

        {/* Tags / condition */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="border-t border-gray-100" />

        {/* Shipping + Collection row */}
        <div className="flex flex-col gap-2.5">
          {product.category && (
            <div className="flex items-center gap-2.5 text-sm text-gray-500">
              <Package className="h-4 w-4 shrink-0 text-gray-400" />
              <span>{lang === "th" ? "คอลเลกชัน" : "Collection"}</span>
              <span className="ml-auto font-semibold text-gray-900">{product.category}</span>
            </div>
          )}
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
