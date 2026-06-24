"use client";

import * as React from "react";
import NextImage from "next/image";
import { AlertCircle, Check, DollarSign, FileText, Image, PackagePlus, Pencil, Plus, Upload, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PLACEMENTS, placementByValue, placementValue } from "@/lib/config/catalog";
import { csrfHeaders } from "@/components/admin/api-client";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Product } from "./types";
import { appPath } from "@/lib/client/app-path";

function toSlug(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function AddProductForm({ onSubmit, onUpdate, notify, t, open: controlledOpen, onClose, product }: {
  onSubmit: (fd: FormData) => Promise<void>;
  onUpdate?: (p: Product) => Promise<void>;
  notify: (msg: string, type?: "success" | "error") => void;
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
  type BottleColor = { id: string; label: string; labelEn: string; imageUrl: string };
  const [bottleColors, setBottleColors] = React.useState<BottleColor[]>(() => {
    if (product?.category !== "bottle" || !product?.options?.length) return [];
    return product.options.map((opt, i) => ({ id: String(i), label: opt.label, labelEn: opt.labelEn ?? "", imageUrl: opt.imageUrl ?? "" }));
  });
  const [colorUploading, setColorUploading] = React.useState<string | null>(null);

  function addBottleColor() {
    setBottleColors(prev => [{ id: `${Date.now()}`, label: "", labelEn: "", imageUrl: "" }, ...prev]);
  }
  function removeBottleColor(id: string) {
    setBottleColors(prev => prev.filter(c => c.id !== id));
  }
  function updateBottleColor(id: string, patch: Partial<BottleColor>) {
    setBottleColors(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c));
  }

  async function handleColorUpload(colorId: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setColorUploading(colorId);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const productSlug = product?.slug ?? toSlug(nameValue);
      if (productSlug) fd.append("slug", `${productSlug}-option-${colorId}`);
      const res = await fetch(appPath("/api/upload"), { method: "POST", headers: csrfHeaders(), body: fd });
      if (!res.ok) throw new Error();
      const data = await res.json() as { url: string };
      updateBottleColor(colorId, { imageUrl: appPath(data.url) });
    } catch {
      notify("อัปโหลดรูปไม่สำเร็จ");
    } finally {
      setColorUploading(null);
    }
  }

  const [allowCustomName, setAllowCustomName] = React.useState(product?.allowCustomName ?? false);
  const [customNameMaxLength, setCustomNameMaxLength] = React.useState(product?.customNameMaxLength ?? 12);
  const [step, setStep] = React.useState(1);
  const [nameValue, setNameValue] = React.useState(product?.name.th ?? "");
  const [priceValue, setPriceValue] = React.useState(String(product?.price ?? ""));
  const [stockValue, setStockValue] = React.useState(String(product?.stock ?? ""));
  const [descItemsTh, setDescItemsTh] = React.useState<string[]>(() => {
    const lines = (product?.description?.th ?? "").split("\n").map(l => l.replace(/^[•\-*]\s*/, "").trim()).filter(Boolean);
    return lines.length > 0 ? lines : [""];
  });
  const [descItemsEn, setDescItemsEn] = React.useState<string[]>(() => {
    const lines = (product?.description?.en ?? "").split("\n").map(l => l.replace(/^[•\-*]\s*/, "").trim()).filter(Boolean);
    return lines.length > 0 ? lines : [""];
  });
  const [descLang, setDescLang] = React.useState<"th" | "en">("th");
  const [fieldErrors, setFieldErrors] = React.useState<Set<string>>(new Set());
  const TOTAL_STEPS = 3;

  function markError(field: string) {
    setFieldErrors(prev => new Set([...prev, field]));
  }
  function clearError(field: string) {
    setFieldErrors(prev => { const s = new Set(prev); s.delete(field); return s; });
  }
  function err(field: string) {
    return fieldErrors.has(field);
  }

  function validateStep1(): string[] {
    const missing: string[] = [];
    if (imagePreviews.length === 0) { markError("image"); missing.push("รูปสินค้า"); } else clearError("image");
    if (!nameValue.trim()) { markError("name"); missing.push("ชื่อสินค้า (TH)"); } else clearError("name");
    if (!placement) { markError("placement"); missing.push("หมวดหมู่สินค้า"); } else clearError("placement");
    return missing;
  }

  function validateStep2(): string[] {
    const missing: string[] = [];
    if (!priceValue.trim() || isNaN(Number(priceValue))) { markError("price"); missing.push("ราคา"); } else clearError("price");
    if (!stockValue.trim() || isNaN(Number(stockValue))) { markError("stock"); missing.push("จำนวนสต็อก"); } else clearError("stock");
    return missing;
  }

  function validateStep3(): string[] {
    const missing: string[] = [];
    if (!descItemsTh.some(l => l.trim())) { markError("descriptionTh"); missing.push("รายละเอียด (TH)"); } else clearError("descriptionTh");
    if (!descItemsEn.some(l => l.trim())) { markError("descriptionEn"); missing.push("Description (EN)"); } else clearError("descriptionEn");
    return missing;
  }

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
      const productSlug = product?.slug ?? toSlug(nameValue);
      const uploadSuffix = Date.now().toString(36);
      const uploads = await Promise.all(
        files.slice(0, MAX_IMAGES).map(async (file, i) => {
          const fd = new FormData();
          fd.append("file", file);
          const slugBase = productSlug ? `${productSlug}-${uploadSuffix}` : null;
          if (slugBase) fd.append("slug", i === 0 ? slugBase : `${slugBase}-${i + 1}`);
          const res = await fetch(appPath("/api/upload"), { method: "POST", headers: csrfHeaders(), body: fd });
          if (!res.ok) throw new Error("Upload failed");
          const data = await res.json() as { url: string };
          return appPath(data.url);
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
    const bottleOptions = placement === "bottle"
      ? bottleColors.filter(c => c.label.trim()).map(c => ({ label: c.label, labelEn: c.labelEn || undefined, imageUrl: c.imageUrl }))
      : [];
    fd.set("options", JSON.stringify(bottleOptions));
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
        description: {
          th: descItemsTh.filter(Boolean).join("\n") || product.description?.th || "",
          en: descItemsEn.filter(Boolean).join("\n") || undefined,
        },
        category: placementByValue(placement)?.category,
        group: placementByValue(placement)?.group,
        charmType: placementByValue(placement)?.charmType,
        allowCustomName,
        customNameMaxLength,
        imageUrl: imagePreviews[0] ?? product.imageUrl,
        imageUrls: imagePreviews.length > 0 ? imagePreviews : undefined,
        options: placement === "bottle"
          ? bottleColors.filter(c => c.label.trim()).map(c => ({ label: c.label, labelEn: c.labelEn || undefined, imageUrl: c.imageUrl }))
          : [],
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center sm:p-4 animate-in fade-in duration-200">
      <div className={`bg-white w-full shadow-2xl animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-300 flex flex-col ${step === 3 ? "sm:rounded-3xl sm:max-w-2xl h-[100dvh] sm:h-auto sm:max-h-[90vh]" : "rounded-3xl max-w-md max-h-[90vh]"}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            {isEditMode
              ? <Pencil className="w-5 h-5 text-brand" />
              : <PackagePlus className="w-5 h-5 text-brand" />}
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
                const circleColors = done
                  ? "bg-emerald-500 text-white"
                  : active
                  ? "bg-brand text-white"
                  : "bg-gray-100 text-gray-600";
                return (
                  <React.Fragment key={n}>
                    <div className="flex flex-col items-center gap-1 min-w-0">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${circleColors}`}>
                        {done ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : <s.Icon className="w-3.5 h-3.5" />}
                      </div>
                      <span className={`text-[9px] font-black whitespace-nowrap ${active ? "text-brand" : done ? "text-emerald-600" : "text-gray-300"}`}>{s.label}</span>
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
        <div className={`px-5 pb-5 flex-1 ${step === 3 ? "flex flex-col overflow-hidden min-h-0" : "overflow-y-auto"}`}>
          <form
            ref={formRef}
            onSubmit={handleSubmit}
            noValidate
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.target as HTMLElement).tagName !== "TEXTAREA") {
                e.preventDefault();
              }
            }}
            className={step === 3 ? "flex flex-col flex-1 min-h-0" : ""}
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
                        <NextImage fill src={src} alt="" className="object-cover rounded-xl border border-gray-200" sizes="(max-width: 640px) 50vw, 200px" />
                        {idx === 0 && (
                          <span className="absolute top-1 left-1 bg-brand text-white text-[8px] font-black px-1.5 py-0.5 rounded-md">{t("admin.products.image.primary")}</span>
                        )}
                        <button type="button" onClick={() => removeImage(idx)} disabled={uploading}
                          className="absolute top-1 right-1 w-6 h-6 bg-white rounded-full shadow flex items-center justify-center cursor-pointer">
                          <XCircle className="w-3.5 h-3.5 text-gray-400" />
                        </button>
                      </div>
                    ))}
                    {imagePreviews.length < MAX_IMAGES && (
                      <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                        className="aspect-square border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-1 hover:border-brand/30 transition-colors cursor-pointer disabled:opacity-50">
                        <Upload className="w-4 h-4 text-gray-400" />
                        <span className="text-[9px] text-gray-400 font-bold">{uploading ? "กำลังอัปโหลด..." : t("admin.products.image.add")}</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <button type="button" onClick={() => { fileRef.current?.click(); setImageError(false); clearError("image"); }} disabled={uploading}
                    className={`w-full border-2 border-dashed rounded-xl py-6 flex flex-col items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 ${imageError || err("image") ? "border-red-400 bg-red-50" : "border-gray-200 hover:border-brand/30"}`}>
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
                  <Input name="name" required value={nameValue} onChange={(e) => { setNameValue(e.target.value); if (e.target.value.trim()) clearError("name"); }} placeholder="เช่น น้ำดื่ม HLLC" className={`rounded-xl text-xs h-10 ${err("name") ? "border-red-400 focus-visible:ring-red-300" : "border-gray-200"}`} />
                </div>
                <div>
                  <Label className="text-[10px] mb-1.5 flex items-center gap-1 font-bold text-gray-500"><span className="bg-gray-100 text-gray-500 px-1 py-0.5 rounded text-[8px] font-black leading-none">EN</span> Product Name</Label>
                  <Input name="nameEn" defaultValue={product?.name.en ?? ""} placeholder="e.g. HLLC Water" className={`rounded-xl text-xs h-10 ${err("name") ? "border-red-400 focus-visible:ring-red-300" : "border-gray-200"}`} />
                </div>
              </div>

              {/* Placement */}
              <div>
                <Label className="text-[10px] mb-1.5 block font-bold text-gray-500">หมวดหมู่สินค้า</Label>
                <Select value={placement} onValueChange={(v) => { setPlacement(v); clearError("placement"); }}>
                  <SelectTrigger className={`h-10 text-xs rounded-xl ${err("placement") ? "border-red-400" : ""}`}>
                    <SelectValue placeholder="— เลือกหมวดหมู่ —" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>สินค้าทั่วไป</SelectLabel>
                      <SelectItem value="bottle">ขวดน้ำ</SelectItem>
                      <SelectItem value="secret-set">Secret Set</SelectItem>
                    </SelectGroup>
                    <SelectSeparator />
                  </SelectContent>
                </Select>
              </div>

              {/* ตัวเลือกสี — เฉพาะขวดน้ำ */}
              {placement === "bottle" && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">ตัวเลือกสี <span className="normal-case font-medium tracking-normal text-gray-300">(ไม่บังคับ)</span></p>
                    <button type="button" onClick={addBottleColor}
                      className="flex items-center gap-1 text-[10px] font-black text-brand hover:text-brand-hover transition-colors">
                      <Plus className="h-3 w-3" /> เพิ่มสี
                    </button>
                  </div>
                  {bottleColors.length === 0 ? (
                    <p className="py-3 text-center text-[10px] text-gray-300">ยังไม่มีสี — กด "เพิ่มสี" เพื่อเพิ่ม</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {bottleColors.map(color => {
                        const isUp = colorUploading === color.id;
                        return (
                          <div key={color.id} className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-2.5 py-2">
                            {color.imageUrl ? (
                              <div className="relative h-11 w-11 shrink-0">
                                <NextImage src={color.imageUrl} alt={color.label} width={44} height={44} className="h-full w-full rounded-lg border border-gray-200 object-cover" />
                                <button type="button" onClick={() => updateBottleColor(color.id, { imageUrl: "" })}
                                  className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-white shadow">
                                  <XCircle className="h-3 w-3 text-gray-400" />
                                </button>
                              </div>
                            ) : (
                              <label className="flex h-11 w-11 shrink-0 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-lg border-2 border-dashed border-gray-200 hover:border-brand/40 transition-colors">
                                <Upload className={`h-3 w-3 ${isUp ? "text-brand animate-pulse" : "text-gray-300"}`} />
                                <span className="text-[7px] font-bold text-gray-300">{isUp ? "..." : "รูป"}</span>
                                <input type="file" accept="image/*" className="hidden" disabled={!!colorUploading || uploading}
                                  onChange={(e) => handleColorUpload(color.id, e)} />
                              </label>
                            )}
                            <div className="flex flex-1 min-w-0 flex-col gap-1.5">
                              <input
                                type="text"
                                value={color.label}
                                onChange={(e) => updateBottleColor(color.id, { label: e.target.value })}
                                placeholder="ชื่อสี เช่น ฟ้า, แดง"
                                className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-1 focus:ring-brand/30"
                              />
                              <input
                                type="text"
                                value={color.labelEn}
                                onChange={(e) => updateBottleColor(color.id, { labelEn: e.target.value })}
                                placeholder="Color name e.g. Blue"
                                className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-1 focus:ring-brand/30"
                              />
                            </div>
                            <button type="button" onClick={() => removeBottleColor(color.id)}
                              className="shrink-0 text-gray-300 hover:text-red-400 transition-colors">
                              <XCircle className="h-4 w-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── Step 2: ราคา + สต็อก + ค่าส่ง ── */}
            <div className={step !== 2 ? "hidden" : "flex flex-col gap-3.5"}>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">ขั้นตอน 2 — ราคา & ค่าส่ง</p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[10px] mb-1.5 block font-bold text-gray-500">ราคา (฿)</Label>
                  <Input name="price" type="number" min="0" required value={priceValue} onChange={(e) => { setPriceValue(e.target.value); if (e.target.value.trim()) clearError("price"); }} placeholder="0" className={`rounded-xl text-xs h-10 ${err("price") ? "border-red-400 focus-visible:ring-red-300" : "border-gray-200"}`} />
                </div>
                <div>
                  <Label className="text-[10px] mb-1.5 block font-bold text-gray-500">จำนวนสต็อก</Label>
                  <Input name="stock" type="number" min="0" required value={stockValue} onChange={(e) => { setStockValue(e.target.value); if (e.target.value.trim()) clearError("stock"); }} placeholder="0" className={`rounded-xl text-xs h-10 ${err("stock") ? "border-red-400 focus-visible:ring-red-300" : "border-gray-200"}`} />
                </div>

              </div>
            </div>

            {/* ── Step 3: รายละเอียด ── */}
            <div className={step !== 3 ? "hidden" : "flex flex-col gap-3 flex-1 min-h-0"}>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">ขั้นตอน 3 — รายละเอียดสินค้า</p>

              {/* Custom name — bottle only */}
              {placement === "bottle" && (
                <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5">
                  <label className="flex items-center justify-between gap-2 cursor-pointer">
                    <span className="text-[11px] font-bold text-gray-600">ให้ลูกค้าใส่ชื่อกำหนดเอง (สติกเกอร์ชื่อ)</span>
                    <input type="checkbox" checked={allowCustomName} onChange={(e) => setAllowCustomName(e.target.checked)} className="h-4 w-4 accent-brand" />
                  </label>
                  {allowCustomName && (
                    <div className="mt-2.5 flex items-center gap-2">
                      <Label className="text-[10px] font-bold text-gray-500">จำนวนตัวอักษรสูงสุด</Label>
                      <Input type="number" min="1" max="40" value={customNameMaxLength} onChange={(e) => setCustomNameMaxLength(Number(e.target.value) || 12)} className="rounded-xl border-gray-200 text-xs h-9 w-20" />
                    </div>
                  )}
                </div>
              )}

              {/* hidden inputs so FormData still works for new-product path */}
              <input type="hidden" name="description" value={descItemsTh.filter(Boolean).join("\n")} />
              <input type="hidden" name="descriptionEn" value={descItemsEn.filter(Boolean).join("\n")} />

              {/* TH / EN tab switcher */}
              <div className="flex rounded-xl bg-gray-100 p-1 gap-1">
                <button type="button" onClick={() => setDescLang("th")}
                  className={`flex-1 rounded-lg py-1.5 text-xs font-black transition-all ${descLang === "th" ? "bg-white shadow text-gray-900" : "text-gray-400"}`}>
                  <span className="mr-1.5 bg-gray-200 text-gray-500 px-1 py-0.5 rounded text-[8px] font-black leading-none">TH</span>
                  รายละเอียด {err("descriptionTh") && <span className="text-red-400 ml-1">!</span>}
                </button>
                <button type="button" onClick={() => setDescLang("en")}
                  className={`flex-1 rounded-lg py-1.5 text-xs font-black transition-all ${descLang === "en" ? "bg-white shadow text-gray-900" : "text-gray-400"}`}>
                  <span className="mr-1.5 bg-gray-200 text-gray-500 px-1 py-0.5 rounded text-[8px] font-black leading-none">EN</span>
                  Description {err("descriptionEn") && <span className="text-red-400 ml-1">!</span>}
                </button>
              </div>

              {/* Bullet editor — TH */}
              <div className={descLang !== "th" ? "hidden" : "flex flex-col gap-1.5 flex-1 min-h-0"}>
                <div className={`rounded-xl border flex flex-col overflow-y-auto flex-1 ${err("descriptionTh") ? "border-red-400 bg-red-50/40" : "border-gray-200"}`}>
                  <div className="p-3 flex flex-col gap-2 flex-1">
                    {descItemsTh.map((item, i) => (
                      <div key={i} className="flex items-start gap-2 group">
                        <span className="text-brand shrink-0 text-sm mt-2 leading-none">•</span>
                        <input
                          value={item}
                          autoFocus={i === descItemsTh.length - 1 && item === ""}
                          onChange={(e) => {
                            const next = [...descItemsTh]; next[i] = e.target.value;
                            setDescItemsTh(next);
                            if (next.some(l => l.trim())) clearError("descriptionTh");
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") { e.preventDefault(); const next = [...descItemsTh]; next.splice(i + 1, 0, ""); setDescItemsTh(next); }
                            if (e.key === "Backspace" && item === "" && descItemsTh.length > 1) { e.preventDefault(); setDescItemsTh(descItemsTh.filter((_, j) => j !== i)); }
                          }}
                          placeholder="พิมพ์รายละเอียด..."
                          className="flex-1 text-sm py-1.5 bg-transparent outline-none placeholder:text-gray-300 border-b border-transparent focus:border-gray-200 transition-colors"
                        />
                        {descItemsTh.length > 1 && (
                          <button type="button" onClick={() => setDescItemsTh(descItemsTh.filter((_, j) => j !== i))}
                            className="shrink-0 mt-1.5 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity">
                            <XCircle className="w-4 h-4 text-gray-300 hover:text-red-400" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="px-3 pb-3 border-t border-gray-100 pt-2">
                    <button type="button" onClick={() => setDescItemsTh([...descItemsTh, ""])}
                      className="flex items-center gap-1.5 text-xs text-brand/70 font-bold hover:text-brand transition-colors">
                      <Plus className="w-3.5 h-3.5" /> เพิ่มรายการ
                    </button>
                  </div>
                </div>
              </div>

              {/* Bullet editor — EN */}
              <div className={descLang !== "en" ? "hidden" : "flex flex-col gap-1.5 flex-1 min-h-0"}>
                <div className={`rounded-xl border flex flex-col overflow-y-auto flex-1 ${err("descriptionEn") ? "border-red-400 bg-red-50/40" : "border-gray-200"}`}>
                  <div className="p-3 flex flex-col gap-2 flex-1">
                    {descItemsEn.map((item, i) => (
                      <div key={i} className="flex items-start gap-2 group">
                        <span className="text-brand shrink-0 text-sm mt-2 leading-none">•</span>
                        <input
                          value={item}
                          autoFocus={i === descItemsEn.length - 1 && item === ""}
                          onChange={(e) => {
                            const next = [...descItemsEn]; next[i] = e.target.value;
                            setDescItemsEn(next);
                            if (next.some(l => l.trim())) clearError("descriptionEn");
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") { e.preventDefault(); const next = [...descItemsEn]; next.splice(i + 1, 0, ""); setDescItemsEn(next); }
                            if (e.key === "Backspace" && item === "" && descItemsEn.length > 1) { e.preventDefault(); setDescItemsEn(descItemsEn.filter((_, j) => j !== i)); }
                          }}
                          placeholder="Type description..."
                          className="flex-1 text-sm py-1.5 bg-transparent outline-none placeholder:text-gray-300 border-b border-transparent focus:border-gray-200 transition-colors"
                        />
                        {descItemsEn.length > 1 && (
                          <button type="button" onClick={() => setDescItemsEn(descItemsEn.filter((_, j) => j !== i))}
                            className="shrink-0 mt-1.5 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity">
                            <XCircle className="w-4 h-4 text-gray-300 hover:text-red-400" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="px-3 pb-3 border-t border-gray-100 pt-2">
                    <button type="button" onClick={() => setDescItemsEn([...descItemsEn, ""])}
                      className="flex items-center gap-1.5 text-xs text-brand/70 font-bold hover:text-brand transition-colors">
                      <Plus className="w-3.5 h-3.5" /> Add item
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className={`flex gap-2 ${step === 3 ? "mt-auto pt-4" : "mt-5"}`}>
              {step > 1 && (
                <Button type="button" variant="outline" onClick={() => setStep((s) => s - 1)} className="flex-1 rounded-xl h-11 text-xs font-bold">
                  ย้อนกลับ
                </Button>
              )}
              {step < TOTAL_STEPS ? (
                <Button
                  type="button"
                  disabled={uploading}
                  onClick={() => {
                    const missing = step === 1 ? validateStep1() : step === 2 ? validateStep2() : [];
                    if (missing.length > 0) {
                      notify(`กรุณากรอก: ${missing.join(", ")}`, "error");
                      return;
                    }
                    blockSubmit.current = true;
                    setFieldErrors(new Set());
                    setStep((s) => s + 1);
                    setTimeout(() => { blockSubmit.current = false; }, 400);
                  }}
                  className="flex-1 bg-brand hover:bg-brand-hover rounded-xl h-11 text-xs font-bold text-white disabled:opacity-40"
                >
                  ถัดไป →
                </Button>
              ) : (
                <Button
                  type="button"
                  disabled={uploading}
                  onClick={() => {
                    const missing = validateStep3();
                    if (missing.length > 0) {
                      notify(`กรุณากรอก: ${missing.join(", ")}`, "error");
                      return;
                    }
                    formRef.current?.requestSubmit();
                  }}
                  className="flex-1 bg-brand hover:bg-brand-hover rounded-xl h-11 text-xs font-bold shadow-md shadow-brand/10 disabled:opacity-50"
                >
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
              className="mt-4 h-11 w-full rounded-2xl bg-brand text-xs font-bold text-white shadow-md shadow-brand/10 hover:bg-brand-hover"
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
