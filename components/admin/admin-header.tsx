"use client";

import { LanguageChip } from "@/components/shared/language-chip";

export function AdminHeader() {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-100 h-14 flex items-center justify-between px-5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/HLLCLOGO.png" alt="HLLC" className="h-8 w-auto object-contain" />
      <LanguageChip />
    </header>
  );
}
