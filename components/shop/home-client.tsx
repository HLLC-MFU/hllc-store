"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Image as ImageIcon, Truck } from "lucide-react";
import { useLanguage } from "@/lib/client/language-context";

type ProductOption = {
  label: string;
  imageUrl?: string;
  stock?: number;
};

type LocalizedText = {
  th: string;
  en?: string;
};

type DisplayProduct = {
  id: string;
  name: LocalizedText;
  description: LocalizedText;
  price: number;
  stock: number;
  shippingFirstItem: number;
  shippingAdditionalItem: number;
  category: string;
  options: ProductOption[];
  imageUrl?: string;
};

type HomeClientProps = {
  products: DisplayProduct[];
};

const currencyFormatter = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  maximumFractionDigits: 0,
});

function money(value: number) {
  return currencyFormatter.format(value);
}

export function HomeClient({ products }: HomeClientProps) {
  const { lang, t } = useLanguage();
  const router = useRouter();

  const goToProduct = React.useCallback((productId: string) => {
    router.push(`/products/${productId}`);
  }, [router]);

  const trackingEntry = (
    <Link
      href="/profile"
      className="shop-tracking mb-4 flex items-center justify-between rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm transition-all duration-200 hover:border-[#85241F]/20 hover:bg-[#85241F]/5 active:scale-[0.98] md:hidden"
    >
      <div className="flex items-center gap-3">
        <div className="shop-tracking-icon flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#85241F]/8 text-[#85241F]">
          <Truck className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-black text-gray-900">
            {lang === "th" ? "ติดตามพัสดุ" : "Track package"}
          </p>
          <p className="mt-0.5 text-xs font-semibold text-gray-400">
            {lang === "th" ? "ใส่เบอร์โทรเพื่อดูสถานะและเลขพัสดุ" : "Enter your phone to see status and tracking"}
          </p>
        </div>
      </div>
      <span className="text-lg font-bold text-gray-300">›</span>
    </Link>
  );

  const productGrid = (
    <section>
      {products.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm text-gray-400">{t("shop.no_category")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {products.map((p) => {
            const isOutOfStock = p.options.length > 0
              ? p.options.every((option) => (option.stock ?? p.stock) < 1)
              : p.stock < 1;
            const needsOption = p.options.length > 0;
            const cardContent = (
              <>
                {/* Image — full width, no frame */}
                <div className="relative aspect-square bg-[#f5f5f5] overflow-hidden">
                  {p.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.imageUrl}
                      alt={p.name[lang] || p.name.th}
                      className={`h-full w-full object-cover ${isOutOfStock ? "" : "transition-transform duration-300 group-hover:scale-105"}`}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-12 h-12 text-gray-200" />
                    </div>
                  )}
                  {isOutOfStock && (
                    <span className="absolute bottom-2 left-2 rounded-xl bg-gray-900/75 px-2 py-0.5 text-[10px] font-bold text-white">
                      {t("shop.out_of_stock")}
                    </span>
                  )}
                </div>
                {/* Info */}
                <div className="px-4 py-3.5 flex flex-col gap-0.5">
                  <p className="truncate text-sm font-black text-gray-900">
                    {p.name[lang] || p.name.th}
                  </p>
                  <p className="mt-2 text-base font-black text-[#85241F]">{money(p.price)}</p>
                </div>
              </>
            );

            if (!isOutOfStock && needsOption) {
              return (
                <div
                  key={p.id}
                  className="group relative rounded-3xl bg-white shadow-[0_4px_20px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.13)] transition-all duration-300 overflow-hidden active:scale-[0.98]"
                >
                  <Link href={`/products/${p.id}`} className="block">
                    {cardContent}
                  </Link>
                  <div className="px-3 pb-3">
                    <button
                      type="button"
                      onClick={() => goToProduct(p.id)}
                      className="flex h-10 w-full items-center justify-center rounded-2xl bg-[#85241F] px-3 text-xs font-black text-white transition-transform active:scale-[0.98]"
                    >
                      <span className="truncate">{lang === "th" ? "เลือกซื้อ" : "Choose"}</span>
                    </button>
                  </div>
                </div>
              );
            }

            const actions = isOutOfStock ? (
              <div className="px-3 pb-3">
                <div className="flex h-10 items-center justify-center rounded-2xl bg-gray-100 text-xs font-black text-gray-400">
                  {t("shop.out_of_stock")}
                </div>
              </div>
            ) : null;

            if (isOutOfStock) {
              return (
                <div
                  key={p.id}
                  className="group rounded-3xl bg-white shadow-[0_4px_20px_rgba(0,0,0,0.08)] overflow-hidden opacity-60 cursor-not-allowed"
                >
                  {cardContent}
                  {actions}
                </div>
              );
            }

            return (
              <div
                key={p.id}
                className="group relative rounded-3xl bg-white shadow-[0_4px_20px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.13)] transition-all duration-300 overflow-hidden active:scale-[0.98]"
              >
                <Link
                  href={`/products/${p.id}`}
                  onClick={(e) => {
                    const card = e.currentTarget;
                    const rect = card.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    const size = Math.max(rect.width, rect.height);
                    const ripple = document.createElement("span");
                    ripple.className = "ripple";
                    ripple.style.cssText = `width:${size}px;height:${size}px;left:${x - size / 2}px;top:${y - size / 2}px`;
                    card.appendChild(ripple);
                    setTimeout(() => ripple.remove(), 280);
                  }}
                  className="block"
                >
                  {cardContent}
                </Link>
                {actions}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );

  return (
    <div className="min-h-screen bg-white">
      <div className="px-4 md:px-6 py-4 pb-24">
        {/* Mobile: tracking card */}
        {trackingEntry}
        {productGrid}
      </div>
    </div>
  );
}
