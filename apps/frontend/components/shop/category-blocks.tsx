"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Image as ImageIcon } from "lucide-react";
import { useLanguage } from "@/lib/client/language-context";

export type LocalizedText = { th: string; en?: string };

export type CategoryBlock = {
  href: string;
  imageUrl?: string;
  title: LocalizedText;
  subtitle?: LocalizedText;
  hasSubBlocks?: boolean;
  blockStatus?: "comingSoon" | "closed";
  buttonPosition?: "top-right" | "bottom-right";
};

export function CategoryBlocks({ blocks, fullPage = false }: { blocks: CategoryBlock[]; fullPage?: boolean }) {
  const { lang } = useLanguage();
  const pick = (text?: LocalizedText) => (text ? text[lang] || text.th : "");
  const [toastStatus, setToastStatus] = React.useState<"comingSoon" | "closed" | null>(null);
  const toastTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(status: "comingSoon" | "closed") {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastStatus(status);
    toastTimer.current = setTimeout(() => setToastStatus(null), 2500);
  }

  const wrapperClass = fullPage
    ? "flex h-full flex-col gap-2 overflow-hidden bg-white p-2 md:grid md:grid-cols-2 md:gap-3 md:p-3"
    : "flex flex-col gap-4";
  const baseClass = fullPage
    ? "group relative flex min-h-0 flex-1 overflow-hidden rounded-[1.75rem] border border-white bg-white ring-1 ring-gray-900/5 transition-all duration-300 md:flex-none"
    : "group relative block overflow-hidden rounded-3xl bg-white transition-all duration-300";
  const mediaClass = fullPage
    ? "relative aspect-[4/3] w-full bg-gray-100 md:aspect-square"
    : "relative aspect-[4/3] w-full bg-gray-100";

  function BlockInner({ block }: { block: CategoryBlock }) {
    return (
      <div className={mediaClass}>
        {block.imageUrl ? (
          <Image
            fill
            src={block.imageUrl}
            alt={pick(block.title)}
            className={`object-cover ${fullPage ? "object-top" : "object-center"} ${block.blockStatus ? "" : "transition-transform duration-300 group-hover:scale-105"}`}
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) calc(100vw - 224px), calc(100vw - 256px)"
            quality={90}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ImageIcon className="h-12 w-12 text-gray-200" />
          </div>
        )}

        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(0,0,0,0.45)_0%,rgba(0,0,0,0.05)_45%,rgba(0,0,0,0.55)_100%)]" />

        {block.blockStatus && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/35">
            <span className="rounded-2xl bg-white/15 backdrop-blur-sm border border-white/30 px-6 py-2.5 text-lg font-black text-white tracking-wide shadow-lg">
              {block.blockStatus === "comingSoon"
                ? (lang === "th" ? "เร็วๆ นี้" : "Coming Soon")
                : (lang === "th" ? "ปิดการขาย" : "Unavailable")}
            </span>
          </div>
        )}

        <div className="absolute left-5 top-5 max-w-[70%] text-left">
          <h2 className="text-2xl font-black leading-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
            {pick(block.title)}
          </h2>
          {pick(block.subtitle) ? (
            <p className="mt-1 text-xs font-bold leading-snug text-white/90 drop-shadow-[0_1px_8px_rgba(0,0,0,0.9)]">
              {pick(block.subtitle)}
            </p>
          ) : null}
        </div>

        {!block.blockStatus && (
          <div className={`absolute right-5 ${block.buttonPosition === "top-right" ? "top-5" : "bottom-5"}`}>
            <span className="inline-flex h-9 items-center justify-center gap-1.5 rounded-2xl bg-brand px-4 text-xs font-black text-white shadow-lg shadow-black/20">
              {block.hasSubBlocks
                ? (lang === "th" ? "เลือกดู" : "Browse")
                : (lang === "th" ? "ช้อปเลย" : "Shop now")}
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <div className={wrapperClass}>
        {blocks.map((block) =>
          block.blockStatus ? (
            <button
              key={block.href}
              type="button"
              onClick={() => showToast(block.blockStatus!)}
              className={`${baseClass} cursor-pointer w-full text-left`}
            >
              <BlockInner block={block} />
            </button>
          ) : (
            <Link
              key={block.href}
              href={block.href}
              className={`${baseClass} active:scale-[0.99] hover:shadow-[0_8px_30px_rgba(0,0,0,0.13)]`}
            >
              <BlockInner block={block} />
            </Link>
          )
        )}
      </div>

      {/* Inline toast */}
      <div
        className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 pointer-events-none ${
          toastStatus ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
        }`}
      >
        <div className="flex items-center gap-2 rounded-2xl bg-gray-900/90 backdrop-blur-sm px-5 py-3 shadow-xl">
          <span className="text-sm font-bold text-white whitespace-nowrap">
            {toastStatus === "closed"
              ? (lang === "th" ? "ปิดการขายแล้ว ไว้โอกาสหน้านะ" : "Closed for now, see you next time!")
              : (lang === "th" ? "สินค้านี้จะเปิดตัวเร็วๆ นี้" : "Coming soon — stay tuned!")}
          </span>
        </div>
      </div>
    </>
  );
}
