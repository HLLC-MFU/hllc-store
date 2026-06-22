"use client";

import * as React from "react";
import { Package, Search, XCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Product } from "@/components/admin/types";
import ProductCard from "@/components/admin/product-card";
import { placementValue } from "@/lib/config/catalog";

type ProductsPanelProps = {
  products: Product[];
  onUpdateProduct: (updated: Product) => Promise<void>;
  onDeleteProduct: (id: string) => Promise<void>;
  onEditProduct: (p: Product) => void;
  t: (key: string) => string;
};

export function ProductsPanel({
  products,
  onUpdateProduct,
  onDeleteProduct,
  onEditProduct,
  t,
}: ProductsPanelProps) {
  const [productSearch, setProductSearch] = React.useState("");

  const GROUPS = [
    { key: "bottle",       label: "ขวดน้ำ"          },
    { key: "secret-set",   label: "Secret Set"       },
    { key: "bracelet",     label: "สร้อย"             },
    { key: "charm-dangle", label: "Charm — ที่ห้อย"  },
    { key: "charm-spacer", label: "Charm — ที่กั้น"  },
    { key: "charm-clip",   label: "Charm — ที่ล็อค"  },
  ];

  function productGroup(p: Product): string {
    return placementValue(p.category, p.group, p.charmType);
  }

  const filteredProducts = React.useMemo(() => {
    const query = productSearch.trim().toLowerCase();
    return products.filter((product) => {
      if (!query) return true;
      const nameTh = product.name.th.toLowerCase();
      const nameEn = product.name.en?.toLowerCase() ?? "";
      const descTh = product.description?.th.toLowerCase() ?? "";
      const descEn = product.description?.en?.toLowerCase() ?? "";
      return (
        nameTh.includes(query) ||
        nameEn.includes(query) ||
        descTh.includes(query) ||
        descEn.includes(query)
      );
    });
  }, [products, productSearch]);

  return (
    <div className="flex flex-col gap-4">
      {/* Header row — title + search */}
      <div className="flex items-center gap-3">
        <div className="flex-1 flex items-center gap-3 rounded-2xl border border-gray-200/60 bg-white px-4 py-3 shadow-2xs focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/5 transition-all">
          <Search className="h-4 w-4 shrink-0 text-gray-400" />
          <Input
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            placeholder={t("admin.products.search_placeholder")}
            className="flex-1 border-none bg-transparent text-xs text-gray-800 placeholder:text-gray-400 shadow-none focus-visible:ring-0 p-0 h-auto"
          />
          {productSearch && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setProductSearch("")}
              className="text-gray-400 hover:text-gray-600 h-auto w-auto p-0 cursor-pointer"
            >
              <XCircle className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Product grid grouped by type */}
      {filteredProducts.length > 0 ? (
        <div className="flex flex-col gap-6">
          {GROUPS.map((group, gi) => {
            const items = filteredProducts.filter(p => productGroup(p) === group.key);
            if (items.length === 0) return null;
            return (
              <div key={group.key}>
                {gi > 0 && <hr className="mb-6 border-gray-100" />}
                <p className="mb-3 text-[11px] font-black uppercase tracking-widest text-gray-400">
                  {group.label}
                  <span className="ml-2 font-semibold normal-case tracking-normal text-gray-300">({items.length})</span>
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
                  {items.map(p => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      onUpdate={onUpdateProduct}
                      onDelete={onDeleteProduct}
                      onEdit={onEditProduct}
                      t={t}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-3xl py-16 flex flex-col items-center justify-center text-center shadow-2xs">
          <Package className="w-8 h-8 text-gray-300 mb-2" />
          <p className="text-xs text-gray-400 font-semibold">{t("admin.products.empty")}</p>
        </div>
      )}
    </div>
  );
}
