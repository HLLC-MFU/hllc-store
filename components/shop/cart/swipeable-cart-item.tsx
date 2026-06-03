"use client";

import { memo, useRef, useState } from "react";
import Image from "next/image";
import { Check, Image as ImageIcon, Minus, Plus, Trash2 } from "lucide-react";
import type { CartItem } from "@/lib/cart";

export function itemKey(item: CartItem) {
  return `${item.productId}-${item.selectedOption ?? ""}`;
}

const currencyFormatter = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  maximumFractionDigits: 0,
});

export function money(value: number) {
  return currencyFormatter.format(value);
}

export interface SwipeableCartItemProps {
  item: CartItem;
  lang: "th" | "en";
  selected: boolean;
  onSelect: (item: CartItem) => void;
  onDecrease: (item: CartItem) => void;
  onIncrease: (item: CartItem) => void;
  onRemove: (item: CartItem) => void;
}

export const SwipeableCartItem = memo(function SwipeableCartItem({
  item,
  lang,
  selected,
  onSelect,
  onDecrease,
  onIncrease,
  onRemove,
}: SwipeableCartItemProps) {
  const [swipeX, setSwipeXState] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const swipeXRef = useRef(0);
  const startX = useRef(0);
  const baseX = useRef(0);
  const dragging = useRef(false);
  const MAX = 80;
  const SNAP = 40;

  function setSwipeX(x: number) {
    swipeXRef.current = x;
    setSwipeXState(x);
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    dragging.current = true;
    setIsDragging(true);
    startX.current = e.clientX;
    baseX.current = swipeXRef.current;
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragging.current) return;
    const delta = e.clientX - startX.current;
    setSwipeX(Math.max(-MAX, Math.min(0, baseX.current + delta)));
  }

  function onPointerUp() {
    if (!dragging.current) return;
    dragging.current = false;
    setIsDragging(false);
    setSwipeX(swipeXRef.current < -SNAP ? -MAX : 0);
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-100 shadow-sm">
      {/* Delete button revealed on swipe */}
      <div className="absolute inset-y-0 right-0 w-20 bg-[#85241F] flex items-center justify-center">
        <button
          type="button"
          onClick={() => onRemove(item)}
          className="text-white p-3 h-full w-full flex items-center justify-center cursor-pointer"
          aria-label={lang === "th" ? "ลบสินค้าออกจากตะกร้า" : "Remove item from cart"}
        >
          <Trash2 className="h-5 w-5" />
        </button>
      </div>

      {/* Sliding card */}
      <div
        style={{
          transform: `translateX(${swipeX}px)`,
          transition: isDragging ? "none" : "transform 0.2s ease",
          touchAction: "pan-y",
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClick={() => { if (swipeXRef.current <= -MAX + 4) setSwipeX(0); }}
        className="relative z-10 flex items-center gap-3 bg-white p-3 select-none"
      >
        {/* Checkbox */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onSelect(item); }}
          className="h-11 w-11 -m-2.5 shrink-0 flex items-center justify-center cursor-pointer rounded-full active:bg-gray-100/50"
          aria-label={lang === "th" ? "เลือกสินค้านี้" : "Select this item"}
          aria-checked={selected}
          role="checkbox"
        >
          <div
            className={`h-6 w-6 rounded-lg border-2 flex items-center justify-center transition-colors ${selected ? "bg-[#85241F] border-[#85241F]" : "border-gray-300 bg-white"
              }`}
          >
            {selected && <Check className="h-3.5 w-3.5 text-white" />}
          </div>
        </button>

        {/* Image */}
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-gray-50 flex items-center justify-center relative">
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.name[lang] || item.name.th}
              width={80}
              height={80}
              unoptimized
              className="h-full w-full object-cover"
            />
          ) : (
            <ImageIcon className="h-7 w-7 text-gray-300" />
          )}
        </div>

        {/* Details */}
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 break-words text-sm font-black text-gray-900 leading-snug">
            {item.name[lang] || item.name.th}
          </p>
          {item.selectedOption && (
            <p className="mt-0.5 text-[10px] font-bold text-gray-400">{item.selectedOption}</p>
          )}
          <p className="mt-1 text-sm font-black text-[#85241F]">{money(item.price)}</p>

          {/* Qty controls */}
          <div className="mt-2 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => onDecrease(item)}
              className="h-10 w-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 cursor-pointer"
              aria-label={lang === "th" ? "ลดจำนวน" : "Decrease quantity"}
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-6 text-center text-sm font-black text-gray-900">{item.quantity}</span>
            <button
              type="button"
              onClick={() => onIncrease(item)}
              disabled={item.stock !== undefined && item.quantity >= item.stock}
              className="h-10 w-10 rounded-full bg-[#85241F] flex items-center justify-center text-white disabled:opacity-30 cursor-pointer"
              aria-label={lang === "th" ? "เพิ่มจำนวน" : "Increase quantity"}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});
