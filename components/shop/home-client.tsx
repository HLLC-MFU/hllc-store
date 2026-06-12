"use client";

import Link from "next/link";
import { Truck } from "lucide-react";
import { useLanguage } from "@/lib/client/language-context";
import { CategoryBlocks, type CategoryBlock } from "./category-blocks";

type HomeClientProps = {
  blocks: CategoryBlock[];
};

export function HomeClient({ blocks }: HomeClientProps) {
  const { lang } = useLanguage();

  return (
    <div className="min-h-screen bg-white">
      <div className="px-4 md:px-6 py-4 pb-24">
        {/* Mobile: tracking card */}
        <Link
          href="/profile"
          className="shop-tracking mb-4 flex items-center justify-between rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm transition-all duration-200 hover:border-[#85241F]/20 hover:bg-[#85241F]/5 active:scale-[0.98] md:hidden"
        >
          <div className="flex items-center gap-3">
            <div className="shop-tracking-icon flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#85241F]/8 text-[#85241F]">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-black text-gray-900">
                {lang === "th" ? "ติดตามพัสดุ" : "Track package"}
              </p>
              <p className="mt-0.5 text-xs font-semibold text-gray-400">
                {lang === "th" ? "ใส่เบอร์โทรเพื่อดูสถานะและเลขพัสดุ" : "Enter your phone to see status and tracking"}
              </p>
            </div>
          </div>
          <span className="text-lg font-bold text-gray-300">›</span>
        </Link>

        <CategoryBlocks blocks={blocks} />
      </div>
    </div>
  );
}
