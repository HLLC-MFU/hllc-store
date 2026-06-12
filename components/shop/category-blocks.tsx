"use client";

import Link from "next/link";
import { ArrowRight, Image as ImageIcon } from "lucide-react";
import { useLanguage } from "@/lib/client/language-context";

export type LocalizedText = { th: string; en?: string };

export type CategoryBlock = {
  href: string;
  imageUrl?: string;
  title: LocalizedText;
  subtitle?: LocalizedText;
};

export function CategoryBlocks({ blocks, fullPage = false }: { blocks: CategoryBlock[]; fullPage?: boolean }) {
  const { lang } = useLanguage();
  const pick = (text?: LocalizedText) => (text ? text[lang] || text.th : "");
  const wrapperClass = fullPage
    ? "flex h-[calc(100svh-3.5rem)] flex-col gap-2 overflow-hidden bg-white p-2 md:h-screen md:gap-3 md:p-3"
    : "flex flex-col gap-4";
  const linkClass = fullPage
    ? "group relative flex min-h-0 flex-1 overflow-hidden rounded-[1.75rem] border border-white bg-white shadow-[0_8px_24px_rgba(15,23,42,0.12)] ring-1 ring-gray-900/5 transition-all duration-300 active:scale-[0.99]"
    : "group relative block overflow-hidden rounded-3xl bg-white shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.13)] active:scale-[0.99]";
  const mediaClass = fullPage
    ? "relative h-full min-h-0 w-full bg-[#f5f5f5]"
    : "relative aspect-[16/9] w-full bg-[#f5f5f5]";

  return (
    <div className={wrapperClass}>
      {blocks.map((block) => (
        <Link
          key={block.href}
          href={block.href}
          className={linkClass}
        >
          <div className={mediaClass}>
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

            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(0,0,0,0.08)_0%,rgba(0,0,0,0.02)_42%,rgba(0,0,0,0.50)_100%)]" />

            <div className="absolute left-5 top-5 max-w-[70%] text-left">
              <h2 className="text-2xl font-black leading-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.45)]">
                {pick(block.title)}
              </h2>
              {pick(block.subtitle) ? (
                <p className="mt-1 text-xs font-bold leading-snug text-white/90 drop-shadow-[0_1px_5px_rgba(0,0,0,0.45)]">
                  {pick(block.subtitle)}
                </p>
              ) : null}
            </div>

            <div className="absolute bottom-5 right-5">
              <span className="inline-flex h-9 items-center justify-center gap-1.5 rounded-2xl bg-[#85241F] px-4 text-xs font-black text-white shadow-lg shadow-black/20">
                {lang === "th" ? "ช้อปเลย" : "Shop now"}
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
