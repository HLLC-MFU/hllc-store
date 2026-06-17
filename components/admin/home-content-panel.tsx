"use client";

import * as React from "react";
import { Upload, XCircle } from "lucide-react";
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {BLOCK_LABELS.map(({ id, label, blockLabel }) => {
        const b = block(id);

        return (
          <div key={id} className="rounded-2xl border border-gray-100 bg-white overflow-hidden flex flex-col">
            {/* Card header */}
            <div className="flex items-center gap-2 px-4 pt-4 pb-2">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{blockLabel}</span>
              <span className="text-[10px] text-gray-300">·</span>
              <span className="text-[10px] font-semibold text-gray-500 truncate">{label}</span>
            </div>

            {/* Image */}
            {id !== "charm" && <div className="px-4">
              {b.imageUrl ? (
                <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={b.imageUrl} alt={label} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => update(id, { imageUrl: "" })}
                    className="absolute top-2 right-2 h-7 w-7 flex items-center justify-center rounded-full bg-white shadow cursor-pointer"
                  >
                    <XCircle className="h-4 w-4 text-gray-500" />
                  </button>
                </div>
              ) : (
                <label
                  htmlFor={`home-img-${id}`}
                  className="flex w-full aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 hover:border-brand/30 transition-colors bg-gray-50"
                >
                  <Upload className={`h-5 w-5 ${uploading === id ? "text-brand animate-pulse" : "text-gray-300"}`} />
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
            </div>}

            {/* Text inputs */}
            <div className="px-4 pb-4 pt-3 flex flex-col gap-2 flex-1">
              <div className="flex flex-col gap-1.5">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">หัวข้อ</p>
                <Input value={b.title.th} onChange={(e) => setTitle(id, "th", e.target.value)} placeholder="หัวข้อ (ไทย)" className="h-9 rounded-xl text-xs" />
                <Input value={b.title.en ?? ""} onChange={(e) => setTitle(id, "en", e.target.value)} placeholder="Title (EN)" className="h-9 rounded-xl text-xs" />
              </div>
              <div className="flex flex-col gap-1.5">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">คำอธิบาย</p>
                <Input value={b.subtitle.th} onChange={(e) => setSubtitle(id, "th", e.target.value)} placeholder="คำอธิบาย (ไทย)" className="h-9 rounded-xl text-xs" />
                <Input value={b.subtitle.en ?? ""} onChange={(e) => setSubtitle(id, "en", e.target.value)} placeholder="Subtitle (EN)" className="h-9 rounded-xl text-xs" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
