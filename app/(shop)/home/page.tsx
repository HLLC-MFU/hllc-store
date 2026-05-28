"use client";

import { useState, useEffect } from "react";
import {
  Footprints,
  Layers,
  Search,
  Shirt,
  Umbrella,
  Globe,
} from "lucide-react";
import { MOCK_PRODUCTS, type MockProduct } from "@/lib/mock-products";
import { OrderSheet, type OrderProduct } from "@/components/shop/order-sheet";
import { useLanguage } from "@/lib/language-context";

type ApiProduct = {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
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
  gradient?: string;
  emoji?: string;
  imageUrl?: string;
  rating: number;
  sold: number;
};

const CATEGORIES = [
  { labelKey: "shop.cat.umbrella", icon: Umbrella, category: "ร่ม" },
  { labelKey: "shop.cat.raincoat", icon: Shirt, category: "เสื้อกันฝน" },
  { labelKey: "shop.cat.rainsuit", icon: Layers, category: "ชุดกันฝน" },
  { labelKey: "shop.cat.shoes", icon: Footprints, category: "รองเท้า" },
];

function money(value: number) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(value);
}

function useFlashSaleTimer() {
  const [secs, setSecs] = useState(2 * 3600 + 12 * 60 + 56);
  useEffect(() => {
    const id = setInterval(() => setSecs((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, []);
  const h = String(Math.floor(secs / 3600)).padStart(2, "0");
  const m = String(Math.floor((secs % 3600) / 60)).padStart(2, "0");
  const s = String(secs % 60).padStart(2, "0");
  return `${h} : ${m} : ${s}`;
}

function toDisplay(p: MockProduct): DisplayProduct {
  return { ...p };
}

function apiToDisplay(p: ApiProduct): DisplayProduct {
  return {
    id: p.id,
    name: p.name,
    description: p.description ?? "",
    price: p.price,
    stock: p.stock,
    category: "อื่นๆ",
    imageUrl: p.imageUrl,
    rating: 4.5,
    sold: 0,
  };
}

export default function HomePage() {
  const [apiProducts, setApiProducts] = useState<DisplayProduct[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [orderProduct, setOrderProduct] = useState<OrderProduct | null>(null);
  const { lang, setLang, t } = useLanguage();

  useEffect(() => {
    fetch("/api/backend/products")
      .then((r) => r.json())
      .then((res: { data?: ApiProduct[] }) => {
        setApiProducts((res.data ?? []).map(apiToDisplay));
      })
      .catch(() => {});
  }, []);

  const allProducts: DisplayProduct[] = [
    ...MOCK_PRODUCTS.map(toDisplay),
    ...apiProducts,
  ];

  const filtered = allProducts.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = !selectedCategory || p.category === selectedCategory;
    return matchSearch && matchCat;
  });

  function handleCategory(cat: string) {
    setSelectedCategory((prev) => (prev === cat ? null : cat));
  }

  const getProductName = (p: DisplayProduct) => {
    const key = `product.${p.id}.name`;
    const val = t(key);
    return val === key ? p.name : val;
  };

  const getProductDesc = (p: DisplayProduct) => {
    const key = `product.${p.id}.desc`;
    const val = t(key);
    return val === key ? p.description : val;
  };

  function openOrder(product: DisplayProduct) {
    setOrderProduct({
      id: product.id,
      name: getProductName(product),
      description: getProductDesc(product),
      price: product.price,
      originalPrice: product.originalPrice,
      stock: product.stock,
      category: product.category,
      gradient: product.gradient,
      emoji: product.emoji,
      imageUrl: product.imageUrl,
    });
  }

  // Helper to translate backend category strings on visual UI
  const getCategoryLabel = (cat: string | null) => {
    if (!cat) return t("shop.all_products");
    switch (cat) {
      case "ร่ม": return t("shop.cat.umbrella");
      case "เสื้อกันฝน": return t("shop.cat.raincoat");
      case "ชุดกันฝน": return t("shop.cat.rainsuit");
      case "รองเท้า": return t("shop.cat.shoes");
      default: return t("shop.cat.others");
    }
  };

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
      {CATEGORIES.map(({ labelKey, icon: Icon, category }) => {
        const active = selectedCategory === category;
        return (
          <button
            key={labelKey}
            onClick={() => handleCategory(category)}
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

  const productGrid = (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-gray-900 text-base">
          {getCategoryLabel(selectedCategory)}
          {selectedCategory && (
            <span className="ml-2 text-xs font-normal text-gray-400">
              ({filtered.length} {t("shop.items_count")})
            </span>
          )}
        </h2>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🌂</p>
          <p className="text-sm text-gray-400">
            {search ? t("shop.no_results") : t("shop.no_category")}
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
        {filtered.map((product) => (
          <div
            key={product.id}
            className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-md hover:border-[#85241F]/20 transition-all flex flex-col"
          >
            <div className="relative aspect-square">
              {product.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={product.imageUrl} alt={getProductName(product)} className="w-full h-full object-cover" />
              ) : (
                <div className={`w-full h-full bg-linear-to-br ${product.gradient ?? "from-[#85241F] to-[#5A1710]"} flex items-center justify-center`}>
                  <span className="text-5xl drop-shadow-md">{product.emoji ?? "📦"}</span>
                </div>
              )}
              {product.originalPrice && (
                <span className="absolute top-2 left-2 bg-[#85241F] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-lg">
                  -{Math.round((1 - product.price / product.originalPrice) * 100)}%
                </span>
              )}
            </div>
            <div className="p-3 flex flex-col flex-1">
              <p className="text-sm font-semibold text-gray-800 leading-tight line-clamp-1 mb-0.5">
                {getProductName(product)}
              </p>
              <p className="text-[10px] text-gray-400 leading-tight line-clamp-1 mb-2">
                {getProductDesc(product)}
              </p>
              <div className="mt-auto">
                <div className="mb-2">
                  <span className="text-sm font-black text-gray-900">{money(product.price)}</span>
                  {product.originalPrice && (
                    <span className="text-[10px] text-gray-400 line-through ml-1">{money(product.originalPrice)}</span>
                  )}
                </div>
                <button
                  onClick={() => openOrder(product)}
                  disabled={product.stock < 1}
                  className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${
                    product.stock < 1
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-[#85241F] text-white hover:bg-[#B72D2A] active:scale-95 cursor-pointer"
                  }`}
                >
                  {product.stock < 1 ? t("shop.out_of_stock") : t("shop.order_now")}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );

  return (
    <>
      {/* ── Mobile & Tablet (< lg) ── */}
      <div className="lg:hidden flex flex-col bg-white min-h-screen relative">
        {/* Floating Language Switcher for Mobile Header */}
        <div className="absolute top-8 right-5 flex items-center gap-1 bg-gray-50/90 backdrop-blur-md px-1.5 py-1 rounded-full border border-gray-200/50 shadow-sm z-30">
          <Globe className="w-3 h-3 text-gray-400 ml-1 shrink-0" />
          <button
            onClick={() => setLang("th")}
            className={`px-2 py-0.5 rounded-md text-[9px] font-black transition-all ${
              lang === "th"
                ? "bg-[#85241F] text-white shadow-sm"
                : "text-gray-400 hover:text-gray-700"
            }`}
          >
            TH
          </button>
          <button
            onClick={() => setLang("en")}
            className={`px-2 py-0.5 rounded-md text-[9px] font-black transition-all ${
              lang === "en"
                ? "bg-[#85241F] text-white shadow-sm"
                : "text-gray-400 hover:text-gray-700"
            }`}
          >
            EN
          </button>
        </div>

        <div className="pt-10 pb-4">
          <div className="flex justify-center mb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/HLLCLOGO.png" alt="HLLC Logo" className="h-24 w-auto object-contain" />
          </div>
          <div className="px-5 md:px-8">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5">
              <Search className="w-4 h-4 text-gray-400 shrink-0" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("shop.search_placeholder")}
                className="flex-1 text-sm text-gray-700 outline-none bg-transparent placeholder:text-gray-400"
              />
            </div>
          </div>
        </div>
        <div className="px-5 md:px-8 pb-8">
          <div className="mb-5">{categoryChips}</div>
          {productGrid}
        </div>
      </div>

      {/* ── Desktop (lg+) ── */}
      <div className="hidden lg:flex min-h-screen bg-white">
        {/* Sidebar */}
        <aside className="w-60 xl:w-72 shrink-0 border-r border-gray-100 sticky top-0 h-screen flex flex-col">
          <div className="flex justify-center pt-8 pb-6 px-6 border-b border-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/HLLCLOGO.png" alt="HLLC Logo" className="h-20 w-auto object-contain" />
          </div>
          <div className="px-4 py-5 flex-1 overflow-y-auto">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-3">
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
              {CATEGORIES.map(({ labelKey, icon: Icon, category }) => (
                <button
                  key={labelKey}
                  onClick={() => handleCategory(category)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors w-full text-left cursor-pointer ${
                    selectedCategory === category
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

        {/* Main */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar */}
          <div className="sticky top-0 bg-white border-b border-gray-100 z-10 px-8 xl:px-10 py-4">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 max-w-xl">
              <Search className="w-4 h-4 text-gray-400 shrink-0" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("shop.search_placeholder")}
                className="flex-1 text-sm text-gray-700 outline-none bg-transparent placeholder:text-gray-400"
              />
            </div>
          </div>
          {/* Content */}
          <div className="px-8 xl:px-10 py-6 flex-1">
            {productGrid}
          </div>
        </div>
      </div>

      <OrderSheet product={orderProduct} onClose={() => setOrderProduct(null)} />
    </>
  );
}
