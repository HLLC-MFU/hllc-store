"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { ArrowRight, Image as ImageIcon } from "lucide-react";
import { useLanguage } from "@/lib/client/language-context";

export type LocalizedText = { th: string; en?: string };

export type ShopProductOption = { label: string; imageUrl?: string; stock?: number };

export type ShopProduct = {
  id: string;
  name: LocalizedText;
  price: number;
  stock: number;
  options: ShopProductOption[];
  imageUrl?: string;
  imageUrls?: string[];
  charmType?: string;
};

const currencyFormatter = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  maximumFractionDigits: 0,
});

function money(value: number) {
  return currencyFormatter.format(value);
}

/** Full-width banner card for a single product. */
export function SingleProductCard({ product }: { product: ShopProduct }) {
  const { lang, t } = useLanguage();
  const p = product;
  const isOutOfStock = p.options.length > 0
    ? p.options.every((o) => (o.stock ?? p.stock) < 1)
    : p.stock < 1;

  return (
    <Link
      href={`/products/${p.id}`}
      className={`group relative block overflow-hidden rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.10)] active:scale-[0.99] transition-all duration-300 ${isOutOfStock ? "opacity-60" : ""}`}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] w-full bg-gray-100 overflow-hidden">
        {p.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={p.imageUrl}
            alt={p.name[lang] || p.name.th}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ImageIcon className="w-14 h-14 text-gray-200" />
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.65)_0%,rgba(0,0,0,0.15)_50%,transparent_100%)]" />

        {/* Out of stock badge */}
        {isOutOfStock && (
          <span className="absolute top-4 left-4 rounded-xl bg-gray-900/75 px-3 py-1 text-[11px] font-bold text-white">
            {t("shop.out_of_stock")}
          </span>
        )}

        {/* Info overlay */}
        <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between gap-3 px-5 py-5">
          <div>
            <p className="text-lg font-black text-white leading-snug drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)]">
              {p.name[lang] || p.name.th}
            </p>
            <p className="mt-1 text-base font-black text-white/90 drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)]">
              {money(p.price)}
            </p>
          </div>
          <span className="shrink-0 inline-flex h-9 items-center justify-center gap-1.5 rounded-2xl bg-brand px-4 text-xs font-black text-white shadow-lg shadow-black/20">
            {t("shop.shop_now")}
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

/** Shared storefront product grid used by category, group and charm pages. */
export function CategoryGrid({ products }: { products: ShopProduct[] }) {
  const { lang, t } = useLanguage();
  const router = useRouter();

  const goToProduct = React.useCallback(
    (productId: string) => {
      router.push(`/products/${productId}`);
    },
    [router],
  );

  if (products.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-gray-400">{t("shop.no_category")}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
      {products.map((p) => {
        const isOutOfStock =
          p.options.length > 0
            ? p.options.every((option) => (option.stock ?? p.stock) < 1)
            : p.stock < 1;
        const needsOption = p.options.length > 0;
        const cardContent = (
          <>
            <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
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
            <div className="px-4 py-3.5 flex flex-col gap-0.5">
              <p className="truncate text-sm font-black text-gray-900">{p.name[lang] || p.name.th}</p>
              <p className="mt-2 text-base font-black text-brand">{money(p.price)}</p>
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
                  className="flex h-10 w-full items-center justify-center rounded-2xl bg-brand px-3 text-xs font-black text-white transition-transform active:scale-[0.98]"
                >
                  <span className="truncate">{t("shop.choose")}</span>
                </button>
              </div>
            </div>
          );
        }

        if (isOutOfStock) {
          return (
            <div
              key={p.id}
              className="group rounded-3xl bg-white shadow-[0_4px_20px_rgba(0,0,0,0.08)] overflow-hidden opacity-60 cursor-not-allowed"
            >
              {cardContent}
              <div className="px-3 pb-3">
                <div className="flex h-10 items-center justify-center rounded-2xl bg-gray-100 text-xs font-black text-gray-400">
                  {t("shop.out_of_stock")}
                </div>
              </div>
            </div>
          );
        }

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
                className="flex h-10 w-full items-center justify-center rounded-2xl bg-brand px-3 text-xs font-black text-white transition-transform active:scale-[0.98]"
              >
                <span className="truncate">{t("shop.choose")}</span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
