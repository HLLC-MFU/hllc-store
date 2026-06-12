"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useLanguage } from "@/lib/client/language-context";

type LocalizedText = { th: string; en?: string };

/** Back link + localized title used at the top of category / group pages. */
export function ShopPageHeader({
  title,
  subtitle,
  backHref,
}: {
  title: LocalizedText;
  subtitle?: LocalizedText;
  backHref: string;
}) {
  const { lang } = useLanguage();
  const pick = (t?: LocalizedText) => (t ? t[lang] || t.th : "");

  return (
    <div className="mb-4 flex items-center gap-3">
      <Link
        href={backHref}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-100 bg-white text-gray-500 shadow-sm transition-colors hover:text-[#85241F]"
        aria-label="Back"
      >
        <ChevronLeft className="h-5 w-5" />
      </Link>
      <div className="min-w-0">
        <h1 className="truncate text-xl font-black text-gray-900">{pick(title)}</h1>
        {pick(subtitle) && <p className="truncate text-xs font-semibold text-gray-400">{pick(subtitle)}</p>}
      </div>
    </div>
  );
}
