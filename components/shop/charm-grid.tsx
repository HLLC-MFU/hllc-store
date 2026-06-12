"use client";

import * as React from "react";
import { useLanguage } from "@/lib/client/language-context";
import { CHARM_TYPES } from "@/lib/config/catalog";
import { CategoryGrid, type ShopProduct } from "./category-grid";

type Filter = "all" | "clip" | "dangle";

/** Charm catalog: a product grid with clip/dangle filter tabs (ทั้งหมด / ที่ lock / ที่ห้อย). */
export function CharmGrid({ products }: { products: ShopProduct[] }) {
  const { lang } = useLanguage();
  const [filter, setFilter] = React.useState<Filter>("all");

  const tabs: { id: Filter; label: string }[] = [
    { id: "all", label: lang === "th" ? "ทั้งหมด" : "All" },
    ...CHARM_TYPES.map((c) => ({ id: c.id as Filter, label: c.label[lang] || c.label.th })),
  ];

  const visible = filter === "all" ? products : products.filter((p) => p.charmType === filter);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={`shrink-0 rounded-2xl px-4 py-2 text-xs font-black transition-colors ${
              filter === tab.id
                ? "bg-[#85241F] text-white"
                : "border border-gray-200 bg-white text-gray-500 hover:border-[#85241F]/30"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <CategoryGrid products={visible} />
    </div>
  );
}
