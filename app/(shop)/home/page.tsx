"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Image as ImageIcon, Truck } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { LanguageChip } from "@/components/shared/language-chip";

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
  const { lang, t } = useLanguage();

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
      {loading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-3xl bg-gray-100 animate-pulse aspect-3/4" />
          ))}
        </div>
      ) : null}
      {!loading && error ? <div className="text-center py-16"><p className="text-sm font-semibold text-[#85241F]">{error}</p></div> : null}
      {!loading && !error && filteredProducts.length === 0 ? <div className="text-center py-16"><p className="text-sm text-gray-400">{t("shop.no_category")}</p></div> : null}

      {!loading && !error && filteredProducts.length > 0 && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((p) => (
            <Link key={p.id} href={`/products/${p.id}`}
              className="group block cursor-pointer rounded-3xl bg-white shadow-[0_4px_20px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.13)] transition-all duration-300 overflow-hidden active:scale-[0.98]">
              {/* Image — full width, no frame */}
              <div className="relative aspect-square bg-[#f5f5f5] overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}{p.imageUrl
                  ? <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  : <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-12 h-12 text-gray-200" /></div>}
                {p.stock < 1 && <span className="absolute bottom-2 left-2 rounded-xl bg-gray-900/75 px-2 py-0.5 text-[10px] font-bold text-white">{t("shop.out_of_stock")}</span>}
              </div>
              {/* Info */}
              <div className="px-4 py-3.5 flex flex-col gap-0.5">
                <p className="truncate text-sm font-black text-gray-900">{p.name}</p>
                <p className="mt-2 text-base font-black text-[#85241F]">{money(p.price)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );

  return (
    <>
      <div className="shop-page lg:hidden flex flex-col bg-white min-h-screen relative">
        <div className="absolute right-5 top-6 z-30"><LanguageChip /></div>
        <div className="pt-4 pb-4">
          <div className="flex justify-center">
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
              <LanguageChip />
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
