"use client";

import * as React from "react";
import { Pencil, Upload, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/lib/language-context";
import type { Product } from "./types";
import { money } from "./utils";

export function EditProductModal({ product, onSave, onClose }: {
  product: Product;
  onSave: (p: Product) => void;
  onClose: () => void;
}) {
  const { lang, t } = useLanguage();
  const [form, setForm] = React.useState(() => ({
    ...product,
    name: {
      th: product.name?.th ?? "",
      en: product.name?.en ?? "",
    },
    description: {
      th: product.description?.th ?? "",
      en: product.description?.en ?? "",
    },
  }));
  const [imagePreviews, setImagePreviews] = React.useState<string[]>(() => {
    if (product.imageUrls && product.imageUrls.length > 0) return product.imageUrls;
    return [];
  });
  const [imageError, setImageError] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const MAX_IMAGES = 5;

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    files.slice(0, MAX_IMAGES).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        setImagePreviews((p) => p.length < MAX_IMAGES && !p.includes(result) ? [...p, result] : p);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  }

  function removeImage(idx: number) {
    setImagePreviews((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleSave() {
    if (imagePreviews.length === 0) {
      setImageError(true);
      return;
    }
    setImageError(false);

    onSave({
      ...form,
      name: {
        th: form.name.th.trim(),
        en: form.name.en?.trim() || undefined,
      },
      description: {
        th: form.description.th.trim(),
        en: form.description.en?.trim() || undefined,
      },
      imageUrls: imagePreviews.length > 0 ? imagePreviews : undefined,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-300 max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Pencil className="w-4 h-4 text-[#85241F]" />
            <span className="font-black text-gray-900">{t("admin.products.edit.title")}</span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-8 w-8">
            <XCircle className="w-4 h-4 text-gray-400" />
          </Button>
        </div>

        {/* Form */}
        <div className="overflow-y-auto flex-1 px-5 py-4 flex flex-col gap-3.5">

          {/* Image upload area */}
          <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleFiles} className="hidden" />
          <div className="flex flex-col gap-2">
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {imagePreviews.map((src, idx) => (
                  <div key={idx} className="relative aspect-square">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="w-full h-full object-cover rounded-xl border border-gray-200" />
                    {idx === 0 && (
                      <span className="absolute top-1 left-1 bg-[#85241F] text-white text-[8px] font-black px-1.5 py-0.5 rounded-md">
                        {t("admin.products.image.primary")}
                      </span>
                    )}
                    <button type="button" onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 w-6 h-6 bg-white rounded-full shadow flex items-center justify-center cursor-pointer">
                      <XCircle className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                  </div>
                ))}
                {imagePreviews.length < MAX_IMAGES && (
                  <button type="button" onClick={() => fileRef.current?.click()}
                    className="aspect-square border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-1 hover:border-[#85241F]/30 transition-colors cursor-pointer">
                    <Upload className="w-4 h-4 text-gray-400" />
                    <span className="text-[9px] text-gray-400 font-bold">{t("admin.products.image.add")}</span>
                  </button>
                )}
              </div>
            )}
            {imagePreviews.length === 0 && (
              <button type="button" onClick={() => { fileRef.current?.click(); setImageError(false); }}
                className={`w-full border-2 border-dashed rounded-xl py-6 flex flex-col items-center gap-1.5 transition-colors cursor-pointer ${imageError ? "border-red-400 bg-red-50" : "border-gray-200 hover:border-[#85241F]/30"}`}>
                <Upload className={`w-5 h-5 ${imageError ? "text-red-400" : "text-gray-400"}`} />
                <span className={`text-xs font-bold ${imageError ? "text-red-500" : "text-gray-400"}`}>
                  {imageError ? t("admin.products.image.required") : t("admin.products.image.upload")}
                </span>
                <span className="text-[10px] text-gray-300">
                  {t("admin.products.image.hint", { max: MAX_IMAGES })}
                </span>
              </button>
            )}
          </div>

          {/* Fields */}
          <div>
            <Label className="text-[10px] mb-1.5 block font-bold text-gray-500">{t("admin.products.label.name_th")}</Label>
            <Input value={form.name.th} onChange={(e) => setForm((f) => ({ ...f, name: { ...f.name, th: e.target.value } }))}
              className="rounded-xl border-gray-200 text-xs h-10" />
          </div>
          <div>
            <Label className="text-[10px] mb-1.5 block font-bold text-gray-500">{t("admin.products.label.name_en")}</Label>
            <Input value={form.name.en ?? ""} onChange={(e) => setForm((f) => ({ ...f, name: { ...f.name, en: e.target.value } }))}
              className="rounded-xl border-gray-200 text-xs h-10" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-[10px] mb-1.5 block font-bold text-gray-500">{t("admin.products.label.price_label")}</Label>
              <Input type="number" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))}
                className="rounded-xl border-gray-200 text-xs h-10" />
            </div>
            <div>
              <Label className="text-[10px] mb-1.5 block font-bold text-gray-500">{t("admin.products.label.stock_label")}</Label>
              <Input type="number" value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: Number(e.target.value) }))}
                className="rounded-xl border-gray-200 text-xs h-10" />
            </div>
          </div>

          {form.price > 0 && (
            <p className="text-xs text-gray-400">
              {lang === "th" ? "ราคา: " : "Price: "}
              <span className="font-black text-gray-800">{money(form.price)}</span>
            </p>
          )}

          <div>
            <Label className="text-[10px] mb-1.5 block font-bold text-gray-500">{t("admin.products.label.description_th")}</Label>
            <Textarea value={form.description.th} onChange={(e) => setForm((f) => ({ ...f, description: { ...f.description, th: e.target.value } }))}
              rows={2} className="rounded-xl border-gray-200 text-xs resize-none" />
          </div>
          <div>
            <Label className="text-[10px] mb-1.5 block font-bold text-gray-500">{t("admin.products.label.description_en")}</Label>
            <Textarea value={form.description.en ?? ""} onChange={(e) => setForm((f) => ({ ...f, description: { ...f.description, en: e.target.value } }))}
              rows={2} className="rounded-xl border-gray-200 text-xs resize-none" />
          </div>

          <div className="flex gap-2 pt-1">
            <Button onClick={handleSave} className="flex-1 bg-[#85241F] hover:bg-[#B72D2A] rounded-xl h-10 text-xs font-bold cursor-pointer">
              {t("admin.products.edit.save")}
            </Button>
            <Button onClick={onClose} variant="outline" className="flex-1 rounded-xl h-10 text-xs font-bold cursor-pointer">
              {t("admin.products.edit.delete_modal_cancel")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditProductModal;
