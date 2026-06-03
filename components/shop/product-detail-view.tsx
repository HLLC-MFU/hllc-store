"use client";

import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, type UIEvent } from "react";
import { ChevronLeft, Image as ImageIcon, ShoppingBag, Truck } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useLanguage } from "@/lib/language-context";

export type LocalizedText = {
  th: string;
  en?: string;
};

export type ProductDetailOption = {
  label: string;
  imageUrl?: string;
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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(product.options?.[0]?.label ?? "");
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const productName = product.name[lang] || product.name.th;
  const productDescription = product.description?.[lang] || product.description?.th || "";
  const baseImage = product.imageUrl || product.imageUrls?.[0] || "";
  const optionItems = useMemo(
    () => (product.options?.length ? product.options : [{ label: "", imageUrl: baseImage }]),
    [baseImage, product.options],
  );
  const selectedVariant = optionItems.find((option) => option.label === selectedOption) ?? optionItems[0];
  const images = useMemo(() => {
    const allImages = [
      selectedVariant?.imageUrl,
      ...(product.imageUrls ?? []),
      baseImage,
    ].filter((src): src is string => Boolean(src));

    return Array.from(new Set(allImages));
  }, [baseImage, product.imageUrls, selectedVariant?.imageUrl]);

  const shipping = product.shipping ?? 50;
  const outOfStock = product.stock < 1;

  function addSelectedToCart() {
    addItem({
      productId: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      imageUrl: selectedVariant?.imageUrl || images[0] || "",
      selectedOption,
    });
  }

  function handleBuyNow() {
    addSelectedToCart();
    router.push("/cart");
  }

  function handleScroll(event: UIEvent<HTMLDivElement>) {
    const container = event.currentTarget;
    const index = Math.round(container.scrollLeft / container.clientWidth);
    if (index !== currentIndex && index >= 0 && index < images.length) {
      setCurrentIndex(index);
    }
  }

  function scrollToImage(index: number) {
    setCurrentIndex(index);
    scrollContainerRef.current?.scrollTo({
      left: index * scrollContainerRef.current.clientWidth,
      behavior: "smooth",
    });
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <div className="sticky top-0 z-10 flex h-12 items-center border-b border-gray-100 bg-white px-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="-ml-1 flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-gray-100"
          aria-label={lang === "th" ? "กลับ" : "Back"}
        >
          <ChevronLeft className="h-5 w-5 text-gray-700" />
        </button>
      </div>

      <div className="relative aspect-square w-full overflow-hidden bg-gray-50">
        {images.length > 0 ? (
          <>
            <div
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="scrollbar-none flex h-full w-full snap-x snap-mandatory overflow-x-auto scroll-smooth"
            >
              {images.map((src, index) => (
                <div key={src} className="flex h-full w-full shrink-0 snap-center items-center justify-center bg-gray-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`${productName} ${index + 1}`} className="h-full w-full object-contain" />
                </div>
              ))}
            </div>
            {images.length > 1 ? (
              <div className="pointer-events-none absolute inset-x-0 bottom-4 z-10 flex justify-center gap-1.5">
                {images.map((_, index) => (
                  <span
                    key={index}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      index === currentIndex ? "w-4 bg-[#85241F]" : "w-1.5 bg-gray-300"
                    }`}
                  />
                ))}
              </div>
            ) : null}
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-100">
            <ImageIcon className="h-12 w-12 text-gray-300" />
          </div>
        )}
      </div>

      {images.length > 1 ? (
        <div className="scrollbar-none flex gap-2 overflow-x-auto border-b border-gray-100 px-4 py-3">
          {images.map((src, index) => (
            <button
              key={src}
              type="button"
              onClick={() => scrollToImage(index)}
              className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                index === currentIndex ? "border-[#85241F]" : "border-transparent opacity-50 hover:opacity-80"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`${productName} ${index + 1}`} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}

      <div className="flex flex-1 flex-col gap-4 px-4 pb-32 pt-4">
        <div>
          <p className="text-3xl font-black leading-none text-[#85241F]">{money(product.price)}</p>
          <h1 className="mt-1.5 text-lg font-bold leading-snug text-gray-900">{productName}</h1>
        </div>

        {optionItems.some((option) => option.label) ? (
          <>
            <div className="border-t border-gray-100" />
            <div>
              <p className="mb-2 text-sm font-bold text-gray-900">
                {lang === "th" ? "ตัวเลือกสินค้า" : "Product options"}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {optionItems.map((option) => {
                  const active = selectedOption === option.label;
                  return (
                    <button
                      key={option.label}
                      type="button"
                      onClick={() => setSelectedOption(option.label)}
                      className={`flex min-w-0 items-center gap-2 rounded-xl border p-2 text-left transition-all ${
                        active ? "border-[#85241F] bg-[#85241F]/5" : "border-gray-100 bg-white hover:border-gray-200"
                      }`}
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-50">
                        {option.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={option.imageUrl} alt={option.label} className="h-full w-full object-cover" />
                        ) : (
                          <ImageIcon className="h-4 w-4 text-gray-300" />
                        )}
                      </span>
                      <span className="truncate text-xs font-black text-gray-800">{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        ) : null}

        <div className="border-t border-gray-100" />

        <div className="flex items-center gap-2.5 text-sm text-gray-500">
          <Truck className="h-4 w-4 shrink-0 text-gray-400" />
          <span>{lang === "th" ? "ค่าจัดส่ง" : "Shipping"}</span>
          <span className="ml-auto font-semibold text-gray-900">{money(shipping)}</span>
        </div>

        {productDescription ? (
          <>
            <div className="border-t border-gray-100" />
            <div>
              <p className="mb-1.5 text-sm font-bold text-gray-900">
                {lang === "th" ? "รายละเอียด" : "Description"}
              </p>
              <p className="text-sm leading-relaxed text-gray-500">{productDescription}</p>
            </div>
          </>
        ) : null}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-gray-100 bg-white px-4 py-3">
        {outOfStock ? (
          <div className="w-full rounded-xl bg-gray-100 py-3.5 text-center text-sm font-bold text-gray-400">
            {lang === "th" ? "สินค้าหมด" : "Out of Stock"}
          </div>
        ) : (
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={addSelectedToCart}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-[#85241F] py-3 text-sm font-bold text-[#85241F] transition-transform active:scale-95"
            >
              <ShoppingBag className="h-4 w-4" />
              {lang === "th" ? "เพิ่มลงตะกร้า" : "Add to Cart"}
            </button>
            <button
              type="button"
              onClick={handleBuyNow}
              className="flex flex-1 items-center justify-center rounded-xl bg-[#85241F] py-3 text-sm font-bold text-white transition-transform active:scale-95"
            >
              {lang === "th" ? "ซื้อเลย" : "Buy Now"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
