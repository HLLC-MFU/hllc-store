"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Plus, Minus, Image as ImageIcon } from "lucide-react";
import { useLanguage } from "@/lib/client/language-context";
import { useCart } from "@/lib/client/cart";
import { useCartFly } from "@/lib/client/cart-fly";
import { CHARM_TYPES } from "@/lib/config/catalog";
import type { ShopProduct } from "./category-grid";

type Filter = "all" | "clip" | "dangle";

const fmt = new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 });
const money = (v: number) => fmt.format(v);

/* ── Card ────────────────────────────────────────────────────────── */
function CharmCard({ product, lang }: { product: ShopProduct; lang: "th" | "en" }) {
  const { items, addItem, updateQty } = useCart();
  const { flyToCart } = useCartFly();
  const { t } = useLanguage();
  const addBtnRef = React.useRef<HTMLButtonElement>(null);

  const hasOptions = product.options.length > 0;

  const cartCount = items
    .filter(i => i.productId === product.id)
    .reduce((sum, i) => sum + i.quantity, 0);

  const directItem = !hasOptions ? items.find(i => i.productId === product.id) : undefined;
  const directQty = directItem?.quantity ?? 0;

  const isOutOfStock = hasOptions
    ? product.options.every(o => (o.stock ?? product.stock) < 1)
    : product.stock < 1;

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock || hasOptions) return;
    addItem({ productId: product.id, name: product.name, price: product.price, imageUrl: product.imageUrl, stock: product.stock });
    if (addBtnRef.current) flyToCart(addBtnRef.current, product.imageUrl);
  }

  function handleIncrease(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!directItem || directQty >= product.stock) return;
    updateQty(product.id, directQty + 1, undefined, directItem.customName);
  }

  function handleDecrease(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!directItem) return;
    updateQty(product.id, directQty - 1, undefined, directItem.customName);
  }

  return (
    <Link
      href={`/products/${product.id}`}
      className={`relative block bg-white shadow-sm border border-gray-100 active:scale-[0.97] transition-transform ${isOutOfStock ? "opacity-60" : ""}`}
    >
      {/* Cart badge top-left */}
      {cartCount > 0 && (
        <div className="absolute top-2 left-2 z-10 min-w-5 h-5 rounded-full bg-brand text-white text-[10px] font-black flex items-center justify-center px-1 shadow-md">
          {cartCount}
        </div>
      )}

      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        {product.imageUrl ? (
          <Image fill src={product.imageUrl} alt={product.name[lang] || product.name.th} className="object-cover" sizes="(max-width: 640px) 50vw, 25vw" quality={90} />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ImageIcon className="h-10 w-10 text-gray-200" />
          </div>
        )}
        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60">
            <span className="text-[10px] font-bold text-gray-400">
              {t("charm.out_of_stock")}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="px-3 py-2.5">
        <p className="truncate text-[11px] font-semibold text-gray-700 leading-tight">
          {product.name[lang] || product.name.th}
        </p>
        <div className="mt-2 flex items-center justify-between">
          <p className="text-sm font-black text-gray-900">{money(product.price)}</p>

          {!hasOptions && directQty > 0 ? (
            <div className="flex items-center gap-1.5 shrink-0">
              <button type="button" onClick={handleDecrease}
                className="flex h-5 w-5 items-center justify-center rounded border border-gray-300 text-gray-500 active:bg-gray-100 transition-colors">
                <Minus className="h-2.5 w-2.5" />
              </button>
              <span className="w-4 text-center text-xs font-black text-gray-800">{directQty}</span>
              <button type="button" onClick={handleIncrease} disabled={directQty >= product.stock}
                className="flex h-5 w-5 items-center justify-center rounded border border-brand text-brand disabled:opacity-30 active:bg-brand active:text-white transition-colors">
                <Plus className="h-2.5 w-2.5" />
              </button>
            </div>
          ) : (
            <button ref={addBtnRef} type="button" onClick={handleAdd} disabled={isOutOfStock || hasOptions}
              className="flex h-6 w-6 items-center justify-center rounded border border-brand text-brand disabled:opacity-25 active:bg-brand active:text-white transition-colors shrink-0">
              <ShoppingCart className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}

/* ── Grid ────────────────────────────────────────────────────────── */
export function CharmGrid({ products }: { products: ShopProduct[] }) {
  const { lang, t } = useLanguage();
  const [filter, setFilter] = React.useState<Filter>("all");

  const tabs: { id: Filter; label: string }[] = [
    { id: "all", label: t("charm.filter_all") },
    ...CHARM_TYPES.map(c => ({ id: c.id as Filter, label: c.label[lang] || c.label.th })),
  ];

  const visible = filter === "all" ? products : products.filter(p => p.charmType === filter);

  const groups = React.useMemo(() => {
    if (filter !== "all") return [{ label: null, items: visible }];
    return CHARM_TYPES.map(ct => ({
      label: ct.label[lang] || ct.label.th,
      items: products.filter(p => p.charmType === ct.id),
    })).filter(g => g.items.length > 0);
  }, [filter, visible, products, lang]);

  return (
    <div className="flex flex-col gap-4">
      {/* Filter tabs */}
      <div className="flex justify-center gap-5 overflow-x-auto scrollbar-none border-gray-100">
        {tabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={`relative shrink-0 pb-2.5 text-xs transition-colors duration-150 ${
              filter === tab.id ? "font-black text-gray-900" : "font-medium text-gray-400"
            }`}
          >
            {tab.label}
            {filter === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-brand" />
            )}
          </button>
        ))}
      </div>

      {/* Groups */}
      <div className="flex flex-col gap-5">
        {groups.map((group, gi) => (
          <div key={group.label ?? "all"}>
            {gi > 0 && (
              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px bg-gray-100" />
                <div className="flex gap-1">
                  <div className="w-1 h-1 rounded-full bg-brand/30" />
                  <div className="w-1.5 h-1.5 rounded-full bg-brand/50" />
                  <div className="w-1 h-1 rounded-full bg-brand/30" />
                </div>
                <div className="flex-1 h-px bg-gray-100" />
              </div>
            )}
            {group.label && (
              <p className="mb-3 text-[11px] font-black uppercase tracking-widest text-gray-400">
                {group.label}
              </p>
            )}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
              {group.items.map(p => (
                <CharmCard key={p.id} product={p} lang={lang} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
