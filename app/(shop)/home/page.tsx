"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Clock3,
  Footprints,
  Globe,
  Image as ImageIcon,
  Layers,
  Search,
  ShoppingCart,
  Shirt,
  Zap,
  Umbrella,
} from "lucide-react";
import { useCart } from "@/lib/cart";
import { useLanguage } from "@/lib/language-context";

type ApiProduct = {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  discount?: number;
  category?: string;
  imageUrl?: string;
  active: boolean;
};

type DisplayProduct = {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  stock: number;
  category: string;
  imageUrl?: string;
};

const CATEGORIES = [
  { labelKey: "shop.cat.umbrella", icon: Umbrella, value: "umbrella" },
  { labelKey: "shop.cat.raincoat", icon: Shirt, value: "raincoat" },
  { labelKey: "shop.cat.rainsuit", icon: Layers, value: "rainsuit" },
  { labelKey: "shop.cat.shoes", icon: Footprints, value: "shoes" },
];

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

function apiToDisplay(product: ApiProduct): DisplayProduct {
  const discount = Number(product.discount ?? 0);
  const price = Number(product.price ?? 0);
  const discountedPrice = discount
    ? Math.round(price * (1 - discount / 100))
    : price;

  return {
    id: product.id,
    name: product.name,
    description: product.description ?? "",
    price: discountedPrice,
    originalPrice: discount ? price : undefined,
    stock: Number(product.stock ?? 0),
    category: normalizeCategory(product.category),
    imageUrl: product.imageUrl,
  };
}

