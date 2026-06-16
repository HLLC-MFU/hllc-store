"use client";

import { memo, useRef, useState } from "react";
import Image from "next/image";
import { Check, Delete, Image as ImageIcon, Minus, Pencil, Plus, Trash2, X } from "lucide-react";
import type { CartItem } from "@/lib/client/cart";
import { useCart } from "@/lib/client/cart";
import { useLanguage } from "@/lib/client/language-context";
import { CHARM_COLORS } from "@/lib/config/catalog";

const CHARM_PRICE = 30;
const FREE_LETTERS = 2;
const LETTER_PRICE = 10;
const MAX_LETTERS = 12;
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

function colorLabel(id: string, lang: "th" | "en") {
  return CHARM_COLORS.find(c => c.id === id)?.label[lang] ?? id;
}
function colorHex(id: string) {
  return CHARM_COLORS.find(c => c.id === id)?.hex ?? "#ccc";
}

function parseCharm(customName?: string) {
  if (!customName?.startsWith("charm:")) return null;
  const [colorId, letters] = customName.slice(6).split(":");
  return { colorId, letters: letters ?? "" };
}

export function itemKey(item: CartItem) {
  return `${item.productId}-${item.selectedOption ?? ""}-${item.customName ?? ""}`;
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
  charmImages?: Record<string, string>;
  onSelect: (item: CartItem) => void;
  onDecrease: (item: CartItem) => void;
  onIncrease: (item: CartItem) => void;
  onRemove: (item: CartItem) => void;
}

