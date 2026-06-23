"use client";

import * as React from "react";
import Image from "next/image";
import { Upload, XCircle, Clock, ShoppingBag, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import * as settingsApi from "@/lib/modules/settings";
import type { HomeContent, HomeBlock } from "@/lib/modules/settings";
import { type HomeBlockId } from "@/lib/config/catalog";
import { csrfHeaders } from "@/components/admin/api-client";
import { appPath } from "@/lib/client/app-path";

const BLOCK_LABELS: { id: HomeBlockId; label: string; blockLabel: string; homepage?: boolean }[] = [
  { id: "bottle",     label: "ขวดน้ำ",   blockLabel: "Block 1", homepage: true },
  { id: "secret-set", label: "Secret Set", blockLabel: "Block 3", homepage: true },
];

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
    const res = await fetch(appPath("/api/upload"), { method: "POST", headers: csrfHeaders(), body: fd });
    setUploading(null);
    if (!res.ok) { notify?.("อัปโหลดรูปไม่สำเร็จ"); return; }
    const data = await res.json() as { url: string };
    update(id, { imageUrl: appPath(data.url) });
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
      {BLOCK_LABELS.map(({ id, label, blockLabel, homepage }) => {
        const b = block(id);

        return (
          <div key={id} className="rounded-2xl border border-gray-100 bg-white overflow-hidden flex flex-col">
            {/* Card header */}
            <div className="flex items-center gap-2 px-4 pt-4 pb-2">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{blockLabel}</span>
              <span className="text-[10px] text-gray-300">·</span>
              <span className="text-[10px] font-semibold text-gray-500 truncate">{label}</span>
              <div className="ml-auto flex items-center gap-2 shrink-0">
                {homepage && (
                  <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-black text-emerald-600">หน้าแรก</span>
                )}
                {(() => {
                  const status = b.blockStatus ?? "open";
                  const next = status === "open" ? "comingSoon" : status === "comingSoon" ? "closed" : "open";
                  const cfg = {
                    open:       { label: "เปิดขาย",    icon: ShoppingBag, cls: "bg-emerald-50 text-emerald-700" },
                    comingSoon: { label: "เร็วๆ นี้",   icon: Clock,       cls: "bg-amber-100 text-amber-700"   },
                    closed:     { label: "ปิดการขาย",  icon: EyeOff,      cls: "bg-red-50 text-red-600"        },
                  } as const;
                  const { label, icon: Icon, cls } = cfg[status];
                  return (
                    <button
                      type="button"
                      title={`คลิกเพื่อเปลี่ยนเป็น: ${cfg[next].label}`}
                      onClick={() => update(id, { blockStatus: next })}
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-black transition-colors cursor-pointer ${cls}`}
                    >
                      <Icon className="w-2.5 h-2.5" />
                      {label}
                    </button>
                  );
                })()}
              </div>
            </div>

            {/* Image */}
            {id !== "charm" && <div className="px-4">
              {b.imageUrl ? (
                <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden">
                  <Image fill src={b.imageUrl} alt={label} className="object-cover" sizes="(max-width: 640px) 100vw, 480px" />
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
