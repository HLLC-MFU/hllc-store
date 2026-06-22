"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/client/language-context";

const SLOTS = [
  { value: "08:00–12:00", th: "8:00 – 12:00 น.", en: "8:00 – 12:00" },
  { value: "13:00–16:00", th: "13:00 – 16:00 น.", en: "13:00 – 16:00" },
] as const;

type TimeSelectProps = {
  name: string;
  error?: string;
};

export function TimeSelect({ name, error }: TimeSelectProps) {
  const { lang } = useLanguage();
  const [value, setValue] = useState("");

  return (
    <div>
      <input type="hidden" name={name} value={value} />
      <div className="grid grid-cols-2 gap-3">
        {SLOTS.map((slot) => {
          const selected = value === slot.value;
          return (
            <button
              key={slot.value}
              type="button"
              onClick={() => setValue(slot.value)}
              className={`flex h-14 items-center justify-center rounded-2xl text-sm font-black transition-all ${
                selected
                  ? "bg-brand text-white shadow-sm ring-4 ring-brand/15"
                  : error
                  ? "bg-red-50 border border-red-200 text-red-700 hover:border-brand/40 hover:bg-brand/5"
                  : "bg-gray-50 border border-gray-100 text-gray-700 hover:border-brand/40 hover:bg-brand/5"
              }`}
            >
              {slot[lang] ?? slot.th}
            </button>
          );
        })}
      </div>
    </div>
  );
}
