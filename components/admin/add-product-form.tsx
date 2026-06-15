"use client";

import * as React from "react";
import { AlertCircle, Check, DollarSign, FileText, Image, PackagePlus, Pencil, Upload, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PLACEMENTS, placementByValue, placementValue } from "@/lib/config/catalog";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Product } from "./types";

export function AddProductForm({ onSubmit, onUpdate, notify, t, open: controlledOpen, onClose, product }: {
  onSubmit: (fd: FormData) => Promise<void>;
  onUpdate?: (p: Product) => Promise<void>;
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
  const [validationMissing, setValidationMissing] = React.useState<string[] | null>(null);
  const handleClose = () => {
    setValidationMissing(null);
    setImageError(false);
    setStep(1);
    setOpen(false);
    onClose?.();
  };

  const [imagePreviews, setImagePreviews] = React.useState<string[]>(() => {
    if (product?.imageUrls && product.imageUrls.length > 0) return product.imageUrls;
    if (product?.imageUrl) return [product.imageUrl];
    return [];
  });
  const [imageError, setImageError] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const formRef = React.useRef<HTMLFormElement>(null);
  const blockSubmit = React.useRef(false);
  const [placement, setPlacement] = React.useState(() =>
    placementValue(product?.category, product?.group, product?.charmType),
  );
  const [allowCustomName, setAllowCustomName] = React.useState(product?.allowCustomName ?? false);
  const [customNameMaxLength, setCustomNameMaxLength] = React.useState(product?.customNameMaxLength ?? 12);
  const [step, setStep] = React.useState(1);
  const [nameValue, setNameValue] = React.useState(product?.name.th ?? "");
  const [priceValue, setPriceValue] = React.useState(String(product?.price ?? ""));
  const [stockValue, setStockValue] = React.useState(String(product?.stock ?? ""));
  const TOTAL_STEPS = 3;

  const step1Valid = imagePreviews.length > 0 && nameValue.trim().length > 0 && !!placement;
  const step2Valid = priceValue.trim() !== "" && stockValue.trim() !== "";

  const MAX_IMAGES = 5;
  const [uploading, setUploading] = React.useState(false);

  function formText(fd: FormData, name: string) {
    return String(fd.get(name) ?? "").trim();
  }

  function hasValidNumber(fd: FormData, name: string) {
    const raw = formText(fd, name);
    if (!raw) return false;
    const value = Number(raw);
    return Number.isFinite(value) && value >= 0;
  }

  function getMissingFields(fd: FormData) {
    const missing: string[] = [];
    const requiredNumbers = [
      ["price", "ราคา"],
      ["stock", "จำนวนสต็อก"],
      ["shippingFirstItem", "ค่าส่งชิ้นแรก"],
      ["shippingAdditionalItem", "ค่าส่งชิ้นถัดไป"],
      ["remoteShippingFirstItem", "ค่าส่งห่างไกล ชิ้นแรก"],
      ["remoteShippingAdditionalItem", "ค่าส่งห่างไกล ชิ้นถัดไป"],
      ["islandShippingFirstItem", "ค่าส่งพื้นที่พิเศษ ชิ้นแรก"],
      ["islandShippingAdditionalItem", "ค่าส่งพื้นที่พิเศษ ชิ้นถัดไป"],
    ] as const;

    if (imagePreviews.length === 0) missing.push("รูปสินค้าอย่างน้อย 1 รูป");
    if (!formText(fd, "name")) missing.push("ชื่อสินค้า (TH)");
    requiredNumbers.forEach(([name, label]) => {
      if (!hasValidNumber(fd, name)) missing.push(label);
    });
    if (!placement || !placementByValue(placement)) missing.push("หมวดหมู่สินค้า");
    if (allowCustomName && (!Number.isInteger(customNameMaxLength) || customNameMaxLength < 1 || customNameMaxLength > 40)) {
      missing.push("จำนวนตัวอักษรสูงสุดของสติกเกอร์ชื่อ");
    }

    return missing;
  }

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;

    setUploading(true);
    try {
      const uploads = await Promise.all(
        files.slice(0, MAX_IMAGES).map(async (file) => {
          const fd = new FormData();
          fd.append("file", file);
          const res = await fetch("/api/upload", { method: "POST", body: fd });
          if (!res.ok) throw new Error("Upload failed");
          const data = await res.json() as { url: string };
          return data.url;
        }),
      );
      setImagePreviews((prev) => {
        const next = [...prev];
        for (const url of uploads) {
          if (next.length < MAX_IMAGES && !next.includes(url)) next.push(url);
        }
        return next;
      });
    } catch {
      notify("อัปโหลดรูปไม่สำเร็จ");
    } finally {
      setUploading(false);
    }
  }

  function removeImage(idx: number) {
    setImagePreviews((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (blockSubmit.current) return;
    const fd = new FormData(e.currentTarget);
    const missingFields = getMissingFields(fd);

    if (missingFields.length > 0) {
      setValidationMissing(missingFields);
      return;
    }
    if (imagePreviews[0]) fd.set("imageUrl", imagePreviews[0]);
    fd.set("imageUrls", JSON.stringify(imagePreviews));
    fd.set("options", JSON.stringify([]));
    fd.set("placement", placement);
    fd.set("allowCustomName", allowCustomName ? "true" : "");
    fd.set("customNameMaxLength", String(customNameMaxLength));

    if (isEditMode && onUpdate && product) {
      try {
        await onUpdate({
        ...product,
        name: {
          th: String(fd.get("name") ?? product.name.th).trim(),
          en: String(fd.get("nameEn") ?? product.name.en ?? "").trim() || undefined,
        },
        price: Number(fd.get("price")) || product.price,
        stock: Number(fd.get("stock")) ?? product.stock,
        shippingFirstItem: Number(fd.get("shippingFirstItem")) || 0,
        shippingAdditionalItem: Number(fd.get("shippingAdditionalItem")) || 0,
        remoteShippingFirstItem: Number(fd.get("remoteShippingFirstItem")) || 0,
        remoteShippingAdditionalItem: Number(fd.get("remoteShippingAdditionalItem")) || 0,
        islandShippingFirstItem: Number(fd.get("islandShippingFirstItem")) || 0,
        islandShippingAdditionalItem: Number(fd.get("islandShippingAdditionalItem")) || 0,
        description: {
          th: String(fd.get("description") ?? product.description?.th ?? "").trim(),
          en: String(fd.get("descriptionEn") ?? product.description?.en ?? "").trim() || undefined,
        },
        category: placementByValue(placement)?.category,
        group: placementByValue(placement)?.group,
        charmType: placementByValue(placement)?.charmType,
        allowCustomName,
        customNameMaxLength,
        imageUrl: imagePreviews[0] ?? product.imageUrl,
        imageUrls: imagePreviews.length > 0 ? imagePreviews : undefined,
        options: [],
        });
      } catch {
        return;
      }
    } else {
      try {
        await onSubmit(fd);
      } catch {
        return;
      }
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

        {/* Step indicator */}
        {(() => {
          const steps = [
            { label: "รูป & ชื่อ", Icon: Image },
            { label: "ราคา & ค่าส่ง", Icon: DollarSign },
            { label: "รายละเอียด", Icon: FileText },
          ];
          return (
            <div className="flex items-center px-5 pt-2 pb-3 gap-0">
              {steps.map((s, i) => {
                const n = i + 1;
                const done = n < step;
                const active = n === step;
                return (
                  <React.Fragment key={n}>
                    <div className="flex flex-col items-center gap-1 min-w-0">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${done ? "bg-emerald-500 text-white" : active ? "bg-[#85241F] text-white" : "bg-gray-100 text-gray-400"}`}>
                        {done ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : <s.Icon className="w-3.5 h-3.5" />}
                      </div>
                      <span className={`text-[9px] font-black whitespace-nowrap ${active ? "text-[#85241F]" : done ? "text-emerald-600" : "text-gray-300"}`}>{s.label}</span>
                    </div>
                    {i < steps.length - 1 && (
                      <div className={`flex-1 h-0.5 mb-4 mx-1 rounded-full transition-all ${n < step ? "bg-emerald-400" : "bg-gray-100"}`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          );
        })()}

        {/* Form */}
        <div className="overflow-y-auto flex-1 px-5 pb-5">
          <form
            ref={formRef}
            onSubmit={handleSubmit}
            noValidate
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.target as HTMLElement).tagName !== "TEXTAREA") {
                e.preventDefault();
              }
            }}
          >
            <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleFiles} className="hidden" disabled={uploading} />

            {/* ── Step 1: รูป + ชื่อ + หมวดหมู่ ── */}
            <div className={step !== 1 ? "hidden" : "flex flex-col gap-3.5"}>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">ขั้นตอน 1 — รูปภาพ & ข้อมูลหลัก</p>

              {/* Images */}
              <div className="flex flex-col gap-2">
                {imagePreviews.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {imagePreviews.map((src, idx) => (
                      <div key={idx} className="relative aspect-square">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt="" className="w-full h-full object-cover rounded-xl border border-gray-200" />
                        {idx === 0 && (
                          <span className="absolute top-1 left-1 bg-[#85241F] text-white text-[8px] font-black px-1.5 py-0.5 rounded-md">{t("admin.products.image.primary")}</span>
                        )}
                        <button type="button" onClick={() => removeImage(idx)} disabled={uploading}
                          className="absolute top-1 right-1 w-6 h-6 bg-white rounded-full shadow flex items-center justify-center cursor-pointer">
                          <XCircle className="w-3.5 h-3.5 text-gray-400" />
                        </button>
                      </div>
                    ))}
                    {imagePreviews.length < MAX_IMAGES && (
                      <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                        className="aspect-square border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-1 hover:border-[#85241F]/30 transition-colors cursor-pointer disabled:opacity-50">
                        <Upload className="w-4 h-4 text-gray-400" />
                        <span className="text-[9px] text-gray-400 font-bold">{uploading ? "กำลังอัปโหลด..." : t("admin.products.image.add")}</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <button type="button" onClick={() => { fileRef.current?.click(); setImageError(false); }} disabled={uploading}
                    className={`w-full border-2 border-dashed rounded-xl py-6 flex flex-col items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 ${imageError ? "border-red-400 bg-red-50" : "border-gray-200 hover:border-[#85241F]/30"}`}>
                    <Upload className={`w-5 h-5 ${imageError ? "text-red-400" : "text-gray-400"}`} />
                    <span className={`text-xs font-bold ${imageError ? "text-red-500" : "text-gray-400"}`}>
                      {uploading ? "กำลังอัปโหลด..." : imageError ? t("admin.products.image.required") : t("admin.products.image.upload")}
                    </span>
                    <span className="text-[10px] text-gray-300">{t("admin.products.image.hint", { max: MAX_IMAGES })}</span>
                  </button>
                )}
              </div>

              {/* Name */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[10px] mb-1.5 flex items-center gap-1 font-bold text-gray-500"><span className="bg-gray-100 text-gray-500 px-1 py-0.5 rounded text-[8px] font-black leading-none">TH</span> ชื่อสินค้า</Label>
                  <Input name="name" required value={nameValue} onChange={(e) => setNameValue(e.target.value)} placeholder="เช่น น้ำดื่ม HLLC" className="rounded-xl border-gray-200 text-xs h-10" />
                </div>
                <div>
                  <Label className="text-[10px] mb-1.5 flex items-center gap-1 font-bold text-gray-500"><span className="bg-gray-100 text-gray-500 px-1 py-0.5 rounded text-[8px] font-black leading-none">EN</span> Product Name</Label>
                  <Input name="nameEn" defaultValue={product?.name.en ?? ""} placeholder="e.g. HLLC Water" className="rounded-xl border-gray-200 text-xs h-10" />
                </div>
              </div>

              {/* Placement */}
              <div>
                <Label className="text-[10px] mb-1.5 block font-bold text-gray-500">หมวดหมู่สินค้า</Label>
                <Select value={placement} onValueChange={(v) => setPlacement(v)}>
                  <SelectTrigger className="h-10 text-xs rounded-xl">
                    <SelectValue placeholder="— เลือกหมวดหมู่ —" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>สินค้าทั่วไป</SelectLabel>
                      <SelectItem value="bottle">ขวดน้ำ</SelectItem>
                      <SelectItem value="secret-set">Secret Set</SelectItem>
                      <SelectItem value="bracelet">สร้อยข้อมือพร้อมชาร์ม</SelectItem>
                    </SelectGroup>
                    <SelectSeparator />
                    <SelectGroup>
                      <SelectLabel>Charm</SelectLabel>
                      <SelectItem value="charm-dangle">ที่ห้อย (Dangle)</SelectItem>
                      <SelectItem value="charm-clip">ที่ล็อค (Clip-on)</SelectItem>
                      <SelectItem value="charm-spacer">ที่กั้น (Spacer)</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* ── Step 2: ราคา + สต็อก + ค่าส่ง ── */}
            <div className={step !== 2 ? "hidden" : "flex flex-col gap-3.5"}>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">ขั้นตอน 2 — ราคา & ค่าส่ง</p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[10px] mb-1.5 block font-bold text-gray-500">ราคา (฿)</Label>
                  <Input name="price" type="number" min="0" required value={priceValue} onChange={(e) => setPriceValue(e.target.value)} placeholder="0" className="rounded-xl border-gray-200 text-xs h-10" />
                </div>
                <div>
                  <Label className="text-[10px] mb-1.5 block font-bold text-gray-500">จำนวนสต็อก</Label>
                  <Input name="stock" type="number" min="0" required value={stockValue} onChange={(e) => setStockValue(e.target.value)} placeholder="0" className="rounded-xl border-gray-200 text-xs h-10" />
                </div>

                <div className="col-span-2">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">ค่าส่งปกติ</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[10px] mb-1.5 block font-bold text-gray-500">ชิ้นแรก (฿)</Label>
                      <Input name="shippingFirstItem" type="number" min="0" defaultValue={product?.shippingFirstItem ?? 50} placeholder="50" className="rounded-xl border-gray-200 text-xs h-10" />
                    </div>
                    <div>
                      <Label className="text-[10px] mb-1.5 block font-bold text-gray-500">ชิ้นถัดไป (฿)</Label>
                      <Input name="shippingAdditionalItem" type="number" min="0" defaultValue={product?.shippingAdditionalItem ?? 10} placeholder="10" className="rounded-xl border-gray-200 text-xs h-10" />
                    </div>
                  </div>
                </div>

                <div className="col-span-2">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">ค่าส่งห่างไกล</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[10px] mb-1.5 block font-bold text-gray-500">ชิ้นแรก (฿)</Label>
                      <Input name="remoteShippingFirstItem" type="number" min="0" defaultValue={product?.remoteShippingFirstItem ?? 80} placeholder="80" className="rounded-xl border-gray-200 text-xs h-10" />
                    </div>
                    <div>
                      <Label className="text-[10px] mb-1.5 block font-bold text-gray-500">ชิ้นถัดไป (฿)</Label>
                      <Input name="remoteShippingAdditionalItem" type="number" min="0" defaultValue={product?.remoteShippingAdditionalItem ?? 15} placeholder="15" className="rounded-xl border-gray-200 text-xs h-10" />
                    </div>
                  </div>
                </div>

                <div className="col-span-2">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">ค่าส่งพื้นที่พิเศษ</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[10px] mb-1.5 block font-bold text-gray-500">ชิ้นแรก (฿)</Label>
                      <Input name="islandShippingFirstItem" type="number" min="0" defaultValue={product?.islandShippingFirstItem ?? 100} placeholder="100" className="rounded-xl border-gray-200 text-xs h-10" />
                    </div>
                    <div>
                      <Label className="text-[10px] mb-1.5 block font-bold text-gray-500">ชิ้นถัดไป (฿)</Label>
                      <Input name="islandShippingAdditionalItem" type="number" min="0" defaultValue={product?.islandShippingAdditionalItem ?? 15} placeholder="15" className="rounded-xl border-gray-200 text-xs h-10" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Step 3: รายละเอียด ── */}
            <div className={step !== 3 ? "hidden" : "flex flex-col gap-3.5"}>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">ขั้นตอน 3 — รายละเอียดสินค้า</p>

              {/* Custom name — bottle only */}
              {placement === "bottle" && (
                <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5">
                  <label className="flex items-center justify-between gap-2 cursor-pointer">
                    <span className="text-[11px] font-bold text-gray-600">ให้ลูกค้าใส่ชื่อกำหนดเอง (สติกเกอร์ชื่อ)</span>
                    <input type="checkbox" checked={allowCustomName} onChange={(e) => setAllowCustomName(e.target.checked)} className="h-4 w-4 accent-[#85241F]" />
                  </label>
                  {allowCustomName && (
                    <div className="mt-2.5 flex items-center gap-2">
                      <Label className="text-[10px] font-bold text-gray-500">จำนวนตัวอักษรสูงสุด</Label>
                      <Input type="number" min="1" max="40" value={customNameMaxLength} onChange={(e) => setCustomNameMaxLength(Number(e.target.value) || 12)} className="rounded-xl border-gray-200 text-xs h-9 w-20" />
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[10px] mb-1.5 flex items-center gap-1 font-bold text-gray-500"><span className="bg-gray-100 text-gray-500 px-1 py-0.5 rounded text-[8px] font-black leading-none">TH</span> รายละเอียด</Label>
                  <Textarea name="description" rows={4} defaultValue={product?.description?.th ?? ""} placeholder="รายละเอียดภาษาไทย..." className="rounded-xl border-gray-200 text-xs resize-none" />
                </div>
                <div>
                  <Label className="text-[10px] mb-1.5 flex items-center gap-1 font-bold text-gray-500"><span className="bg-gray-100 text-gray-500 px-1 py-0.5 rounded text-[8px] font-black leading-none">EN</span> Description</Label>
                  <Textarea name="descriptionEn" rows={4} defaultValue={product?.description?.en ?? ""} placeholder="Description in English..." className="rounded-xl border-gray-200 text-xs resize-none" />
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className={`flex gap-2 mt-5`}>
              {step > 1 && (
                <Button type="button" variant="outline" onClick={() => setStep((s) => s - 1)} className="flex-1 rounded-xl h-11 text-xs font-bold">
                  ย้อนกลับ
                </Button>
              )}
              {step < TOTAL_STEPS ? (
                <Button
                  type="button"
                  onClick={() => {
                    blockSubmit.current = true;
                    setStep((s) => s + 1);
                    setTimeout(() => { blockSubmit.current = false; }, 400);
                  }}
                  disabled={uploading || (step === 1 && !step1Valid) || (step === 2 && !step2Valid)}
                  className="flex-1 bg-[#85241F] hover:bg-[#B72D2A] rounded-xl h-11 text-xs font-bold text-white disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  ถัดไป →
                </Button>
              ) : (
                <Button type="submit" disabled={uploading} className="flex-1 bg-[#85241F] hover:bg-[#B72D2A] rounded-xl h-11 text-xs font-bold shadow-md shadow-[#85241F]/10 disabled:opacity-50">
                  {isEditMode
                    ? <><Pencil className="w-4 h-4 mr-1" /> บันทึก</>
                    : <><Check className="w-4 h-4 mr-1" /> เสร็จสิ้น</>}
                </Button>
              )}
            </div>
          </form>
        </div>
      </div>
      {validationMissing && (
        <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl border border-red-100 bg-white p-5 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-500">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-black text-gray-950">กรอกข้อมูลยังไม่ครบ</h3>
                <p className="mt-1 text-xs leading-relaxed text-gray-500">
                  กรุณาใส่ข้อมูลที่จำเป็นต่อไปนี้ก่อนบันทึกสินค้า
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-red-100 bg-red-50/60 p-3">
              <ul className="space-y-2">
                {validationMissing.map((field) => (
                  <li key={field} className="flex items-center gap-2 text-xs font-bold text-red-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                    <span>{field}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Button
              type="button"
              onClick={() => setValidationMissing(null)}
              className="mt-4 h-11 w-full rounded-2xl bg-[#85241F] text-xs font-bold text-white shadow-md shadow-[#85241F]/10 hover:bg-[#B72D2A]"
            >
              กลับไปกรอกข้อมูล
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AddProductForm;
