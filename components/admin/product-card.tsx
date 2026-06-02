"use client";

import * as React from "react";
import { Image as ImageIcon, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Product } from "./types";
import { money } from "./utils";
import { ProductDetailModal } from "./product-detail-modal";

export function ProductCard({ product, onUpdate, onDelete, onEdit, t }: {
  product: Product;
  onUpdate: (p: Product) => void;
  onDelete: (id: string) => void;
  onEdit: (p: Product) => void;
  t: (key: string, replacements?: Record<string, string | number>) => string;
}) {
  const [showDetail, setShowDetail] = React.useState(false);
  void onUpdate; void t;

  const discountedPrice = product.discount
    ? Math.round(product.price * (1 - product.discount / 100))
    : null;

  return (
    <>
      <div
        onClick={() => setShowDetail(true)}
        className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-xs hover:shadow-md hover:border-gray-200/80 transition-all duration-200 flex flex-col group cursor-pointer"
      >
        <div className="relative aspect-square bg-gray-50 overflow-hidden">
          {product.imageUrl
            ? <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-8 h-8 text-gray-300" /></div>}
          {product.discount ? (
            <Badge className="absolute top-2.5 left-2.5 bg-[#85241F] text-white text-[9px] font-black px-2 py-0.5 rounded-lg shadow-sm">
              -{product.discount}%
            </Badge>
          ) : null}
          {/* Action buttons */}
          <div
            className="absolute top-2.5 right-2.5 flex gap-1.5 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <Button variant="ghost" size="icon" onClick={() => onEdit(product)}
              className="w-7.5 h-7.5 bg-white/95 backdrop-blur-xs rounded-full shadow flex items-center justify-center hover:bg-gray-100 border border-gray-100 cursor-pointer transition-colors shadow-slate-200/50">
              <Pencil className="w-3.5 h-3.5 text-gray-600" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setShowDetail(true)}
              className="w-7.5 h-7.5 bg-white/95 backdrop-blur-xs rounded-full shadow flex items-center justify-center hover:bg-red-50 border border-gray-100 cursor-pointer transition-colors shadow-slate-200/50">
              <Trash2 className="w-3.5 h-3.5 text-red-500" />
            </Button>
          </div>
        </div>
        <div className="p-3.5 flex-1 flex flex-col justify-between">
          <p className="font-extrabold text-xs text-gray-800 truncate leading-tight">{product.name}</p>
          {product.category ? (
            <Badge variant="outline" className="mt-1 inline-flex w-fit items-center rounded-md bg-slate-50 px-1.5 py-0.5 text-[9px] font-bold text-slate-500">
              {product.category}
            </Badge>
          ) : null}
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
            <div>
              {discountedPrice ? (
                <div>
                  <span className="font-black text-[#85241F] text-xs">{money(discountedPrice)}</span>
                  <span className="text-[9px] text-gray-400 line-through ml-1.5 font-bold">{money(product.price)}</span>
                </div>
              ) : (
                <span className="font-black text-[#85241F] text-xs">{money(product.price)}</span>
              )}
            </div>
            <span className="text-[10px] text-gray-400 font-bold bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-lg">{product.stock} ชิ้น</span>
          </div>
        </div>
      </div>

      {showDetail && (
        <ProductDetailModal
          product={product}
          onEdit={onEdit}
          onDelete={onDelete}
          onClose={() => setShowDetail(false)}
        />
      )}
    </>
  );
}

export default ProductCard;
