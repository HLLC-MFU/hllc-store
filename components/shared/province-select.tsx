"use client";

import * as React from "react";
import { THAI_PROVINCES } from "@/lib/thai-provinces";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";

type Props = {
  value: string;
  onChange: (value: string) => void;
  lang?: "th" | "en";
  error?: string;
};

const PROVINCE_VALUES = THAI_PROVINCES.map((p) => p.th);

export function ProvinceSelect({ value, onChange, lang = "th", error }: Props) {
  return (
    <div className="flex flex-col gap-1.5">
      <Combobox
        items={PROVINCE_VALUES}
        value={value}
        onValueChange={(val) => onChange((val as string | null) ?? "")}
      >
        <ComboboxInput
          placeholder={lang === "th" ? "เลือกจังหวัด" : "Select province"}
        />
        <ComboboxContent>
          <ComboboxEmpty>
            {lang === "th" ? "ไม่พบจังหวัด" : "No results"}
          </ComboboxEmpty>
          <ComboboxList>
            {(item: string) => (
              <ComboboxItem key={item} value={item}>
                {lang === "th"
                  ? item
                  : (THAI_PROVINCES.find((p) => p.th === item)?.en ?? item)}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      {error && <p className="text-xs font-semibold text-red-500">{error}</p>}
    </div>
  );
}
