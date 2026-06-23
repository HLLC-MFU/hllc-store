"use client";

import * as React from "react";
import Image from "next/image";
import { Upload, XCircle } from "lucide-react";
import * as settingsApi from "@/lib/modules/settings";
import type { CharmSettings } from "@/lib/modules/settings";
import { CHARM_COLORS } from "@/lib/config/catalog";
import { csrfHeaders } from "@/components/admin/api-client";
import { appPath } from "@/lib/client/app-path";

export function CharmSettingsPanel({ notify, saveRef }: { notify?: (msg: string) => void; saveRef?: React.MutableRefObject<(() => Promise<void>) | null> }) {
  const [images, setImages] = React.useState<Record<string, string>>({});
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [uploading, setUploading] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    settingsApi
      .fetchAdminCharmSettings()
      .then((res) => {
        if (!active) return;
        if (res.data) setImages(res.data.images);
        else if (res.error) notify?.(res.error);
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [notify]);

  async function handleUpload(colorId: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(colorId);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(appPath("/api/upload"), { method: "POST", headers: csrfHeaders(), body: fd });
    setUploading(null);
    if (!res.ok) { notify?.("อัปโหลดรูปไม่สำเร็จ"); return; }
    const data = await res.json() as { url: string };
    setImages((prev) => ({ ...prev, [colorId]: appPath(data.url) }));
  }

  async function save() {
    setSaving(true);
    const res = await settingsApi.updateCharmSettings({ images } as CharmSettings);
    setSaving(false);
    if (res.error) notify?.(res.error);
    else notify?.("บันทึกรูปที่ห้อยแล้ว");
  }

  React.useEffect(() => {
    if (saveRef) saveRef.current = save;
  });

  if (loading) return <div className="py-8 text-center text-sm text-gray-400">กำลังโหลด...</div>;

  void saving;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-sm font-black text-gray-900">รูปภาพที่ห้อย</p>
        <p className="text-xs font-semibold text-gray-400 mt-0.5">อัปโหลดรูปแต่ละสีเพื่อแสดงในหน้าสินค้า</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {CHARM_COLORS.map((color) => {
          const imgUrl = images[color.id] ?? "";
          const isUploading = uploading === color.id;
          return (
            <div key={color.id} className="flex flex-col gap-2 rounded-2xl border border-gray-100 bg-gray-50 p-3">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full border border-white shadow-sm shrink-0" style={{ backgroundColor: color.hex }} />
                <span className="text-xs font-black text-gray-700">{color.label.th}</span>
              </div>

              {imgUrl ? (
                <div className="relative aspect-square">
                  <Image fill src={imgUrl} alt={color.label.th} className="rounded-xl border border-gray-200 object-cover" sizes="120px" />
                  <button
                    type="button"
                    onClick={() => setImages((prev) => ({ ...prev, [color.id]: "" }))}
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow"
                  >
                    <XCircle className="h-4 w-4 text-gray-400" />
                  </button>
                </div>
              ) : (
                <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-gray-200 hover:border-brand/40 transition-colors">
                  <Upload className={`h-4 w-4 ${isUploading ? "text-brand animate-pulse" : "text-gray-400"}`} />
                  <span className="text-[9px] font-bold text-gray-400">{isUploading ? "กำลังอัปโหลด..." : "อัปโหลด"}</span>
                  <input type="file" accept="image/*" className="hidden" disabled={!!uploading} onChange={(e) => handleUpload(color.id, e)} />
                </label>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