export default function HomePage() {
  const [products, setProducts] = useState<DisplayProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [addedProductId, setAddedProductId] = useState("");
  const [saleSeconds, setSaleSeconds] = useState(2 * 60 * 60 + 12 * 60 + 56);
  const { addItem, count } = useCart();
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

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSaleSeconds((current) => (current > 0 ? current - 1 : 2 * 60 * 60 + 12 * 60 + 56));
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchSearch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query);
      const matchCategory =
        !selectedCategory || product.category === selectedCategory;

      return matchSearch && matchCategory;
    });
  }, [products, search, selectedCategory]);

  function getCategoryLabel(category: string | null) {
    if (!category) return t("shop.all_products");

    const found = CATEGORIES.find((item) => item.value === category);
    return found ? t(found.labelKey) : t("shop.cat.others");
  }

  function toggleCategory(category: string) {
    setSelectedCategory((current) => (current === category ? null : category));
  }

  function addProductToCart(product: DisplayProduct) {
    addItem({
      productId: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      imageUrl: product.imageUrl,
    });
    setAddedProductId(product.id);
    window.setTimeout(() => setAddedProductId(""), 1600);
  }

  const saleTime = useMemo(() => {
    const hours = Math.floor(saleSeconds / 3600);
    const minutes = Math.floor((saleSeconds % 3600) / 60);
    const seconds = saleSeconds % 60;

    return [hours, minutes, seconds]
      .map((value) => String(value).padStart(2, "0"))
      .join(" : ");
  }, [saleSeconds]);

  const saleProductsCount = useMemo(
    () => products.filter((product) => Boolean(product.originalPrice)).length,
    [products],
  );

  const languageSwitch = (
    <div className="flex items-center gap-1 bg-white/90 backdrop-blur-md px-1.5 py-1 rounded-full border border-gray-200 shadow-sm">
      <Globe className="w-3.5 h-3.5 text-gray-400 ml-1 shrink-0" />
      {(["th", "en"] as const).map((nextLang) => (
        <button
          key={nextLang}
          onClick={() => setLang(nextLang)}
          className={`px-2 py-0.5 rounded-md text-[10px] font-black transition-all ${
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

  const searchBox = (
    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5">
      <Search className="w-4 h-4 text-gray-400 shrink-0" />
      <input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder={t("shop.search_placeholder")}
        className="flex-1 text-sm text-gray-700 outline-none bg-transparent placeholder:text-gray-400"
      />
    </div>
  );

  const cartLink = (
    <Link
      href="/cart"
      className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full border border-[#85241F]/10 bg-[#85241F] text-white shadow-xl shadow-[#85241F]/25 transition-transform active:scale-95"
      aria-label={t("nav.cart")}
    >
      <ShoppingCart className="h-6 w-6" />
      {count > 0 ? (
        <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-white px-1 text-center text-[10px] font-black leading-5 text-[#85241F] ring-2 ring-[#85241F]">
          {count > 9 ? "9+" : count}
        </span>
      ) : null}
    </Link>
  );

  const categoryChips = (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      <button
        onClick={() => setSelectedCategory(null)}
        className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
          !selectedCategory
            ? "bg-[#85241F] text-white border-[#85241F]"
            : "bg-white text-gray-600 border-gray-200 hover:border-[#85241F]/40"
        }`}
      >
        {t("shop.all_products")}
      </button>
      {CATEGORIES.map(({ labelKey, icon: Icon, value }) => {
        const active = selectedCategory === value;

        return (
          <button
            key={value}
            onClick={() => toggleCategory(value)}
            className={`shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
              active
                ? "bg-[#85241F] text-white border-[#85241F]"
                : "bg-white text-gray-600 border-gray-200 hover:border-[#85241F]/40"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {t(labelKey)}
          </button>
        );
      })}
    </div>
  );

  const saleBanner = (
    <section className="mb-5 overflow-hidden rounded-2xl border border-[#85241F]/10 bg-[#85241F] text-white shadow-sm">
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-black">
              {lang === "th" ? "ดีลพิเศษวันนี้" : "Today special deals"}
            </p>
            <p className="mt-0.5 text-xs font-semibold text-white/75">
              {lang === "th"
                ? `ส่งฟรี 1-3 วัน${saleProductsCount ? ` · ลดราคา ${saleProductsCount} รายการ` : ""}`
                : `Free shipping 1-3 days${saleProductsCount ? ` · ${saleProductsCount} items on sale` : ""}`}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2 text-[#85241F] sm:justify-start">
          <Clock3 className="h-4 w-4" />
          <span className="text-sm font-black tabular-nums">{saleTime}</span>
        </div>
      </div>
    </section>
  );

  const productGrid = (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-gray-900 text-base">
          {getCategoryLabel(selectedCategory)}
          <span className="ml-2 text-xs font-normal text-gray-400">
            ({filteredProducts.length} {t("shop.items_count")})
          </span>
        </h2>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="bg-white rounded-2xl overflow-hidden border border-gray-100">
              <div className="aspect-square bg-gray-100 animate-pulse" />
              <div className="p-3 space-y-2">
                <div className="h-3 rounded bg-gray-100 animate-pulse" />
                <div className="h-3 w-2/3 rounded bg-gray-100 animate-pulse" />
                <div className="h-8 rounded-xl bg-gray-100 animate-pulse" />
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
            {search || selectedCategory ? t("shop.no_results") : t("shop.no_category")}
          </p>
        </div>
      ) : null}

      {!loading && !error && filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-md hover:border-[#85241F]/20 transition-all flex flex-col"
            >
              <div className="relative aspect-square bg-gray-50">
                {product.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <ImageIcon className="w-10 h-10" />
                  </div>
                )}
                {product.originalPrice ? (
                  <span className="absolute top-2 left-2 bg-[#85241F] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-lg">
                    -{Math.round((1 - product.price / product.originalPrice) * 100)}%
                  </span>
                ) : null}
                <span className={`absolute bottom-2 right-2 rounded-lg px-1.5 py-0.5 text-[10px] font-bold ${
                  product.stock < 1
                    ? "bg-gray-900/80 text-white"
                    : product.stock <= 5
                      ? "bg-amber-500 text-white"
                      : "bg-white/90 text-gray-700"
                }`}>
                  {product.stock < 1
                    ? t("shop.out_of_stock")
                    : lang === "th" ? `เหลือ ${product.stock}` : `${product.stock} left`}
                </span>
              </div>

              <div className="p-3 flex flex-col flex-1">
                <p className="text-sm font-semibold text-gray-800 leading-tight line-clamp-1 mb-0.5">
                  {product.name}
                </p>
                <p className="text-[10px] text-gray-400 leading-tight line-clamp-1 mb-2">
                  {product.description || getCategoryLabel(product.category)}
                </p>
                <div className="mt-auto">
                  <div className="mb-2">
                    <span className="text-sm font-black text-gray-900">
                      {money(product.price)}
                    </span>
                    {product.originalPrice ? (
                      <span className="text-[10px] text-gray-400 line-through ml-1">
                        {money(product.originalPrice)}
                      </span>
                    ) : null}
                  </div>
                  <button
                    onClick={() => addProductToCart(product)}
                    disabled={product.stock < 1}
                    className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${
                      product.stock < 1
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-[#85241F] text-white hover:bg-[#B72D2A] active:scale-95 cursor-pointer"
                    }`}
                  >
                    {product.stock < 1 ? (
                      t("shop.out_of_stock")
                    ) : (
                      <span className="inline-flex items-center justify-center gap-1.5">
                        <ShoppingCart className="w-3.5 h-3.5" />
                        {addedProductId === product.id
                          ? lang === "th" ? "เพิ่มแล้ว" : "Added"
                          : lang === "th" ? "ใส่ตะกร้า" : "Add to cart"}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );

  return (
    <>
      <div className="lg:hidden flex flex-col bg-white min-h-screen relative">
        <div className="absolute top-8 right-5 z-30">{languageSwitch}</div>
        <div className="pt-10 pb-4">
          <div className="flex justify-center mb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/HLLCLOGO.png"
              alt="HLLC Logo"
              className="h-24 w-auto object-contain"
            />
          </div>
          <div className="px-5 md:px-8">{searchBox}</div>
        </div>
        <div className="px-5 md:px-8 pb-8">
          {saleBanner}
          <div className="mb-5">{categoryChips}</div>
          {productGrid}
        </div>
      </div>

      <div className="hidden lg:flex min-h-screen bg-white">
        <aside className="w-60 xl:w-72 shrink-0 border-r border-gray-100 sticky top-0 h-screen flex flex-col">
          <div className="flex justify-center pt-8 pb-6 px-6 border-b border-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/HLLCLOGO.png"
              alt="HLLC Logo"
              className="h-20 w-auto object-contain"
            />
          </div>
          <div className="px-4 py-5 flex-1 overflow-y-auto">
            <p className="text-[11px] font-semibold text-gray-400 uppercase px-3 mb-3">
              {t("shop.categories")}
            </p>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors w-full text-left cursor-pointer ${
                  !selectedCategory
                    ? "bg-[#85241F] text-white"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {t("shop.all_products")}
              </button>
              {CATEGORIES.map(({ labelKey, icon: Icon, value }) => (
                <button
                  key={value}
                  onClick={() => toggleCategory(value)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors w-full text-left cursor-pointer ${
                    selectedCategory === value
                      ? "bg-[#85241F] text-white"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {t(labelKey)}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <div className="flex-1 flex flex-col min-w-0">
          <div className="sticky top-0 bg-white border-b border-gray-100 z-10 px-8 xl:px-10 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="max-w-xl flex-1">{searchBox}</div>
              {languageSwitch}
            </div>
          </div>
          <div className="px-8 xl:px-10 py-6 flex-1">
            {saleBanner}
            {productGrid}
          </div>
        </div>
      </div>
      {cartLink}
    </>
  );
}
