"use client";

import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Clock3, X } from "lucide-react";
import { useLanguage } from "@/lib/client/language-context";

type TimeSelectProps = {
  name: string;
  error?: string;
  pickupHours?: string;
};

function parseHourMin(t: string): [number, number] {
  const [h, m] = t.split(":").map(Number);
  return [h ?? 8, m ?? 0];
}

export function TimeSelect({ name, error, pickupHours }: TimeSelectProps) {
  const { lang } = useLanguage();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");

  const { slots, openStr, closeStr } = useMemo(() => {
    const parts = pickupHours?.split("–").map((s) => s.trim()) ?? [];
    const [oh, om] = parseHourMin(parts[0] || "08:00");
    const [ch, cm] = parseHourMin(parts[1] || "18:00");
    const openStr = `${String(oh).padStart(2, "0")}:${String(om).padStart(2, "0")}`;
    const closeStr = `${String(ch).padStart(2, "0")}:${String(cm).padStart(2, "0")}`;
    const s: string[] = [];
    for (let h = oh; h <= ch; h++) {
      for (let m = 0; m < 60; m += 30) {
        if (h === ch && m > cm) break;
        s.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
      }
    }
    return { slots: s, openStr, closeStr };
  }, [pickupHours]);

  const placeholder = lang === "th" ? "เลือกเวลารับสินค้า" : "Select pickup time";
  const helper = lang === "th" ? `เปิดรับ ${openStr}-${closeStr} น.` : `Available ${openStr}-${closeStr}`;

  return (
    <div className="relative mt-3">
      <input type="hidden" name={name} value={value} />
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`flex h-14 w-full items-center gap-3 rounded-2xl border bg-white px-3 text-left shadow-sm transition-all ${
          error
            ? "border-red-400 ring-4 ring-red-100"
            : value
            ? "border-[#85241F] ring-4 ring-[#85241F]/10"
            : "border-[#85241F]/15 hover:border-[#85241F]/40"
        }`}
        aria-expanded={open}
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#85241F]/10 text-[#85241F]">
          <Clock3 className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className={`block text-sm font-black ${error ? "text-red-600" : value ? "text-gray-950" : "text-gray-400"}`}>
            {value || placeholder}
          </span>
          <span className={`mt-0.5 block text-[10px] font-bold ${error ? "text-red-400" : "text-gray-400"}`}>{helper}</span>
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
      </button>

      {open && typeof window !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[80] flex flex-col justify-end" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" />
          <div
            className="relative bg-white rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom-4 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100">
              <p className="text-sm font-black text-gray-900">{placeholder}</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2 p-4 overflow-y-auto max-h-72">
              {slots.map((slot) => {
                const selected = value === slot;
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => { setValue(slot); setOpen(false); }}
                    className={`flex h-12 items-center justify-center gap-1.5 rounded-2xl text-sm font-black transition-all ${
                      selected
                        ? "bg-[#85241F] text-white shadow-sm"
                        : "bg-gray-50 text-gray-600 hover:bg-[#85241F]/10 hover:text-[#85241F]"
                    }`}
                  >
                    {selected && <Check className="h-3.5 w-3.5" />}
                    {slot}
                  </button>
                );
              })}
            </div>
            <div className="h-safe-area-bottom pb-6" />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
