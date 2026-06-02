"use client";

import * as React from "react";
import { Package, Search, XCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Product } from "@/components/admin/types";
import ProductCard from "@/components/admin/product-card";

type ProductsPanelProps = {
  products: Product[];
  onUpdateProduct: (updated: Product) => Promise<void>;
  onDeleteProduct: (id: string) => Promise<void>;
  onEditProduct: (p: Product) => void;
  lang: string;
  t: (key: string) => string;
};

export function ProductsPanel({
  products,
  onUpdateProduct,
  onDeleteProduct,
  onEditProduct,
  lang,
  t,
}: ProductsPanelProps) {
  const [productSearch, setProductSearch] = React.useState("");

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
        <h2 className="font-bold text-gray-900 text-sm shrink-0">{t("admin.tab.products")}</h2>
        <div className="flex-1 flex items-center gap-3 rounded-2xl border border-gray-200/60 bg-white px-4 py-3 shadow-2xs focus-within:border-[#85241F] focus-within:ring-2 focus-within:ring-[#85241F]/5 transition-all">
          <Search className="h-4 w-4 shrink-0 text-gray-400" />
          <Input
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            placeholder={lang === "th" ? "ค้นหาสินค้า..." : "Search products..."}
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

      {/* Product grid — full width */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
          {filteredProducts.map((p) => (
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
      ) : (
        <div className="bg-white border border-gray-100 rounded-3xl py-16 flex flex-col items-center justify-center text-center shadow-2xs">
          <Package className="w-8 h-8 text-gray-300 mb-2" />
          <p className="text-xs text-gray-400 font-semibold">{t("admin.products.empty")}</p>
        </div>
      )}
    </div>
  );
}
