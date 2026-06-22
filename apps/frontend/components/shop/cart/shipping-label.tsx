"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

const PRIMARY = "#85241F";

type Props = {
  name: string;
  address: string;
  phone: string;
  lang: "th" | "en";
};

function extractPostalCode(address: string): string {
  const match = address.match(/\b(\d{5})\b/);
  return match?.[1] ?? "";
}

export function ShippingLabel({ name, address, phone, lang }: Props) {
  const postalCode = extractPostalCode(address);
  const addressWithoutPostal = postalCode
    ? address.replace(postalCode, "").replace(/\s+,/, ",").trim().replace(/,?\s*$/, "")
    : address;

  function handlePrint() {
    const win = window.open("", "_blank", "width=700,height=600");
    if (!win) return;
    const digits = postalDigits;
    const postalBoxesHtml = Array.from({ length: 5 }).map((_, i) => `
      <div style="width:32px;height:32px;border:2px solid ${PRIMARY};border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:900;color:#111;">
        ${digits[i] ?? ""}
      </div>
    `).join("");

    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>ใบติดพัสดุ</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Sarabun', 'Noto Sans Thai', Arial, sans-serif; background: white; display: flex; justify-content: center; align-items: flex-start; padding: 40px; }
          @media print {
            body { padding: 20px; }
            @page { margin: 10mm; }
          }
        </style>
      </head>
      <body>
        <div style="width:360px;border:2px solid ${PRIMARY};border-radius:12px;padding:24px;font-size:13px;background:white;">

          <div style="font-size:10px;font-weight:800;color:${PRIMARY};letter-spacing:0.08em;text-transform:uppercase;margin-bottom:16px;">
            ผู้รับ / Recipient
          </div>

          <div style="display:flex;align-items:flex-end;gap:8px;margin-bottom:14px;">
            <span style="font-size:9px;font-weight:700;color:#999;white-space:nowrap;padding-bottom:3px;">ชื่อ</span>
            <div style="flex:1;border-bottom:1.5px dotted ${PRIMARY};padding-bottom:3px;min-height:24px;display:flex;align-items:flex-end;">
              <span style="font-size:15px;font-weight:900;color:#111;line-height:1;">${name}</span>
            </div>
          </div>

          <div style="display:flex;align-items:flex-end;gap:8px;margin-bottom:14px;">
            <span style="font-size:9px;font-weight:700;color:#999;white-space:nowrap;padding-bottom:3px;">โทร.</span>
            <div style="flex:1;border-bottom:1.5px dotted ${PRIMARY};padding-bottom:3px;min-height:24px;display:flex;align-items:flex-end;">
              <span style="font-size:13px;font-weight:700;color:#111;line-height:1;font-family:monospace;">${phone}</span>
            </div>
          </div>

          <div style="margin-bottom:0;">
            <div style="font-size:9px;font-weight:700;color:#999;margin-bottom:6px;">ที่อยู่</div>
            <div style="border-bottom:1.5px dotted ${PRIMARY};padding-bottom:4px;min-height:24px;display:flex;align-items:flex-end;margin-bottom:10px;">
              <span style="font-size:12px;font-weight:600;color:#111;line-height:1.5;">${addressWithoutPostal}</span>
            </div>
            <div style="border-bottom:1.5px dotted ${PRIMARY};min-height:24px;"></div>
          </div>

          <div style="display:flex;align-items:center;justify-content:space-between;margin-top:14px;">
            <span style="font-size:9px;font-weight:700;color:#999;">รหัสไปรษณีย์</span>
            <div style="display:flex;gap:4px;">${postalBoxesHtml}</div>
          </div>

        </div>
      </body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 400);
  }

  const postalDigits = postalCode.split("");

  return (
    <div className="w-full">
      <div
        id="shipping-label-print"
        className="label w-full border-2 border-brand rounded-2xl p-5 bg-white"
      >
        {/* Title */}
        <p className="recipient-title text-[10px] font-black text-brand uppercase tracking-widest mb-4">
          ผู้รับ / Recipient
        </p>

        {/* Name */}
        <div className="field-row flex items-end gap-2 mb-3">
          <span className="field-label text-[9px] font-bold text-gray-400 shrink-0 pb-0.5">ชื่อ</span>
          <div className="field-value flex-1 border-b border-dotted border-brand pb-0.5 min-h-6 flex items-end">
            <span className="text-[14px] font-black text-gray-900 leading-none">{name}</span>
          </div>
        </div>

        {/* Phone */}
        <div className="field-row flex items-end gap-2 mb-3">
          <span className="field-label text-[9px] font-bold text-gray-400 shrink-0 pb-0.5">โทร.</span>
          <div className="field-value flex-1 border-b border-dotted border-brand pb-0.5 min-h-6 flex items-end">
            <span className="text-[13px] font-bold text-gray-900 leading-none font-mono">{phone}</span>
          </div>
        </div>

        {/* Address */}
        <div className="mb-0">
          <span className="address-label text-[9px] font-bold text-gray-400 block mb-1.5">ที่อยู่</span>
          <div className="address-value border-b border-dotted border-brand pb-0.5 min-h-6 flex items-end mb-2.5">
            <span className="text-[11px] font-semibold text-gray-900 leading-relaxed">{addressWithoutPostal}</span>
          </div>
          <div className="address-blank border-b border-dotted border-brand min-h-6" />
        </div>

        {/* Postal code */}
        <div className="postal-row flex items-center justify-between mt-3">
          <span className="postal-label text-[9px] font-bold text-gray-400">รหัสไปรษณีย์</span>
          <div className="postal-boxes flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="postal-box w-7 h-7 border-2 border-brand rounded flex items-center justify-center text-sm font-black text-gray-900"
              >
                {postalDigits[i] ?? ""}
              </div>
            ))}
          </div>
        </div>
      </div>

      <Button
        type="button"
        onClick={handlePrint}
        variant="outline"
        className="mt-3 w-full h-11 rounded-2xl border-brand text-brand font-black text-sm hover:bg-brand/5 cursor-pointer"
      >
        <Printer className="h-4 w-4" />
        {lang === "th" ? "พิมพ์ใบติดพัสดุ" : "Print Shipping Label"}
      </Button>
    </div>
  );
}
