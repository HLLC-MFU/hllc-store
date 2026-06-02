"use client";

import { Globe } from "lucide-react";
import { useLanguage } from "@/lib/language-context";

type AppHeaderProps = {
  rightSlot?: React.ReactNode;
};

export function AppHeader({ rightSlot }: AppHeaderProps) {
  const { lang, setLang } = useLanguage();

  const languageSwitch = (
    <div className="flex items-center gap-1 bg-white/90 backdrop-blur-md px-1.5 py-1 rounded-full border border-gray-200 shadow-sm">
      <Globe className="w-3.5 h-3.5 text-gray-400 ml-1 shrink-0" />
      {(["th", "en"] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`px-2 py-0.5 rounded-md text-[10px] font-black transition-all cursor-pointer ${
            lang === l ? "bg-[#85241F] text-white shadow-sm" : "text-gray-400 hover:text-gray-700"
          }`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );

  return (
    <div className="bg-white border-b border-gray-100 sticky top-0 z-40">
      <div className="relative">
        {/* Language switcher — top right */}
        <div className="absolute top-1/2 -translate-y-1/2 right-4 flex items-center gap-2 z-10">
          {rightSlot}
          {languageSwitch}
        </div>

        {/* Logo centered, no padding */}
        <div className="flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/HLLCLOGO.png" alt="HLLC" className="h-24 w-auto object-contain" />
        </div>
      </div>
    </div>
  );
}
