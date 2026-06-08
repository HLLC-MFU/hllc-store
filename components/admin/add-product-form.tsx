"use client";

import * as React from "react";
import { PackagePlus, Pencil, Upload, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/lib/client/language-context";
import type { Product } from "./types";

export function AddProductForm({ onSubmit, onUpdate, notify, t, open: controlledOpen, onClose, product }: {
  onSubmit: (fd: FormData) => void;
  onUpdate?: (p: Product) => void;
  notify: (msg: string) => void;
  t: (key: string, replacements?: Record<string, string | number>) => string;
  open?: boolean;
  onClose?: () => void;
  product?: Product;
}) {
  const isEditMode = !!product;
  const [open, setOpen] = React.useState(false);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : open;
  const handleClose = () => { setOpen(false); onClose?.(); };

  const [imagePreviews, setImagePreviews] = React.useState<string[]>(() => {
    if (product?.imageUrls && product.imageUrls.length > 0) return product.imageUrls;
    if (product?.imageUrl) return [product.imageUrl];
    return [];
  });
  const [imageError, setImageError] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const formRef = React.useRef<HTMLFormElement>(null);
  const { lang } = useLanguage();
  void lang;

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

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (imagePreviews.length === 0) {
      setImageError(true);
      return;
    }
    setImageError(false);
    const fd = new FormData(e.currentTarget);
    if (imagePreviews[0]) fd.set("imageUrl", imagePreviews[0]);
    fd.set("imageUrls", JSON.stringify(imagePreviews));
    fd.set("options", JSON.stringify([]));

    if (isEditMode && onUpdate && product) {
      onUpdate({
        ...product,
        name: {
          th: String(fd.get("name") ?? product.name.th).trim(),
          en: String(fd.get("nameEn") ?? product.name.en ?? "").trim() || undefined,
        },
        price: Number(fd.get("price")) || product.price,
        stock: Number(fd.get("stock")) ?? product.stock,
        shippingFirstItem: Number(fd.get("shippingFirstItem")) || 0,
        shippingAdditionalItem: Number(fd.get("shippingAdditionalItem")) || 0,
        description: {
          th: String(fd.get("description") ?? product.description?.th ?? "").trim(),
          en: String(fd.get("descriptionEn") ?? product.description?.en ?? "").trim() || undefined,
        },
        category: String(fd.get("category") ?? product.category ?? "").trim() || undefined,
        imageUrl: imagePreviews[0] ?? product.imageUrl,
        imageUrls: imagePreviews.length > 0 ? imagePreviews : undefined,
        options: [],
      });
    } else {
      onSubmit(fd);
    }

    formRef.current?.reset();
    setImagePreviews([]);
    handleClose();
  }

  void notify;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            {isEditMode
              ? <Pencil className="w-5 h-5 text-[#85241F]" />
              : <PackagePlus className="w-5 h-5 text-[#85241F]" />}
            <span className="font-black text-gray-900">
              {isEditMode
              ? t("admin.products.edit.title")
              : t("admin.products.add_title")}
            </span>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose} className="rounded-full h-8 w-8">
            <XCircle className="w-4 h-4 text-gray-400" />
          </Button>
        </div>

        {/* Form */}
        <div className="overflow-y-auto flex-1 px-5 py-4">
          <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-3.5">

            {/* Product images */}
            <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleFiles} className="hidden" />
            <div className="flex flex-col gap-2">
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {imagePreviews.map((src, idx) => (
                    <div key={idx} className="relative aspect-square">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" className="w-full h-full object-cover rounded-xl border border-gray-200" />
                      {idx === 0 && (
                        <span className="absolute top-1 left-1 bg-[#85241F] text-white text-[8px] font-black px-1.5 py-0.5 rounded-md">{t("admin.products.image.primary")}</span>
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
                  <span className="text-[10px] text-gray-300">{t("admin.products.image.hint", { max: MAX_IMAGES })}</span>
                </button>
              )}
            </div>

            {/* Basic fields */}
            <div className="grid grid-cols-2 gap-3">
              {/* Name */}
              <div className="col-span-2 grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[10px] mb-1.5 flex items-center gap-1 font-bold text-gray-500">
                    <span>🇹🇭</span> ชื่อสินค้า
                  </Label>
                  <Input name="name" required defaultValue={product?.name.th ?? ""} placeholder="เช่น น้ำดื่ม HLLC" className="rounded-xl border-gray-200 text-xs h-10" />
                </div>
                <div>
                  <Label className="text-[10px] mb-1.5 flex items-center gap-1 font-bold text-gray-500">
                    <span>🇬🇧</span> Product Name
                  </Label>
                  <Input name="nameEn" defaultValue={product?.name.en ?? ""} placeholder="e.g. HLLC Water" className="rounded-xl border-gray-200 text-xs h-10" />
                </div>
              </div>

              {/* Price & Stock */}
              <div>
                <Label className="text-[10px] mb-1.5 block font-bold text-gray-500">ราคา (฿)</Label>
                <Input name="price" type="number" min="0" required defaultValue={product?.price ?? ""} placeholder="0" className="rounded-xl border-gray-200 text-xs h-10" />
              </div>
              <div>
                <Label className="text-[10px] mb-1.5 block font-bold text-gray-500">จำนวนสต็อก</Label>
                <Input name="stock" type="number" min="0" required defaultValue={product?.stock ?? ""} placeholder="0" className="rounded-xl border-gray-200 text-xs h-10" />
              </div>

              {/* Shipping */}
              <div>
                <Label className="text-[10px] mb-1.5 block font-bold text-gray-500">ค่าส่งชิ้นแรก (฿)</Label>
                <Input name="shippingFirstItem" type="number" min="0" defaultValue={product?.shippingFirstItem ?? 0} placeholder="0" className="rounded-xl border-gray-200 text-xs h-10" />
              </div>
              <div>
                <Label className="text-[10px] mb-1.5 block font-bold text-gray-500">ค่าส่งชิ้นถัดไป (฿)</Label>
                <Input name="shippingAdditionalItem" type="number" min="0" defaultValue={product?.shippingAdditionalItem ?? 0} placeholder="0" className="rounded-xl border-gray-200 text-xs h-10" />
              </div>

              {/* Category */}
              <div className="col-span-2">
                <Label className="text-[10px] mb-1.5 block font-bold text-gray-500">หมวดหมู่</Label>
                <Input name="category" defaultValue={product?.category ?? ""} placeholder="เช่น เครื่องดื่ม, เสื้อผ้า" className="rounded-xl border-gray-200 text-xs h-10" />
              </div>

              {/* Description */}
              <div className="col-span-2 grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[10px] mb-1.5 flex items-center gap-1 font-bold text-gray-500">
                    <span>🇹🇭</span> รายละเอียด
                  </Label>
                  <Textarea name="description" rows={2} defaultValue={product?.description?.th ?? ""} placeholder="รายละเอียดภาษาไทย..." className="rounded-xl border-gray-200 text-xs resize-none" />
                </div>
                <div>
                  <Label className="text-[10px] mb-1.5 flex items-center gap-1 font-bold text-gray-500">
                    <span>🇬🇧</span> Description
                  </Label>
                  <Textarea name="descriptionEn" rows={2} defaultValue={product?.description?.en ?? ""} placeholder="Description in English..." className="rounded-xl border-gray-200 text-xs resize-none" />
                </div>
              </div>
            </div>


            <Button type="submit" className="bg-[#85241F] hover:bg-[#B72D2A] rounded-xl h-11 w-full text-xs font-bold shadow-md shadow-[#85241F]/10 cursor-pointer transition-all active:scale-98">
              {isEditMode
                ? <><Pencil className="w-4 h-4 mr-1" /> {t("admin.products.edit.save")}</>
                : <><PackagePlus className="w-4 h-4 mr-1" /> {t("admin.products.add_title")}</>}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AddProductForm;
