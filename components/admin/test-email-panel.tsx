"use client";

import { useState } from "react";
import { Mail, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/components/admin/api-client";

type Props = {
  defaultTo?: string;
  onNotify?: (message: string) => void;
};

const TEMPLATES: { value: string; label: string }[] = [
  { value: "order_confirmed", label: "รับคำสั่งซื้อแล้ว" },
  { value: "slip_received", label: "ได้รับสลิปแล้ว" },
  { value: "slip_approved", label: "สลิปผ่านการอนุมัติ" },
  { value: "slip_rejected", label: "สลิปไม่ผ่าน (+ข้อความ)" },
  { value: "shipped", label: "จัดส่งสินค้า (เลขพัสดุ)" },
  { value: "pickup_ready", label: "มารับสินค้าเอง" },
  { value: "cancelled", label: "ยกเลิกคำสั่งซื้อ (+ข้อความ)" },
];

const inputCls = "h-11 rounded-xl text-sm";

export function TestEmailPanel({ defaultTo = "", onNotify }: Props) {
  const [template, setTemplate] = useState("slip_approved");
  const [to, setTo] = useState(defaultTo);
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);

  const showNote = template === "slip_rejected" || template === "cancelled";

  async function send() {
    if (!to.trim()) { onNotify?.("กรุณากรอกอีเมลผู้รับ"); return; }
    setSending(true);
    const res = await api<{ message?: string }>("/api/backend/admin/test-email", {
      method: "POST",
      body: JSON.stringify({ to: to.trim(), template, note: note.trim() }),
    });
    setSending(false);
    onNotify?.(res.error ?? "ส่งอีเมลทดสอบแล้ว ✓");
  }

  return (
    <Card className="rounded-2xl border-gray-100 shadow-xs">
      <CardContent className="p-5">
        <h2 className="mb-1 flex items-center gap-2 text-base font-black text-gray-900">
          <Mail className="h-4 w-4" /> ทดสอบส่งอีเมล
        </h2>
        <p className="mb-4 text-xs text-gray-400">ส่งอีเมลตัวอย่างแต่ละแบบไปทดสอบหน้าตา (ใช้ข้อมูลจำลอง)</p>

        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {TEMPLATES.map((tpl) => (
              <button
                key={tpl.value}
                type="button"
                onClick={() => setTemplate(tpl.value)}
                className={`rounded-xl border px-3 py-2 text-left text-xs font-bold transition-colors ${
                  template === tpl.value
                    ? "border-[#85241F] bg-[#85241F]/5 text-[#85241F]"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                {tpl.label}
              </button>
            ))}
          </div>

          <Input
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="อีเมลผู้รับสำหรับทดสอบ"
            type="email"
            className={inputCls}
          />

          {showNote && (
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="ข้อความเพิ่ม (ไม่ใส่ก็ได้ — จะใช้ข้อความตัวอย่าง)"
              className={inputCls}
            />
          )}

          <Button
            disabled={sending}
            onClick={send}
            className="h-11 rounded-xl bg-[#85241F] font-black hover:bg-[#B72D2A]"
          >
            <Send className="h-4 w-4" /> {sending ? "กำลังส่ง..." : "ส่งอีเมลทดสอบ"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
