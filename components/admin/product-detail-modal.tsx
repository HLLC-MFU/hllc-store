"use client";

import * as React from "react";
import { Image as ImageIcon, Package, Pencil, Trash2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/lib/client/language-context";
import type { Product } from "./types";
import { money } from "./api-client";

export function ProductDetailModal({ product, onEdit, onDelete, onClose }: {
  product: Product;
  onEdit: (p: Product) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const { t } = useLanguage();
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  const discountedPrice = product.discount
    ? Math.round(product.price * (1 - product.discount / 100))
    : null;

  function handleDelete() {
    onDelete(product.id);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-sm shadow-2xl animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-300 max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image */}
        <div className="relative w-full aspect-video bg-gray-50 shrink-0 overflow-hidden">
          {product.imageUrls && product.imageUrls[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.imageUrls[0]} alt={product.name.th} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-12 h-12 text-gray-200" />
            </div>
          )}
          {product.discount ? (
            <Badge className="absolute top-3 left-3 bg-[#85241F] text-white text-[10px] font-black px-2 py-0.5 rounded-lg">
              -{product.discount}%
            </Badge>
          ) : null}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-xs rounded-full flex items-center justify-center shadow cursor-pointer hover:bg-white transition-colors"
          >
            <XCircle className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-5 flex flex-col gap-4">
          <div>
            <h2 className="font-black text-gray-900 text-lg leading-tight">{product.name.th}</h2>
          </div>

          {/* Price + stock */}
          <div className="flex items-end justify-between">
            <div className="flex flex-col gap-0.5">
              {discountedPrice ? (
                <>
                  <span className="text-2xl font-black text-[#85241F]">{money(discountedPrice)}</span>
                  <span className="text-xs text-gray-400 line-through font-bold">{money(product.price)}</span>
                </>
              ) : (
                <span className="text-2xl font-black text-[#85241F]">{money(product.price)}</span>
              )}
            </div>
            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 rounded-xl px-3 py-1.5">
              <Package className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs font-black text-gray-700">{product.stock} ชิ้น</span>
            </div>
          </div>

          {/* Shipping */}
          {(product.shippingFirstItem > 0 || product.shippingAdditionalItem > 0) && (
            <div className="flex items-center justify-between rounded-xl bg-gray-50 border border-gray-100 px-4 py-3">
              <span className="text-xs font-bold text-gray-500">ค่าส่ง</span>
              <span className="text-xs font-black text-gray-700">
                ชิ้นแรก {product.shippingFirstItem}฿ · เพิ่ม {product.shippingAdditionalItem}฿/ชิ้น
              </span>
            </div>
          )}

          {/* Description */}
          {product.description?.th && (
            <p className="text-xs text-gray-500 leading-relaxed">{product.description.th}</p>
          )}



          {/* Delete confirmation inline */}
          {confirmDelete ? (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex flex-col gap-3">
              <p className="text-sm font-bold text-red-700 text-center">{t("admin.products.edit.delete_modal_title")}</p>
              <p className="text-xs text-red-500 text-center">{t("admin.products.edit.delete_modal_desc")}</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 rounded-xl h-9 text-xs font-bold cursor-pointer border-red-200 text-red-600 hover:bg-red-50"
                >
                  {t("admin.products.edit.delete_modal_cancel")}
                </Button>
                <Button
                  onClick={handleDelete}
                  className="flex-1 rounded-xl h-9 text-xs font-bold bg-red-500 hover:bg-red-600 text-white cursor-pointer shadow-md shadow-red-500/20"
                >
                  {t("admin.products.edit.delete_modal_confirm")}
                </Button>
              </div>
            </div>
          ) : (
            /* Action buttons */
            <div className="flex gap-2 pt-1">
              <Button
                onClick={() => { onEdit(product); onClose(); }}
                className="flex-1 bg-[#85241F] hover:bg-[#B72D2A] rounded-xl h-10 text-xs font-bold cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5 mr-1.5" /> แก้ไข
              </Button>
              <Button
                variant="outline"
                onClick={() => setConfirmDelete(true)}
                className="rounded-xl h-10 px-4 text-xs font-bold text-red-500 border-red-200 hover:bg-red-50 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductDetailModal;
