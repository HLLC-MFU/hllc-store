"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/client/language-context";

export function BackButton() {
  const router = useRouter();
  const { t } = useLanguage();
  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="hidden md:flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-gray-700 transition-colors mb-4 -ml-1 cursor-pointer"
    >
      <ChevronLeft className="h-4 w-4" />
      {t("nav.back")}
    </button>
  );
}
