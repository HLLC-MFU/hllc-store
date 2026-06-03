"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, Clock3 } from "lucide-react";
import { useLanguage } from "@/lib/language-context";

type TimeSelectProps = {
  name: string;
};

export function TimeSelect({ name }: TimeSelectProps) {
  const { lang } = useLanguage();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");

  const slots = useMemo(() => {
    const nextSlots: string[] = [];
    for (let hour = 8; hour <= 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        if (hour === 18 && minute > 0) break;
        nextSlots.push(`${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`);
      }
    }

    return nextSlots;
  }, []);

  const placeholder = lang === "th" ? "เลือกเวลารับสินค้า" : "Select pickup time";
  const helper = lang === "th" ? "เปิดรับ 08:00-18:00 น." : "Available 08:00-18:00";

  return (
    <div className="relative mt-3">
      <input type="hidden" name={name} value={value} />
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`flex h-14 w-full items-center gap-3 rounded-2xl border bg-white px-3 text-left shadow-sm transition-all ${
          open || value
            ? "border-[#85241F] ring-4 ring-[#85241F]/10"
            : "border-[#85241F]/15 hover:border-[#85241F]/40"
        }`}
        aria-expanded={open}
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#85241F]/10 text-[#85241F]">
          <Clock3 className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className={`block text-sm font-black ${value ? "text-gray-950" : "text-gray-400"}`}>
            {value || placeholder}
          </span>
          <span className="mt-0.5 block text-[10px] font-bold text-gray-400">{helper}</span>
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 rounded-2xl border border-gray-100 bg-white p-3 shadow-xl shadow-gray-900/10">
          <div className="grid max-h-56 grid-cols-3 gap-2 overflow-y-auto pr-1">
            {slots.map((slot) => {
              const selected = value === slot;
              return (
                <button
                  key={slot}
                  type="button"
                  onClick={() => {
                    setValue(slot);
                    setOpen(false);
                  }}
                  className={`flex h-10 items-center justify-center gap-1.5 rounded-xl text-xs font-black transition-all ${
                    selected
                      ? "bg-[#85241F] text-white shadow-sm"
                      : "bg-gray-50 text-gray-600 hover:bg-[#85241F]/10 hover:text-[#85241F]"
                  }`}
                >
                  {selected ? <Check className="h-3.5 w-3.5" /> : null}
                  {slot}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
