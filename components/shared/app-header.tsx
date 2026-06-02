"use client";

import { LanguageChip } from "@/components/shared/language-chip";

type AppHeaderProps = {
  rightSlot?: React.ReactNode;
};

export function AppHeader({ rightSlot }: AppHeaderProps) {
  return (
    <div className="sticky top-0 z-40 border-b border-gray-100 bg-white">
      <div className="flex min-h-20 items-center justify-between gap-3 px-4">
        <div className="min-w-0 flex-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/HLLCLOGO.png" alt="HLLC" className="h-16 w-auto max-w-32 object-contain" />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {rightSlot}
          <LanguageChip />
        </div>
      </div>
    </div>
  );
}
