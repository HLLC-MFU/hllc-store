"use client";

import Link from "next/link";
import { Image as ImageIcon } from "lucide-react";
import { useLanguage } from "@/lib/client/language-context";

export type LocalizedText = { th: string; en?: string };

export type CategoryBlock = {
  href: string;
  imageUrl?: string;
  title: LocalizedText;
  subtitle?: LocalizedText;
};

/**
 * Stacked banner cards used for the homepage top categories and the
 * bracelet-charm group landing. Images/titles come from the admin-editable
 * home content settings.
 */
export function CategoryBlocks({ blocks }: { blocks: CategoryBlock[] }) {
  const { lang } = useLanguage();
  const pick = (text?: LocalizedText) => (text ? text[lang] || text.th : "");

  return (
    <div className="flex flex-col gap-4">
      {blocks.map((block) => (
        <Link
          key={block.href}
          href={block.href}
          className="group relative block overflow-hidden rounded-3xl bg-white shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.13)] active:scale-[0.99]"
        >
          <div className="relative aspect-[16/9] w-full bg-[#f5f5f5]">
            {block.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={block.imageUrl}
                alt={pick(block.title)}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <ImageIcon className="h-12 w-12 text-gray-200" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5">
              <h2 className="text-2xl font-black leading-tight text-white drop-shadow-sm">
                {pick(block.title)}
              </h2>
              {pick(block.subtitle) && (
                <p className="mt-1 max-w-[90%] text-sm font-semibold text-white/85">
                  {pick(block.subtitle)}
                </p>
              )}
              <span className="mt-3 inline-flex h-9 items-center justify-center rounded-2xl bg-[#85241F] px-4 text-xs font-black text-white">
                {lang === "th" ? "ช้อปเลย" : "Shop now"} →
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
