"use client";

import * as React from "react";
import { Pencil, Upload, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Product } from "./types";
import { money } from "./utils";

export function EditProductModal({ product, onSave, onClose }: {
  product: Product;
  onSave: (p: Product) => void;
  onClose: () => void;
}) {
  const [form, setForm] = React.useState({ ...product });
  const [imagePreview, setImagePreview] = React.useState(product.imageUrl ?? "");
  const fileRef = React.useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setImagePreview(result);
      setForm((f) => ({ ...f, imageUrl: result }));
    };
    reader.readAsDataURL(file);
  }

  function handleSave() {
    onSave({ ...form, imageUrl: imagePreview || undefined });
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-300 max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Pencil className="w-4 h-4 text-[#85241F]" />
            <span className="font-black text-gray-900">แก้ไขสินค้า</span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-8 w-8">
            <XCircle className="w-4 h-4 text-gray-400" />
          </Button>
        </div>

        {/* Form */}
        <div className="overflow-y-auto flex-1 px-5 py-4 flex flex-col gap-3.5">

          {/* Image */}
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
          {imagePreview ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imagePreview} alt="preview" className="w-full h-40 object-cover rounded-xl border border-gray-200" />
              <button type="button" onClick={() => fileRef.current?.click()}
                className="absolute bottom-2 right-2 bg-white/95 rounded-xl px-3 py-1.5 text-[10px] font-bold shadow flex items-center gap-1 border border-gray-100 cursor-pointer hover:bg-gray-50">
                <Upload className="w-3 h-3 text-[#85241F]" /> เปลี่ยนรูป
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-200 rounded-xl py-6 flex flex-col items-center gap-1.5 hover:border-[#85241F]/30 transition-colors cursor-pointer">
              <Upload className="w-5 h-5 text-gray-400" />
              <span className="text-xs text-gray-400 font-bold">อัปโหลดรูป</span>
            </button>
          )}

          {/* Fields */}
          <div>
            <Label className="text-[10px] mb-1.5 block font-bold text-gray-500">ชื่อสินค้า</Label>
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="rounded-xl border-gray-200 text-xs h-10" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-[10px] mb-1.5 block font-bold text-gray-500">ราคา</Label>
              <Input type="number" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))}
                className="rounded-xl border-gray-200 text-xs h-10" />
            </div>
            <div>
              <Label className="text-[10px] mb-1.5 block font-bold text-gray-500">สต็อก</Label>
              <Input type="number" value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: Number(e.target.value) }))}
                className="rounded-xl border-gray-200 text-xs h-10" />
            </div>
          </div>

          {form.price > 0 && (
            <p className="text-xs text-gray-400">ราคา: <span className="font-black text-gray-800">{money(form.price)}</span></p>
          )}

          <div>
            <Label className="text-[10px] mb-1.5 block font-bold text-gray-500">คำอธิบาย</Label>
            <Textarea value={form.description ?? ""} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3} className="rounded-xl border-gray-200 text-xs resize-none" />
          </div>

          <div className="flex gap-2 pt-1">
            <Button onClick={handleSave} className="flex-1 bg-[#85241F] hover:bg-[#B72D2A] rounded-xl h-10 text-xs font-bold cursor-pointer">
              บันทึก
            </Button>
            <Button onClick={onClose} variant="outline" className="flex-1 rounded-xl h-10 text-xs font-bold cursor-pointer">
              ยกเลิก
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditProductModal;
