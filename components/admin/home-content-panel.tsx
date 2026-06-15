"use client";

import * as React from "react";
import { ChevronDown, Upload, XCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import * as settingsApi from "@/lib/modules/settings";
import type { HomeContent, HomeBlock } from "@/lib/modules/settings";
import { CATEGORIES, type HomeBlockId } from "@/lib/config/catalog";

const BLOCK_LABELS: { id: HomeBlockId; label: string; blockLabel: string }[] = (() => {
  const out: { id: HomeBlockId; label: string; blockLabel: string }[] = [];
  let catIdx = 0;
  for (const category of CATEGORIES) {
    catIdx++;
    out.push({ id: category.id, label: category.label.th, blockLabel: `Block ${catIdx}` });
    let groupIdx = 0;
    for (const group of category.groups ?? []) {
      groupIdx++;
      out.push({ id: group.id, label: group.label.th, blockLabel: `Block ${catIdx}.${groupIdx}` });
    }
  }
  return out;
})();

const emptyBlock = (): HomeBlock => ({ imageUrl: "", title: { th: "" }, subtitle: { th: "" } });

export function HomeContentPanel({
  notify,
  saveRef,
}: {
  notify?: (msg: string) => void;
  saveRef?: React.MutableRefObject<(() => Promise<void>) | null>;
}) {
  const [blocks, setBlocks] = React.useState<Record<string, HomeBlock>>({});
  const [loading, setLoading] = React.useState(true);
  const [openId, setOpenId] = React.useState<string | null>(BLOCK_LABELS[0]?.id ?? null);
  const [uploading, setUploading] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    settingsApi
      .fetchAdminHomeContent()
      .then((res) => {
        if (!active) return;
        if (res.data) setBlocks(res.data.blocks);
        else if (res.error) notify?.(res.error);
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [notify]);

  const block = (id: string): HomeBlock => blocks[id] ?? emptyBlock();

  const update = (id: string, patch: Partial<HomeBlock>) =>
    setBlocks((prev) => ({ ...prev, [id]: { ...block(id), ...patch } }));

  const setTitle = (id: string, lang: "th" | "en", value: string) =>
    update(id, { title: { ...block(id).title, [lang]: value } });
  const setSubtitle = (id: string, lang: "th" | "en", value: string) =>
    update(id, { subtitle: { ...block(id).subtitle, [lang]: value } });

  async function handleImage(id: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(id);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    setUploading(null);
    if (!res.ok) { notify?.("อัปโหลดรูปไม่สำเร็จ"); return; }
    const data = await res.json() as { url: string };
    update(id, { imageUrl: data.url });
  }

  async function save() {
    const payload: HomeContent["blocks"] = {};
    for (const { id } of BLOCK_LABELS) payload[id] = block(id);
    const res = await settingsApi.updateHomeContent({ blocks: payload });
    if (res.error) notify?.(res.error);
    else {
      if (res.data) setBlocks(res.data.blocks);
      notify?.("บันทึกแบนเนอร์หน้าร้านแล้ว");
    }
  }

  React.useEffect(() => {
    if (saveRef) saveRef.current = save;
  });

  if (loading) {
    return <p className="py-10 text-center text-sm text-gray-400">กำลังโหลด...</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {BLOCK_LABELS.map(({ id, label, blockLabel }) => {
        const b = block(id);
        const isOpen = openId === id;
        const hasImage = !!b.imageUrl;
        const hasTitle = !!b.title.th;

        return (
          <div key={id} className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
            {/* Header row — tap to toggle */}
            <button
              type="button"
              onClick={() => setOpenId(isOpen ? null : id)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left cursor-pointer"
            >
              {/* Thumbnail */}
              <div className="h-10 w-10 shrink-0 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center">
                {hasImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={b.imageUrl} alt={label} className="h-full w-full object-cover" />
                ) : (
                  <Upload className="h-4 w-4 text-gray-300" />
                )}
              </div>

              {/* Label + status */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-gray-900 truncate">{blockLabel}</p>
                <p className="text-[10px] font-semibold text-gray-400 truncate mt-0.5">{label}</p>
              </div>

              <ChevronDown className={`h-4 w-4 text-gray-400 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Expanded editor */}
            {isOpen && (
              <div className="px-4 pb-4 flex flex-col gap-3 border-t border-gray-50">
                {/* Image upload */}
                <div className="pt-3">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">รูปภาพ</p>
                  {b.imageUrl ? (
                    <div className="relative w-full aspect-video rounded-xl overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={b.imageUrl} alt={label} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => update(id, { imageUrl: "" })}
                        className="absolute top-2 right-2 h-7 w-7 flex items-center justify-center rounded-full bg-white shadow"
                      >
                        <XCircle className="h-4 w-4 text-gray-500" />
                      </button>
                    </div>
                  ) : (
                    <label
                      htmlFor={`home-img-${id}`}
                      className="flex w-full aspect-video cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 hover:border-[#85241F]/30 transition-colors"
                    >
                      <Upload className={`h-5 w-5 ${uploading === id ? "text-[#85241F] animate-pulse" : "text-gray-300"}`} />
                      <span className="text-xs font-bold text-gray-400">
                        {uploading === id ? "กำลังอัปโหลด..." : "แตะเพื่ออัปโหลดรูป"}
                      </span>
                    </label>
                  )}
                  <input
                    id={`home-img-${id}`}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={!!uploading}
                    onChange={(e) => handleImage(id, e)}
                  />
                </div>

                {/* Text inputs */}
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">หัวข้อ</p>
                  <div className="flex flex-col gap-2">
                    <Input
                      value={b.title.th}
                      onChange={(e) => setTitle(id, "th", e.target.value)}
                      placeholder="หัวข้อ (ไทย)"
                      className="h-10 rounded-xl text-xs"
                    />
                    <Input
                      value={b.title.en ?? ""}
                      onChange={(e) => setTitle(id, "en", e.target.value)}
                      placeholder="Title (EN)"
                      className="h-10 rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">คำอธิบาย</p>
                  <div className="flex flex-col gap-2">
                    <Input
                      value={b.subtitle.th}
                      onChange={(e) => setSubtitle(id, "th", e.target.value)}
                      placeholder="คำอธิบาย (ไทย)"
                      className="h-10 rounded-xl text-xs"
                    />
                    <Input
                      value={b.subtitle.en ?? ""}
                      onChange={(e) => setSubtitle(id, "en", e.target.value)}
                      placeholder="Subtitle (EN)"
                      className="h-10 rounded-xl text-xs"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
