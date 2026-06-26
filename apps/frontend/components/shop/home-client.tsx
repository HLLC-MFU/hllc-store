"use client";

import { CategoryBlocks, type CategoryBlock } from "./category-blocks";
import { useLanguage } from "@/lib/client/language-context";

type HomeClientProps = {
  blocks: CategoryBlock[];
};

const tagline = {
  th: "✦ 2 สินค้าสุดพิเศษ · มีเพียงสินค้าละ 500 ชิ้นเท่านั้น ✦",
  en: "✦ Two Exclusive Items · Only 500 Pieces Each ✦",
};

export function HomeClient({ blocks }: HomeClientProps) {
  const { lang } = useLanguage();

  return (
    <div className="fixed inset-0 top-14 md:top-0 md:left-56 lg:left-64 bg-white flex flex-col sm:justify-center">
      <div className="flex-1 min-h-0 sm:flex-none overflow-hidden sm:overflow-visible">
        <CategoryBlocks blocks={blocks} fullPage />
      </div>
      <div className="hidden md:flex items-center justify-center gap-4 py-6 shrink-0">
        <span className="h-px w-16 bg-gray-200" />
        <p
          key={lang}
          className="text-sm font-black tracking-[0.2em] text-gray-700 uppercase select-none animate-fade-in [&>span]:text-brand"
          dangerouslySetInnerHTML={{
            __html: tagline[lang].replace(/✦/g, '<span>✦</span>'),
          }}
        />
        <span className="h-px w-16 bg-gray-200" />
      </div>
    </div>
  );
}
