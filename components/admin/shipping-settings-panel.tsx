"use client";

import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Clock3, Save, Store, Truck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import type { ShippingSettings } from "@/lib/modules/settings";

function TimePickerSelect({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  const [open, setOpen] = useState(false);
  const slots = useMemo(() => {
    const s: string[] = [];
    for (let h = 6; h <= 22; h++) {
      for (let m = 0; m < 60; m += 30) {
        s.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
      }
    }
    return s;
  }, []);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`flex h-11 w-full items-center gap-2 rounded-xl border bg-white px-3 text-left shadow-sm transition-all text-sm ${
          value ? "border-brand ring-4 ring-brand/10" : "border-input hover:border-brand/40"
        }`}
      >
        <Clock3 className="h-4 w-4 shrink-0 text-gray-400" />
        <span className={`flex-1 font-semibold ${value ? "text-gray-900" : "text-gray-400"}`}>{value || placeholder}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
      </button>

      {open && typeof window !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[80] flex flex-col justify-end" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" />
          <div className="relative bg-white rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom-4 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100">
              <p className="text-sm font-black text-gray-900">{placeholder}</p>
              <button type="button" onClick={() => setOpen(false)} className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2 p-4 overflow-y-auto max-h-72">
              {slots.map((slot) => {
                const selected = value === slot;
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => { onChange(slot); setOpen(false); }}
                    className={`flex h-10 items-center justify-center gap-1 rounded-xl text-xs font-black transition-all ${
                      selected ? "bg-brand text-white shadow-sm" : "bg-gray-50 text-gray-600 hover:bg-brand/10 hover:text-brand"
                    }`}
                  >
                    {selected && <Check className="h-3 w-3" />}
                    {slot}
                  </button>
                );
              })}
            </div>
            <div className="pb-6" />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

type Props = {
  settings: ShippingSettings | null;
  loading: boolean;
  onSave: (input: ShippingSettings) => void;
};

const EMPTY: ShippingSettings = {
  normalFirstItem: 50,
  normalAdditionalItem: 10,
  remoteFirstItem: 80,
  remoteAdditionalItem: 15,
  islandFirstItem: 100,
  islandAdditionalItem: 15,
  pickupLocation: "",
  pickupHours: "",
};

function parsePickupHours(hours: string | undefined): [string, string] {
  if (!hours) return ["", ""];
  const parts = hours.split("–");
  return [parts[0]?.trim() ?? "", parts[1]?.trim() ?? ""];
}

const inputCls = "h-11 rounded-xl text-sm";
const labelCls = "mb-1 block text-xs font-bold text-gray-500";

