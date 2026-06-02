"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Image as ImageIcon, ShoppingCart, Truck } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useLanguage } from "@/lib/language-context";

type ProductOption = {
  label: string;
  imageUrl?: string;
};

type ApiProduct = {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  category?: string;
  options?: Array<string | ProductOption>;
  imageUrl?: string;
  active: boolean;
};

type DisplayProduct = {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  options: ProductOption[];
  imageUrl?: string;
};

function money(value: number) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(value);
}

function normalizeCategory(category?: string) {
  const value = category?.trim().toLowerCase();

  if (!value) return "others";
  if (["umbrella", "umbrellas"].includes(value)) return "umbrella";
  if (["raincoat", "raincoats"].includes(value)) return "raincoat";
  if (["rainsuit", "rain-suit", "rain_suit"].includes(value)) return "rainsuit";
  if (["shoe", "shoes", "boot", "boots"].includes(value)) return "shoes";

  return value;
}

function normalizeOptions(options?: Array<string | ProductOption>) {
  if (!Array.isArray(options)) return [];

  return options
    .map((option) => {
      if (typeof option === "string") {
        return { label: option.trim(), imageUrl: "" };
      }

      return {
        label: option.label?.trim() ?? "",
        imageUrl: option.imageUrl?.trim() ?? "",
      };
    })
    .filter((option) => option.label);
}

function apiToDisplay(product: ApiProduct): DisplayProduct {
  const price = Number(product.price ?? 0);

  return {
    id: product.id,
    name: product.name,
    description: product.description ?? "",
    price,
    stock: Number(product.stock ?? 0),
    category: normalizeCategory(product.category),
    options: normalizeOptions(product.options),
    imageUrl: product.imageUrl,
  };
}

export default function HomePage() {
  const [products, setProducts] = useState<DisplayProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { count } = useCart();
  const { lang, setLang, t } = useLanguage();

  useEffect(() => {
    let alive = true;

    async function loadProducts() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch("/api/backend/products", {
          cache: "no-store",
        });
        const payload = (await response.json()) as {
          data?: ApiProduct[];
          error?: string;
        };

        if (!response.ok) {
          throw new Error(payload.error ?? "Unable to load products");
        }

        if (alive) {
          setProducts((payload.data ?? []).map(apiToDisplay));
        }
      } catch (err) {
        if (alive) {
          setProducts([]);
          setError(err instanceof Error ? err.message : "Unable to load products");
        }
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    }

    void loadProducts();

    return () => {
      alive = false;
    };
  }, []);

  const filteredProducts = useMemo(() => {
    return products;
  }, [products]);

  const languageSwitch = (
    <div className="flex h-11 items-center gap-1.5">
      {(["th", "en"] as const).map((nextLang) => (
        <button
          key={nextLang}
          onClick={() => setLang(nextLang)}
          className={`shop-press rounded-lg px-2.5 py-1 text-xs font-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#85241F]/30 ${lang === nextLang
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

  const shopControls = (
    <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-gray-100 bg-white p-1.5 shadow-sm transition-all duration-200 hover:border-gray-200 hover:shadow-md">
      {cartShortcut}
    </div>
  );

  const trackingEntry = (
    <Link
      href="/profile"
      className="shop-tracking mb-5 flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#85241F]/20 hover:bg-[#85241F]/5 hover:shadow-md active:translate-y-0"
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
      <div className="mb-4 flex items-end justify-between gap-3">
        <h2 className="min-w-0 font-bold text-gray-900 text-base">
          {t("shop.all_products")}
          <span className="ml-2 text-xs font-normal text-gray-400">
            ({filteredProducts.length} {t("shop.items_count")})
          </span>
        </h2>
        {shopControls}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-x-5 gap-y-8 md:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index}>
              <div className="aspect-square rounded-lg bg-gray-100 animate-pulse" />
              <div className="mt-3 grid grid-cols-[1fr_56px] gap-2">
                <div className="h-3 rounded bg-gray-100 animate-pulse" />
                <div className="h-3 rounded bg-gray-100 animate-pulse" />
                <div className="col-span-2 h-2 rounded bg-gray-100 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {!loading && error ? (
        <div className="text-center py-16">
          <p className="text-sm font-semibold text-[#85241F]">{error}</p>
        </div>
      ) : null}

      {!loading && !error && filteredProducts.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm text-gray-400">
            {t("shop.no_category")}
          </p>
        </div>
      ) : null}

      {!loading && !error && filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 gap-x-5 gap-y-8 md:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((product) => (
            <Link
              key={product.id}
              href={`/products/${product.id}`}
              className="shop-card group min-w-0 rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#85241F]/25"
            >
              <div className="relative aspect-square overflow-hidden rounded-xl bg-[#f7f7f7] p-3 shadow-sm ring-1 ring-gray-100 transition-all duration-200 group-hover:bg-white group-hover:shadow-md group-hover:ring-gray-200">
                {product.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="shop-product-image h-full w-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <ImageIcon className="w-10 h-10" />
                  </div>
                )}
                {product.stock < 1 ? (
                  <span className="absolute bottom-2 right-2 rounded-lg bg-gray-900/80 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {t("shop.out_of_stock")}
                  </span>
                ) : null}
              </div>

              <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1">
                <p className="min-w-0 truncate text-sm font-black text-gray-900">
                  {product.name}
                </p>
                <p className="text-sm font-black text-gray-900">
                  {money(product.price)}
                </p>
                <p className="col-span-2 min-w-0 truncate text-[10px] font-semibold text-gray-400">
                  {product.description || product.category}
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : null}
    </section>
  );

  return (
    <>
      <div className="shop-page lg:hidden flex flex-col bg-white min-h-screen relative">
        <div className="absolute right-5 top-6 z-30">{languageSwitch}</div>
        <div className="pt-14 pb-4">
          <div className="flex justify-center mb-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/HLLCLOGO.png"
              alt="HLLC Logo"
              className="shop-logo h-24 w-auto object-contain"
            />
          </div>
        </div>
        <div className="px-5 md:px-8 pb-8">
          {trackingEntry}
          {productGrid}
        </div>
      </div>

      <div className="shop-page hidden lg:flex min-h-screen bg-white">
        <aside className="w-60 xl:w-72 shrink-0 border-r border-gray-100 sticky top-0 h-screen flex flex-col">
          <div className="flex justify-center pt-8 pb-6 px-6 border-b border-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/HLLCLOGO.png"
              alt="HLLC Logo"
              className="shop-logo h-20 w-auto object-contain"
            />
          </div>
          <div className="px-4 py-5 flex-1 overflow-y-auto">
            <p className="text-[11px] font-semibold text-gray-400 uppercase px-3 mb-3">
              {lang === "th" ? "คำสั่งซื้อ" : "Orders"}
            </p>
            {trackingEntry}
          </div>
        </aside>

        <div className="flex-1 flex flex-col min-w-0">
          <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-8 py-4 xl:px-10">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-sm font-bold text-gray-600">
                {t("shop.all_products")}
              </h3>
              {languageSwitch}
            </div>
          </div>
          <div className="px-8 xl:px-10 py-6 flex-1">
            {productGrid}
          </div>
        </div>
      </div>
    </>
  );
}
