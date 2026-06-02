"use client";

import { useLanguage } from "@/lib/language-context";

const LANG_META = {
  th: { flag: "🇹🇭", next: "en" as const },
  en: { flag: "🇬🇧", next: "th" as const },
};

export function LanguageChip() {
  const { lang, setLang } = useLanguage();
  const { flag, next } = LANG_META[lang];

  return (
    <button
      type="button"
      onClick={() => setLang(next)}
      className="flex items-center gap-2 h-10 px-3.5 rounded-xl bg-gray-100 hover:bg-gray-200 active:scale-95 transition-all select-none border border-gray-200 shadow-sm"
      aria-label={`Switch to ${next.toUpperCase()}`}
    >
      <span className="text-lg leading-none">{flag}</span>
      <span className="text-xs font-black text-gray-600">{lang.toUpperCase()}</span>
    </button>
  );
}
