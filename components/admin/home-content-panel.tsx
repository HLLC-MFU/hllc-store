"use client";

import * as React from "react";
import { Image as ImageIcon, Save, Upload, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import * as settingsApi from "@/lib/modules/settings";
import type { HomeContent, HomeBlock } from "@/lib/modules/settings";
import { CATEGORIES, type HomeBlockId } from "@/lib/config/catalog";

// Fixed banner blocks (top categories + groups) with their Thai heading.
const BLOCK_LABELS: { id: HomeBlockId; label: string }[] = (() => {
  const out: { id: HomeBlockId; label: string }[] = [];
  for (const category of CATEGORIES) {
    out.push({ id: category.id, label: category.label.th });
    for (const group of category.groups ?? []) {
      out.push({ id: group.id, label: `${category.label.th} › ${group.label.th}` });
    }
  }
  return out;
})();

const emptyBlock = (): HomeBlock => ({ imageUrl: "", title: { th: "" }, subtitle: { th: "" } });

export function HomeContentPanel({ notify }: { notify?: (msg: string) => void }) {
  const [blocks, setBlocks] = React.useState<Record<string, HomeBlock>>({});
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

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
    return () => {
      active = false;
    };
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
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    if (!res.ok) { notify?.("อัปโหลดรูปไม่สำเร็จ"); return; }
    const data = await res.json() as { url: string };
    update(id, { imageUrl: data.url });
  }

  async function save() {
    setSaving(true);
    const payload: HomeContent["blocks"] = {};
    for (const { id } of BLOCK_LABELS) payload[id] = block(id);
    const res = await settingsApi.updateHomeContent({ blocks: payload });
    setSaving(false);
    if (res.error) notify?.(res.error);
    else {
      if (res.data) setBlocks(res.data.blocks);
      notify?.("บันทึกแบนเนอร์หน้าร้านแล้ว");
    }
  }

  if (loading) {
    return <p className="py-10 text-center text-sm text-gray-400">กำลังโหลด...</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-gray-400">รูปและข้อความของแต่ละบล็อกบนหน้าร้าน (หมวดใหญ่และกลุ่มย่อย)</p>

      {BLOCK_LABELS.map(({ id, label }) => {
        const b = block(id);
        return (
          <Card key={id} className="rounded-2xl border-gray-100 shadow-xs">
            <CardContent className="p-4">
              <p className="mb-3 text-sm font-black text-gray-900">{label}</p>
              <div className="flex gap-3">
                {/* Image */}
                <div className="shrink-0">
                  <input
                    id={`home-img-${id}`}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImage(id, e)}
                  />
                  {b.imageUrl ? (
                    <div className="relative h-24 w-24">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={b.imageUrl} alt={label} className="h-24 w-24 rounded-xl border border-gray-200 object-cover" />
                      <button
                        type="button"
                        onClick={() => update(id, { imageUrl: "" })}
                        className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow"
                      >
                        <XCircle className="h-4 w-4 text-gray-400" />
                      </button>
                    </div>
                  ) : (
                    <label
                      htmlFor={`home-img-${id}`}
                      className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-gray-200 hover:border-[#85241F]/30"
                    >
                      <Upload className="h-4 w-4 text-gray-400" />
                      <span className="text-[9px] font-bold text-gray-400">อัปโหลดรูป</span>
                      <ImageIcon className="hidden" />
                    </label>
                  )}
                </div>

                {/* Texts */}
                <div className="grid flex-1 grid-cols-2 gap-2">
                  <Input value={b.title.th} onChange={(e) => setTitle(id, "th", e.target.value)} placeholder="หัวข้อ (ไทย)" className="h-9 rounded-xl text-xs" />
                  <Input value={b.title.en ?? ""} onChange={(e) => setTitle(id, "en", e.target.value)} placeholder="Title (EN)" className="h-9 rounded-xl text-xs" />
                  <Input value={b.subtitle.th} onChange={(e) => setSubtitle(id, "th", e.target.value)} placeholder="คำอธิบาย (ไทย)" className="h-9 rounded-xl text-xs" />
                  <Input value={b.subtitle.en ?? ""} onChange={(e) => setSubtitle(id, "en", e.target.value)} placeholder="Subtitle (EN)" className="h-9 rounded-xl text-xs" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      <Button disabled={saving} onClick={save} className="h-11 rounded-xl bg-[#85241F] font-black hover:bg-[#B72D2A]">
        <Save className="h-4 w-4" /> บันทึกแบนเนอร์หน้าร้าน
      </Button>
    </div>
  );
}
