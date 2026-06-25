"use client";

import { useState } from "react";
import { Landmark, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import type { PaymentSettings } from "@/lib/modules/settings";

type Props = {
  settings: PaymentSettings | null;
  loading: boolean;
  onSave: (input: PaymentSettings) => void;
};

const EMPTY: PaymentSettings = {
  bankName: "",
  bankNameEn: "",
  bankAccountName: "",
  bankAccountNumber: "",
};

const inputCls = "h-11 rounded-xl text-sm";
const labelCls = "mb-1 block text-xs font-bold text-gray-500";

export function PaymentAccountPanel({ settings, loading, onSave }: Props) {
  // Parent remounts this panel (via key) once settings load, so initial state is enough.
  const [form, setForm] = useState<PaymentSettings>(settings ?? EMPTY);

  const set = (key: keyof PaymentSettings) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <Card className="rounded-2xl border-gray-100 shadow-xs">
      <CardContent className="p-5">
        <h2 className="mb-1 text-base font-black text-gray-900">บัญชีรับเงิน</h2>
        <p className="mb-4 text-xs text-gray-400">ใช้แสดงในหน้าชำระเงินของลูกค้า (โอนผ่านบัญชี)</p>

        <form
          className="flex flex-col gap-5"
          onSubmit={(e) => { e.preventDefault(); onSave(form); }}
        >
          {/* Bank transfer */}
          <div className="flex flex-col gap-2">
            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-gray-400">
              <Landmark className="h-4 w-4" /> โอนผ่านบัญชีธนาคาร
            </p>
            <div>
              <label className={labelCls}>ธนาคาร (ไทย)</label>
              <Input value={form.bankName} onChange={set("bankName")} placeholder="เช่น ธนาคารกรุงเทพ" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>ธนาคาร (EN)</label>
              <Input value={form.bankNameEn ?? ""} onChange={set("bankNameEn")} placeholder="e.g. Bangkok Bank" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>ชื่อบัญชี</label>
              <Input value={form.bankAccountName} onChange={set("bankAccountName")} placeholder="ชื่อ-นามสกุล เจ้าของบัญชี" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>เลขบัญชี</label>
              <Input value={form.bankAccountNumber} onChange={set("bankAccountNumber")} placeholder="เลขบัญชี" className={inputCls} inputMode="numeric" />
            </div>
          </div>

          <Button disabled={loading} className="h-11 rounded-xl bg-brand font-black hover:bg-brand-hover" type="submit">
            <Save className="h-4 w-4" /> บันทึกบัญชีรับเงิน
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