export function ShippingSettingsPanel({ settings, loading, onSave }: Props) {
  const [form, setForm] = useState<ShippingSettings>(settings ?? EMPTY);
  const [openTime, closeTime] = parsePickupHours(form.pickupHours);

  const set = (key: Exclude<keyof ShippingSettings, "pickupLocation" | "pickupHours">) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value === "" ? 0 : Number(e.target.value) }));

  function setPickupTime(open: string, close: string) {
    const combined = open && close ? `${open}–${close}` : open || close || "";
    setForm((prev) => ({ ...prev, pickupHours: combined }));
  }

  return (
    <>
      {/* Shipping rates card */}
      <Card className="rounded-2xl border-gray-100 shadow-xs">
        <CardContent className="p-5">
          <h2 className="mb-1 flex items-center gap-2 text-base font-black text-gray-900">
            <Truck className="h-4 w-4" /> ค่าจัดส่ง
          </h2>
          <p className="mb-4 text-xs text-gray-400">ชิ้นแรก + ชิ้นถัดไป (พื้นที่ห่างไกลตามรายการ Flash จะคิดเรตห่างไกลอัตโนมัติ)</p>

          <form className="flex flex-col gap-5" onSubmit={(e) => { e.preventDefault(); onSave(form); }}>
            {/* Normal */}
            <div className="flex flex-col gap-2">
              <p className="text-xs font-black uppercase tracking-wider text-gray-400">พื้นที่ปกติ</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelCls}>ชิ้นแรก (บาท)</label>
                  <Input type="number" min={0} value={form.normalFirstItem} onChange={set("normalFirstItem")} className={inputCls} inputMode="numeric" />
                </div>
                <div>
                  <label className={labelCls}>ชิ้นถัดไป (บาท)</label>
                  <Input type="number" min={0} value={form.normalAdditionalItem} onChange={set("normalAdditionalItem")} className={inputCls} inputMode="numeric" />
                </div>
              </div>
            </div>

            {/* Remote */}
            <div className="flex flex-col gap-2">
              <p className="text-xs font-black uppercase tracking-wider text-gray-400">พื้นที่ห่างไกล</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelCls}>ชิ้นแรก (บาท)</label>
                  <Input type="number" min={0} value={form.remoteFirstItem} onChange={set("remoteFirstItem")} className={inputCls} inputMode="numeric" />
                </div>
                <div>
                  <label className={labelCls}>ชิ้นถัดไป (บาท)</label>
                  <Input type="number" min={0} value={form.remoteAdditionalItem} onChange={set("remoteAdditionalItem")} className={inputCls} inputMode="numeric" />
                </div>
              </div>
            </div>

            {/* Island */}
            <div className="flex flex-col gap-2">
              <p className="text-xs font-black uppercase tracking-wider text-gray-400">พื้นที่พิเศษ</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelCls}>ชิ้นแรก (บาท)</label>
                  <Input type="number" min={0} value={form.islandFirstItem} onChange={set("islandFirstItem")} className={inputCls} inputMode="numeric" />
                </div>
                <div>
                  <label className={labelCls}>ชิ้นถัดไป (บาท)</label>
                  <Input type="number" min={0} value={form.islandAdditionalItem} onChange={set("islandAdditionalItem")} className={inputCls} inputMode="numeric" />
                </div>
              </div>
            </div>

            <Button disabled={loading} className="h-11 rounded-xl bg-brand font-black hover:bg-brand-hover" type="submit">
              <Save className="h-4 w-4" /> บันทึกค่าจัดส่ง
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Pickup location card */}
      <Card className="rounded-2xl border-gray-100 shadow-xs">
        <CardContent className="p-5">
          <h2 className="mb-1 flex items-center gap-2 text-base font-black text-gray-900">
            <Store className="h-4 w-4" /> จุดรับสินค้า (รับเอง)
          </h2>

          <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); onSave(form); }}>
            <div>
              <label className={labelCls}>ชื่อสถานที่ / ที่อยู่</label>
              <Input
                value={form.pickupLocation ?? ""}
                onChange={(e) => setForm((prev) => ({ ...prev, pickupLocation: e.target.value }))}
                placeholder="เช่น อาคาร D1 ชั้น 2 มฟล."
                className={inputCls}
              />
              <p className="mt-1 text-[11px] text-gray-400">ข้อความนี้จะแสดงใน email แจ้งลูกค้าที่รับเอง</p>
            </div>
            <div>
              <label className={labelCls}>เวลารับสินค้า</label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-[11px] text-gray-400">เปิด</label>
                  <TimePickerSelect value={openTime} onChange={(v) => setPickupTime(v, closeTime)} placeholder="--:--" />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] text-gray-400">ปิด</label>
                  <TimePickerSelect value={closeTime} onChange={(v) => setPickupTime(openTime, v)} placeholder="--:--" />
                </div>
              </div>
              {form.pickupHours && (
                <p className="mt-1.5 text-[11px] text-gray-500 font-semibold">{form.pickupHours}</p>
              )}
              <p className="mt-1 text-[11px] text-gray-400">แสดงใน email พร้อมรับสินค้า</p>
            </div>

            <Button disabled={loading} className="h-11 rounded-xl bg-brand font-black hover:bg-brand-hover" type="submit">
              <Save className="h-4 w-4" /> บันทึกค่าจัดส่ง
            </Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