export const SwipeableCartItem = memo(function SwipeableCartItem({
  item,
  lang,
  selected,
  charmImages,
  onSelect,
  onDecrease,
  onIncrease,
  onRemove,
}: SwipeableCartItemProps) {
  const { addItem, removeItem, updateQty } = useCart();
  const { t } = useLanguage();
  const [swipeX, setSwipeXState] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmDeleteCharm, setConfirmDeleteCharm] = useState(false);
  const swipeXRef = useRef(0);
  const startX = useRef(0);
  const baseX = useRef(0);
  const dragging = useRef(false);
  const SNAP = 40;

  // Charm edit modal state
  const [charmOpen, setCharmOpen] = useState(false);
  const [charmStep, setCharmStep] = useState<"color" | "letters">("color");
  const [tempColor, setTempColor] = useState("");
  const [tempLetters, setTempLetters] = useState("");

  function setSwipeX(x: number) {
    swipeXRef.current = x;
    setSwipeXState(x);
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== "touch") return;
    startX.current = e.clientX;
    baseX.current = swipeXRef.current;
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== "touch") return;
    const delta = e.clientX - startX.current;
    if (!dragging.current) {
      if (Math.abs(delta) < 6) return;
      dragging.current = true;
      setIsDragging(true);
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    setSwipeX(Math.max(-MAX, Math.min(0, baseX.current + delta)));
  }

  function onPointerUp() {
    if (!dragging.current) return;
    dragging.current = false;
    setIsDragging(false);
    setSwipeX(swipeXRef.current < -SNAP ? -MAX : 0);
  }

  function handleDecrease() {
    if (item.quantity === 1) {
      setConfirmDelete(true);
      setSwipeX(0);
    } else {
      onDecrease(item);
    }
  }

  function openCharmEdit() {
    const parsed = parseCharm(item.customName);
    setTempColor(parsed?.colorId ?? "");
    setTempLetters(parsed?.letters ?? "");
    setCharmStep("color");
    setCharmOpen(true);
  }

  function confirmCharmEdit() {
    if (!tempColor || tempLetters.length < 2) return;
    const newCustomName = `charm:${tempColor}:${tempLetters}`;
    const qty = item.quantity;
    removeItem(item.productId, item.selectedOption, item.customName);
    addItem({ ...item, customName: newCustomName });
    if (qty > 1) updateQty(item.productId, qty, item.selectedOption, newCustomName);
    setCharmOpen(false);
  }

  const extraLetters = Math.max(0, tempLetters.length - FREE_LETTERS);
  const tempCharmAddon = CHARM_PRICE + extraLetters * LETTER_PRICE;

  const charmInfo = parseCharm(item.customName);
  const charmExtra = charmInfo ? Math.max(0, charmInfo.letters.length - FREE_LETTERS) : 0;
  const charmTotal = charmInfo ? CHARM_PRICE + charmExtra * LETTER_PRICE : 0;
  const isBottleNoCharm = item.allowCustomName && !charmInfo;
  const MAX = isBottleNoCharm ? 148 : 80;

  function removeCharmOnly() {
    if (!charmInfo) return;
    const qty = item.quantity;
    removeItem(item.productId, item.selectedOption, item.customName);
    addItem({ ...item, customName: undefined });
    if (qty > 1) updateQty(item.productId, qty, item.selectedOption, undefined);
  }


  return (
    <>
      <div className="relative overflow-hidden rounded-2xl">
        {/* Action buttons revealed on swipe */}
        <div className={`absolute inset-y-2 right-2 flex gap-1.5 ${swipeX === 0 ? "invisible" : ""}`}>
          {isBottleNoCharm && (
            <div className="w-16 rounded-2xl bg-[#85241F] flex flex-col items-center justify-center gap-1">
              <button
                type="button"
                onClick={() => { setSwipeX(0); openCharmEdit(); }}
                className="h-full w-full flex flex-col items-center justify-center gap-1 text-white cursor-pointer"
              >
                <Plus className="h-5 w-5" />
                <span className="text-[10px] font-bold text-center leading-tight px-1">{t("cart.add_keychain")}</span>
              </button>
            </div>
          )}
          <div className="w-16 rounded-2xl bg-[#85241F] flex flex-col items-center justify-center gap-1">
            <button
              type="button"
              onClick={() => { setConfirmDelete(true); setSwipeX(0); }}
              className="h-full w-full flex flex-col items-center justify-center gap-1 text-white cursor-pointer"
              aria-label={t("cart.remove_aria")}
            >
              <Trash2 className="h-5 w-5" />
              <span className="text-[10px] font-bold">{t("cart.delete")}</span>
            </button>
          </div>
        </div>

        {/* Sliding content */}
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
          className="relative z-10 select-none rounded-2xl shadow-sm"
        >
          <div className="rounded-2xl bg-white border border-gray-100 overflow-hidden">
            {/* Product row */}
            <div className="flex items-center gap-2.5 px-3 py-3">
              {/* Checkbox */}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onSelect(item); }}
                className="shrink-0 cursor-pointer"
                aria-checked={selected}
                role="checkbox"
              >
                <div className={`h-5 w-5 rounded-md border-2 flex items-center justify-center transition-colors ${selected ? "bg-[#85241F] border-[#85241F]" : "border-gray-300 bg-white"}`}>
                  {selected && <Check className="h-3 w-3 text-white" />}
                </div>
              </button>

              {/* Product image */}
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-gray-50 flex items-center justify-center">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.name[lang] || item.name.th}
                    width={96}
                    height={96}
                    unoptimized
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <ImageIcon className="h-8 w-8 text-gray-300" />
                )}
              </div>

              {/* Details */}
              <div className="min-w-0 flex-1 flex flex-col justify-between self-stretch py-0.5">
                {/* Name + edit button */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="line-clamp-2 text-sm font-black text-gray-900 leading-snug">
                      {item.name[lang] || item.name.th}
                    </p>
                    {item.selectedOption && (
                      <p className="mt-0.5 text-[10px] text-gray-400">{item.selectedOption}</p>
                    )}
                    {item.customName && !charmInfo && (
                      <p className="mt-0.5 text-[10px] font-bold text-[#85241F]">
                        {t("cart.custom_name_label")}: {item.customName}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setSwipeX(swipeX < 0 ? 0 : -MAX); }}
                    className={`shrink-0 text-[11px] font-bold cursor-pointer leading-snug transition-colors ${swipeX < 0 ? "text-[#85241F]" : "text-gray-400 hover:text-gray-600"}`}
                  >
                    {swipeX < 0 ? t("cart.done") : t("cart.edit")}
                  </button>
                </div>

                {/* Price + qty bottom row */}
                <div className="flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                  <div>
                    <p className="text-base font-black text-[#85241F]">{money((item.price + charmTotal) * item.quantity)}</p>
                    {(charmInfo || item.quantity > 1) && (
                      <p className="text-[10px] text-gray-400">
                        {charmInfo
                          ? `${money(item.price)} + ${charmTotal}฿${item.quantity > 1 ? ` × ${item.quantity}` : ""}`
                          : `${money(item.price)}/${t("cart.pcs")}`}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button type="button" onClick={handleDecrease} className="h-6 w-6 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 cursor-pointer">
                      <Minus className="h-2.5 w-2.5" />
                    </button>
                    <span className="w-5 text-center text-sm font-black text-gray-900">{item.quantity}</span>
                    <button type="button" onClick={() => onIncrease(item)} disabled={item.stock !== undefined && item.quantity >= item.stock} className="h-6 w-6 rounded-lg bg-[#85241F] flex items-center justify-center text-white disabled:opacity-30 cursor-pointer">
                      <Plus className="h-2.5 w-2.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Add lanyard strip — shown when bottle has no lanyard yet */}
            {item.allowCustomName && !charmInfo && (
              <div className="border-t border-dashed border-gray-200 px-3 py-2.5 flex items-center justify-between gap-2" onClick={e => e.stopPropagation()}>
                <p className="text-[11px] text-gray-400">{t("cart.no_keychain")}</p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={openCharmEdit}
                    className="flex items-center gap-1.5 rounded-xl border border-[#85241F] px-3 py-1.5 text-[11px] font-black text-[#85241F] cursor-pointer active:bg-[#85241F] active:text-white transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                    {t("cart.add_keychain")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 text-gray-400 cursor-pointer"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )}

            {/* Charm strip — full width below product row */}
            {charmInfo && (() => {
              const imgUrl = charmImages?.[charmInfo.colorId];
              return (
                <div className="relative border-t border-dashed border-gray-200 px-3 py-2.5 flex items-center gap-2.5" onClick={(e) => e.stopPropagation()}>
                  <div className="h-10 w-10 shrink-0 rounded-xl border border-gray-200 bg-white overflow-hidden flex items-center justify-center">
                    {imgUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={imgUrl} alt={colorLabel(charmInfo.colorId, lang)} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-5 w-5 rounded-full" style={{ backgroundColor: colorHex(charmInfo.colorId) }} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-black text-[#85241F]">{t("cart.keychain_plus")}</p>
                    <p className="text-[10px] text-gray-500 truncate">
                      {colorLabel(charmInfo.colorId, lang)}
                      {charmInfo.letters ? ` · ${charmInfo.letters}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button type="button" onClick={openCharmEdit} className="h-7 w-7 flex items-center justify-center rounded-full bg-white border border-gray-200 shadow-sm cursor-pointer">
                      <Pencil className="h-3 w-3 text-gray-400" />
                    </button>
                    <button type="button" onClick={() => setConfirmDeleteCharm(true)} className="h-7 w-7 flex items-center justify-center rounded-full bg-white border border-gray-200 shadow-sm cursor-pointer">
                      <Trash2 className="h-3 w-3 text-gray-400" />
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Confirm delete charm */}
      {confirmDeleteCharm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-6" onClick={() => setConfirmDeleteCharm(false)}>
          <div className="w-full max-w-sm rounded-3xl bg-white px-5 pt-6 pb-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <p className="text-sm font-black text-gray-900 text-center">{t("cart.remove_charm_title")}</p>
            <p className="mt-1 text-xs text-gray-400 text-center">{t("cart.remove_charm_sub")}</p>
            <div className="mt-5 flex gap-2">
              <button type="button" onClick={() => setConfirmDeleteCharm(false)} className="flex-1 rounded-2xl border border-gray-200 py-3 text-sm font-bold text-gray-600 cursor-pointer">
                {t("cart.cancel")}
              </button>
              <button type="button" onClick={() => { removeCharmOnly(); setConfirmDeleteCharm(false); }} className="flex-1 rounded-2xl bg-[#85241F] py-3 text-sm font-black text-white cursor-pointer">
                {t("cart.remove")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-6"
          onClick={() => setConfirmDelete(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-white px-5 pt-6 pb-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-start gap-3">
              {item.imageUrl && (
                <Image
                  src={item.imageUrl}
                  alt={item.name[lang] || item.name.th}
                  width={56}
                  height={56}
                  unoptimized
                  className="h-14 w-14 rounded-xl object-cover shrink-0"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-gray-900 line-clamp-2 leading-snug">
                  {item.name[lang] || item.name.th}
                </p>
                {item.selectedOption && (
                  <p className="mt-0.5 text-[10px] font-bold text-gray-400">{item.selectedOption}</p>
                )}
                <p className="mt-1 text-xs font-bold text-gray-500">
                  {item.quantity} {t("cart.pcs")} · {money(item.price * item.quantity)}
                </p>
                {charmInfo && (
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <div
                      className="h-3 w-3 rounded-full border border-white shadow-sm shrink-0"
                      style={{ backgroundColor: colorHex(charmInfo.colorId) }}
                    />
                    <p className="text-[10px] font-bold text-[#85241F]">
                      {t("cart.keychain_label")} {colorLabel(charmInfo.colorId, lang)}
                      {charmInfo.letters ? ` — ${charmInfo.letters.split("").join(" ")}` : ""}
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="flex-1 rounded-2xl border border-gray-200 py-3 text-sm font-bold text-gray-600 cursor-pointer"
              >
                {t("cart.cancel")}
              </button>
              <button
                type="button"
                onClick={() => { onRemove(item); setConfirmDelete(false); }}
                className="flex-1 rounded-2xl bg-[#85241F] py-3 text-sm font-black text-white cursor-pointer"
              >
                {t("cart.remove")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Charm edit modal */}
      {charmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
          onClick={() => setCharmOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-white px-5 pt-5 pb-6 shadow-2xl max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-gray-200" />

            {charmStep === "color" ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-base font-black text-gray-900">{t("cart.pick_keychain_color")}</p>
                    <p className="text-xs text-gray-400 mt-0.5">+{CHARM_PRICE}฿ / อัน</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCharmOpen(false)}
                    className="h-8 w-8 flex items-center justify-center rounded-full bg-gray-100 cursor-pointer"
                  >
                    <X className="h-4 w-4 text-gray-500" />
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-3">
                  {CHARM_COLORS.map((color) => {
                    const isActive = tempColor === color.id;
                    const imgUrl = charmImages?.[color.id];
                    return (
                      <button
                        key={color.id}
                        type="button"
                        onClick={() => setTempColor(color.id)}
                        className={`flex flex-col items-center gap-2 rounded-2xl py-3 px-1 transition-all cursor-pointer ${isActive ? "bg-white ring-2 ring-[#85241F]" : "bg-gray-50 hover:bg-gray-100"}`}
                      >
                        <div className="h-12 w-12 rounded-xl overflow-hidden shadow-sm border border-gray-100 flex items-center justify-center bg-white">
                          {imgUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={imgUrl} alt={color.label[lang] ?? color.label.th} className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-8 w-8 rounded-full" style={{ backgroundColor: color.hex }} />
                          )}
                        </div>
                        <span className={`text-[10px] font-bold ${isActive ? "text-[#85241F]" : "text-gray-600"}`}>
                          {color.label[lang] ?? color.label.th}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  disabled={!tempColor}
                  onClick={() => setCharmStep("letters")}
                  className="mt-5 w-full rounded-2xl bg-[#85241F] py-3 text-sm font-black text-white disabled:opacity-30 cursor-pointer"
                >
                  ถัดไป →
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-base font-black text-gray-900">{t("cart.pick_letters")}</p>
                  <button
                    type="button"
                    onClick={() => setCharmOpen(false)}
                    className="h-8 w-8 flex items-center justify-center rounded-full bg-gray-100 cursor-pointer"
                  >
                    <X className="h-4 w-4 text-gray-500" />
                  </button>
                </div>

                {/* Free letters info */}
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: FREE_LETTERS }).map((_, i) => (
                      <span key={i} className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black ${i < tempLetters.length ? "bg-[#85241F] text-white" : "bg-gray-900 text-white opacity-20"}`}>
                        {tempLetters[i] ?? "•"}
                      </span>
                    ))}
                  </div>
                  <span className="text-[11px] font-black text-gray-900">{FREE_LETTERS} {t("cart.free_letters")}</span>
                  <span className="text-[10px] font-semibold text-gray-400">· ตัวต่อไป +{LETTER_PRICE}฿</span>
                </div>

                {/* Selected letters + delete button */}
                <div className="mb-3 flex min-h-10 items-center gap-1.5">
                  <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
                    {tempLetters.length > 0 ? (
                      tempLetters.split("").map((l, i) => (
                        <span
                          key={i}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-[#85241F] text-sm font-black text-white shadow-sm"
                        >
                          {l}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs font-semibold text-gray-400">{t("charm.tap_letters_below")}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setTempLetters((prev) => prev.slice(0, -1))}
                    disabled={tempLetters.length === 0}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-red-100 hover:text-red-500 disabled:opacity-30 transition-colors cursor-pointer"
                    aria-label="ลบตัวอักษร"
                  >
                    <Delete className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Price breakdown */}
                <div className="mb-4 flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2.5 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    {tempColor && (
                      <div className="h-4 w-4 rounded-full border border-white shadow-sm" style={{ backgroundColor: colorHex(tempColor) }} />
                    )}
                    <span className="font-semibold text-gray-500">
                      {t("cart.keychain_color_label")} {colorLabel(tempColor, lang)} +{CHARM_PRICE}฿
                      {tempLetters.length > FREE_LETTERS && ` · ${t("charm.letters_step")} +${tempLetters.length - FREE_LETTERS}×${LETTER_PRICE}฿`}
                    </span>
                  </div>
                  <span className="font-black text-[#85241F]">+{tempCharmAddon}฿</span>
                </div>

                {/* A–Z grid */}
                <div className="grid grid-cols-7 gap-1.5 mb-4">
                  {ALPHABET.map((letter) => (
                    <button
                      key={letter}
                      type="button"
                      disabled={tempLetters.length >= MAX_LETTERS}
                      onClick={() => setTempLetters((prev) => prev + letter)}
                      className="flex h-10 w-full items-center justify-center rounded-xl bg-gray-100 text-sm font-black text-gray-700 transition-all hover:bg-[#fce8e7] hover:text-[#85241F] active:scale-90 disabled:opacity-30 cursor-pointer"
                    >
                      {letter}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setCharmStep("color")}
                    className="flex h-12 flex-1 items-center justify-center rounded-2xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 cursor-pointer"
                  >
                    ← {t("charm.change_color")}
                  </button>
                  <button
                    type="button"
                    onClick={confirmCharmEdit}
                    disabled={tempLetters.length < 2}
                    className="flex h-12 flex-1 items-center justify-center rounded-2xl bg-[#85241F] text-sm font-black text-white shadow-lg shadow-[#85241F]/20 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none disabled:shadow-none"
                  >
                    ยืนยัน +{tempCharmAddon}฿
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
});
