"use client";

import { useState } from "react";
import { Save, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import type { ShippingSettings } from "@/lib/modules/settings";

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
};

const inputCls = "h-11 rounded-xl text-sm";
const labelCls = "mb-1 block text-xs font-bold text-gray-500";

export function ShippingSettingsPanel({ settings, loading, onSave }: Props) {
  const [form, setForm] = useState<ShippingSettings>(settings ?? EMPTY);

  const set = (key: keyof ShippingSettings) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value === "" ? 0 : Number(e.target.value) }));

  return (
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

          <Button disabled={loading} className="h-11 rounded-xl bg-[#85241F] font-black hover:bg-[#B72D2A]" type="submit">
            <Save className="h-4 w-4" /> บันทึกค่าจัดส่ง
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
