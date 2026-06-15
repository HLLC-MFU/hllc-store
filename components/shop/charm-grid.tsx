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
      <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={`shrink-0 rounded-full px-4 py-2 text-[11px] font-black transition-all duration-200 ${
              filter === tab.id
                ? "bg-[#85241F] text-white shadow-md shadow-[#85241F]/30 scale-[1.04]"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200 active:scale-95"
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
