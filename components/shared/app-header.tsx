"use client";

import { LanguageChip } from "@/components/shared/language-chip";

type AppHeaderProps = {
  rightSlot?: React.ReactNode;
};

export function AppHeader({ rightSlot }: AppHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-100 sticky top-0 z-40">
      <div className="relative">
        <div className="absolute top-1/2 -translate-y-1/2 right-4 flex items-center gap-2 z-10">
          {rightSlot}
          <LanguageChip />
        </div>
        <div className="flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/HLLCLOGO.png" alt="HLLC" className="h-24 w-auto object-contain" />
        </div>
      </div>
    </div>
  );
}
