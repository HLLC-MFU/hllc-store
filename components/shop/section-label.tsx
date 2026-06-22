"use client";

import { useLanguage } from "@/lib/client/language-context";

type LocalizedText = { th: string; en?: string };

type Props = {
  label: LocalizedText;
  subtitle?: LocalizedText;
};

export function SectionLabel({ label, subtitle }: Props) {
  const { lang } = useLanguage();

  return (
    <div className="mb-4 text-center">
      <p className="text-xs font-black uppercase tracking-widest text-gray-800">
        {label[lang]}
      </p>
      {subtitle && (
        <p className="mt-1 text-[11px] text-gray-400 font-medium">
          {subtitle[lang]}
        </p>
      )}
    </div>
  );
}
