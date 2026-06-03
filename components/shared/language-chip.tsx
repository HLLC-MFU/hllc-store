"use client";

import { useLanguage } from "@/lib/language-context";

const ThaiFlag = () => (
  <svg viewBox="0 0 9 6" className="w-5.5 h-4 rounded-[3px] shadow-xs">
    <rect width="9" height="6" fill="#A51931" />
    <rect y="1" width="9" height="4" fill="#F4F5F8" />
    <rect y="2" width="9" height="2" fill="#2D2A4A" />
  </svg>
);

const UkFlag = () => (
  <svg viewBox="0 0 50 30" className="w-5.5 h-4 rounded-[3px] shadow-xs">
    <rect width="50" height="30" fill="#012169" />
    <path d="M0 0 L50 30 M50 0 L0 30" stroke="#fff" strokeWidth="6" />
    <path d="M0 0 L50 30 M50 0 L0 30" stroke="#C8102E" strokeWidth="2.5" />
    <path d="M25 0 V30 M0 15 H50" stroke="#fff" strokeWidth="10" />
    <path d="M25 0 V30 M0 15 H50" stroke="#C8102E" strokeWidth="6" />
  </svg>
);

export function LanguageChip() {
  const { lang, setLang } = useLanguage();

  return (
    <button
      type="button"
      onClick={() => setLang(lang === "th" ? "en" : "th")}
      className="flex items-center justify-center h-10 w-10 rounded-xl bg-white hover:bg-gray-50 active:scale-95 transition-all select-none border border-gray-200/80 shadow-xs cursor-pointer"
      aria-label={`Switch to ${lang === "th" ? "English" : "Thai"}`}
    >
      {lang === "th" ? <ThaiFlag /> : <UkFlag />}
    </button>
  );
}
