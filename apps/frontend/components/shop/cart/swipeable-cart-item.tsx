"use client";

import { memo, useRef, useState } from "react";
import Image from "next/image";
import { Check, Delete, Image as ImageIcon, Minus, Pencil, Plus, Trash2, X } from "lucide-react";
import type { CartItem } from "@/lib/client/cart";
import { useCart } from "@/lib/client/cart";
import { useLanguage } from "@/lib/client/language-context";

const CHARM_PRICE = 30;
const FREE_LETTERS = 2;
const LETTER_PRICE = 10;
const MAX_LETTERS = 9;
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

type CharmOption = { label: string; labelEn?: string; imageUrl?: string };

function getColorName(colorId: string, lang: "th" | "en", charmOptions?: CharmOption[]) {
  const opt = charmOptions?.find((o) => o.label === colorId);
  return lang === "en" && opt?.labelEn ? opt.labelEn : opt?.label ?? colorId;
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
  isBlocked?: boolean;
  charmImages?: Record<string, string>;
  charmOptions?: CharmOption[];
  onSelect: (item: CartItem) => void;
  onDecrease: (item: CartItem) => void;
  onIncrease: (item: CartItem) => void;
  onRemove: (item: CartItem) => void;
  onCharmEdit?: (oldCustomName: string | undefined, newCustomName: string) => void;
}

export const SwipeableCartItem = memo(function SwipeableCartItem({
  item,
  lang,
  selected,
  isBlocked = false,
  charmImages,
  charmOptions,
  onSelect,
  onDecrease,
  onIncrease,
  onRemove,
  onCharmEdit,
}: SwipeableCartItemProps) {
  const { addItem, removeItem, updateQty, items: allItems } = useCart();
  const totalProductQty = allItems.filter((i) => i.productId === item.productId).reduce((sum, i) => sum + i.quantity, 0);
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
  const [tempLetters, setTempLetters] = useState<string[]>([]);

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
    setTempLetters((parsed?.letters ?? "").split("").filter(Boolean));
    setCharmStep("color");
    setCharmOpen(true);
  }

  function confirmCharmEdit() {
    if (!tempColor || tempLetters.length < 2) return;
    const newCustomName = `charm:${tempColor}:${tempLetters.join("")}`;
    const qty = item.quantity;
    const basePrice = item.price - charmTotal; // strip existing charm price (0 if none)
    const newPrice = basePrice + CHARM_PRICE + tempExtraLetters * LETTER_PRICE;
    onCharmEdit?.(item.customName, newCustomName);
    removeItem(item.productId, item.selectedOption, item.customName);
    addItem({ ...item, customName: newCustomName, price: newPrice });
    if (qty > 1) updateQty(item.productId, qty, item.selectedOption, newCustomName);
    setCharmOpen(false);
  }

  const tempExtraLetters = Math.max(0, tempLetters.length - FREE_LETTERS);
  const tempCharmAddon = CHARM_PRICE + tempExtraLetters * LETTER_PRICE;
  const tempCharmOption = charmOptions?.find((o) => o.label === tempColor);

  const charmInfo = parseCharm(item.customName);
  const charmExtra = charmInfo ? Math.max(0, charmInfo.letters.length - FREE_LETTERS) : 0;
  const charmTotal = charmInfo ? CHARM_PRICE + charmExtra * LETTER_PRICE : 0;
  const isBottleNoCharm = item.allowCustomName && !charmInfo;
  const MAX = isBottleNoCharm ? 148 : 80;

  function removeCharmOnly() {
    if (!charmInfo) return;
    const qty = item.quantity;
    const basePrice = item.price - charmTotal;
    removeItem(item.productId, item.selectedOption, item.customName);
    addItem({ ...item, customName: undefined, price: basePrice });
    if (qty > 1) updateQty(item.productId, qty, item.selectedOption, undefined);
  }

  return (
    <>
      <div className="relative overflow-hidden rounded-2xl">
        {/* Action buttons revealed on swipe */}
        <div className={`absolute inset-y-2 right-2 flex gap-1.5 ${swipeX === 0 ? "invisible" : ""}`}>
          {isBottleNoCharm && (
            <div className="w-16 rounded-2xl bg-brand flex flex-col items-center justify-center gap-1">
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
          <div className="w-16 rounded-2xl bg-brand flex flex-col items-center justify-center gap-1">
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
                onClick={(e) => { e.stopPropagation(); if (!isBlocked) onSelect(item); }}
                className={`shrink-0 ${isBlocked ? "cursor-not-allowed opacity-40" : "cursor-pointer"}`}
                aria-checked={selected && !isBlocked}
                role="checkbox"
                disabled={isBlocked}
              >
                <div className={`h-5 w-5 rounded-md border-2 flex items-center justify-center transition-colors ${selected && !isBlocked ? "bg-brand border-brand" : "border-gray-300 bg-white"}`}>
                  {selected && !isBlocked && <Check className="h-3 w-3 text-white" />}
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
                    {isBlocked && (
                      <span className="inline-block mb-1 text-[10px] font-black px-2 py-0.5 rounded-lg bg-gray-100 text-gray-500">
                        {lang === "th" ? "ยังไม่เปิดขาย" : "Not available"}
                      </span>
                    )}
                    <p className={`line-clamp-2 text-sm font-black leading-snug ${isBlocked ? "text-gray-400" : "text-gray-900"}`}>
                      {item.name[lang] || item.name.th}
                    </p>
                    {item.selectedOption && (
                      <p className="mt-0.5 text-[10px] text-gray-400">{item.selectedOption}</p>
                    )}
                    {item.customName && !charmInfo && (
                      <p className="mt-0.5 text-[10px] font-bold text-brand">
                        {t("cart.custom_name_label")}: {item.customName}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setSwipeX(swipeX < 0 ? 0 : -MAX); }}
                    className={`shrink-0 text-[11px] font-bold cursor-pointer leading-snug transition-colors ${swipeX < 0 ? "text-brand" : "text-gray-400 hover:text-gray-600"}`}
                  >
                    {swipeX < 0 ? t("cart.done") : t("cart.edit")}
                  </button>
                </div>

                {/* Price + qty bottom row */}
                <div className="flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                  <div>
                    <p className="text-base font-black text-brand">{money((item.price + charmTotal) * item.quantity)}</p>
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
                    <span className="min-w-8 text-center text-sm font-black text-gray-900">{item.quantity}</span>
                    <button type="button" onClick={() => onIncrease(item)} disabled={item.stock !== undefined && totalProductQty >= item.stock} className="h-6 w-6 rounded-lg bg-brand flex items-center justify-center text-white disabled:opacity-30 cursor-pointer">
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
                    className="flex items-center gap-1.5 rounded-xl border border-brand px-3 py-1.5 text-[11px] font-black text-brand cursor-pointer active:bg-brand active:text-white transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                    {t("cart.add_keychain")}
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
                      <Image src={imgUrl} alt={getColorName(charmInfo.colorId, lang, charmOptions)} width={40} height={40} unoptimized className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-5 w-5 rounded-full bg-gray-200" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-black text-brand">{t("cart.keychain_plus")}</p>
                    <p className="text-[10px] text-gray-500 truncate">
                      {getColorName(charmInfo.colorId, lang, charmOptions)}
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
              <button type="button" onClick={() => { removeCharmOnly(); setConfirmDeleteCharm(false); }} className="flex-1 rounded-2xl bg-brand py-3 text-sm font-black text-white cursor-pointer">
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
                    {charmImages?.[charmInfo.colorId] ? (
                      <Image src={charmImages[charmInfo.colorId]} alt="" width={12} height={12} unoptimized className="h-3 w-3 rounded-full object-cover border border-white shadow-sm shrink-0" />
                    ) : (
                      <div className="h-3 w-3 rounded-full bg-gray-300 border border-white shadow-sm shrink-0" />
                    )}
                    <p className="text-[10px] font-bold text-brand">
                      {t("cart.keychain_label")} {getColorName(charmInfo.colorId, lang, charmOptions)}
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
                className="flex-1 rounded-2xl bg-brand py-3 text-sm font-black text-white cursor-pointer"
              >
                {t("cart.remove")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Charm edit modal — matches product-detail-view design */}
      {charmOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setCharmOpen(false)} />
          <div className="relative w-full max-w-md bg-white rounded-4xl shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden max-h-[95vh] flex flex-col">

            {/* Step 1: Color — image+price header + pill grid */}
            {charmStep === "color" && (() => {
              const previewOption = (charmOptions ?? []).find(o => o.label === tempColor) ?? charmOptions?.[0];
              const previewImg = previewOption?.imageUrl;
              return (
                <>
                  <div className="relative border-b border-gray-100">
                    <div className="flex gap-4 px-4 py-4">
                      <div className="relative w-28 h-28 shrink-0 rounded-2xl overflow-hidden bg-gray-50 border border-gray-100">
                        {previewImg && (
                          <Image src={previewImg} alt={previewOption ? (lang === "en" && previewOption.labelEn ? previewOption.labelEn : previewOption.label) : ""} fill className="object-contain" sizes="112px" unoptimized />
                        )}
                      </div>
                      <div className="flex flex-col justify-center gap-2 flex-1 min-w-0 pr-8">
                        <span className="text-2xl font-black text-brand">+{CHARM_PRICE}฿</span>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
                            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white text-[8px] font-black">✓</span>
                            {lang === "th" ? `ตัวอักษรฟรี ${FREE_LETTERS} ตัว` : `${FREE_LETTERS} free letters`}
                          </div>
                          <div className="text-[11px] text-gray-400 font-medium">
                            {lang === "th" ? `ตัวอักษรเพิ่มเติม +${LETTER_PRICE}฿ ตัว` : `+${LETTER_PRICE}฿ per extra letter`}
                          </div>
                        </div>
                      </div>
                    </div>
                    <button type="button" onClick={() => setCharmOpen(false)} className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="px-5 py-4">
                    <p className="mb-3 text-sm font-black text-gray-900">
                      {lang === "th" ? "สีพวงกุญแจ" : "Keychain Color"} <span className="text-xs font-semibold text-gray-400 ml-1">(+{CHARM_PRICE}฿)</span>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {(charmOptions ?? []).map((option) => {
                        const isActive = tempColor === option.label;
                        const displayName = lang === "en" && option.labelEn ? option.labelEn : option.label;
                        return (
                          <button
                            key={option.label}
                            type="button"
                            onClick={() => setTempColor(option.label)}
                            className={`flex items-center gap-1.5 h-9 rounded-2xl border-2 pl-1.5 pr-3 text-sm font-black transition-all cursor-pointer ${isActive ? "border-brand bg-brand/5 text-brand" : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"}`}
                          >
                            {option.imageUrl ? (
                              <Image src={option.imageUrl} alt={displayName} width={24} height={24} unoptimized className="h-6 w-6 rounded-full object-cover shrink-0" />
                            ) : (
                              <div className="h-6 w-6 rounded-full bg-gray-200 shrink-0" />
                            )}
                            {displayName}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      type="button"
                      onClick={() => setCharmStep("letters")}
                      disabled={!tempColor}
                      className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-brand text-sm font-black text-white shadow-lg shadow-brand/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98]"
                    >
                      {t("charm.next_add_letters")}
                    </button>
                  </div>
                </>
              );
            })()}

            {/* Step 2: Letters — stepper header */}
            {charmStep === "letters" && (
              <div className="flex items-center justify-between px-5 pt-5 pb-4 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black bg-emerald-500 text-white">✓</div>
                  <span className="text-[11px] font-black text-emerald-600">{t("charm.color_step")}</span>
                  <div className="h-px w-6 bg-emerald-300" />
                  <div className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black bg-brand text-white">2</div>
                  <span className="text-[11px] font-black text-gray-900">{t("charm.letters_step")}</span>
                </div>
                <button type="button" onClick={() => setCharmOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {charmStep === "letters" && (
              <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-5">
                {/* Free letters info */}
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: FREE_LETTERS }).map((_, i) => (
                      <span key={i} className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black ${i < tempLetters.length ? "bg-brand text-white" : "bg-gray-900 text-white opacity-20"}`}>
                        {tempLetters[i] ?? "•"}
                      </span>
                    ))}
                  </div>
                  <span className="text-[11px] font-black text-gray-900">
                    {t("charm.free_letters", { count: FREE_LETTERS })}
                  </span>
                  <span className="text-[10px] font-semibold text-gray-400">
                    · {t("charm.extra_letter_price", { price: LETTER_PRICE })}
                  </span>
                  <span className="text-[10px] font-semibold text-gray-400">
                    · {lang === "th" ? `สูงสุด ${MAX_LETTERS} ตัว` : `max ${MAX_LETTERS} letters`}
                  </span>
                </div>

                {/* Selected letters display */}
                <div className="mb-3 flex min-h-[2.5rem] items-center gap-1.5">
                  <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
                    {tempLetters.length > 0 ? (
                      tempLetters.map((letter, idx) => (
                        <span
                          key={idx}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-sm font-black text-white shadow-sm"
                        >
                          {letter}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs font-semibold text-gray-400">
                        {t("charm.tap_letters_below")}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setTempLetters((prev) => prev.slice(0, -1))}
                    disabled={tempLetters.length === 0}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 hover:border-red-200 hover:bg-red-100 hover:text-red-500 disabled:opacity-30 transition-colors"
                  >
                    <Delete className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Price breakdown */}
                <div className="mb-4 flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2.5 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    {tempCharmOption?.imageUrl && (
                      <Image src={tempCharmOption.imageUrl} alt="" width={16} height={16} unoptimized className="h-4 w-4 rounded-full border border-white shadow-sm object-cover" />
                    )}
                    <span className="font-semibold text-gray-500">
                      {t("charm.charm_label")} +{CHARM_PRICE}฿
                      {tempExtraLetters > 0 && ` · ${lang === "th" ? "ตัวอักษร" : "Letters"} +${tempExtraLetters}×${LETTER_PRICE}฿`}
                    </span>
                  </div>
                  <span className="font-black text-brand">+{tempCharmAddon}฿</span>
                </div>

                {/* A–Z grid */}
                <div className="grid grid-cols-7 gap-1.5">
                  {ALPHABET.map((letter) => (
                    <button
                      key={letter}
                      type="button"
                      onClick={() => {
                        if (tempLetters.length < MAX_LETTERS) {
                          setTempLetters((prev) => [...prev, letter]);
                        }
                      }}
                      disabled={tempLetters.length >= MAX_LETTERS}
                      className="flex h-10 w-full items-center justify-center rounded-xl bg-gray-100 text-sm font-black text-gray-700 transition-all hover:bg-brand-tint hover:text-brand active:scale-90 disabled:opacity-30"
                    >
                      {letter}
                    </button>
                  ))}
                </div>

                {/* Actions */}
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setCharmStep("color")}
                    className="flex h-12 flex-1 items-center justify-center rounded-2xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 active:scale-[0.98] transition-all"
                  >
                    ← {t("charm.change_color")}
                  </button>
                  <button
                    type="button"
                    onClick={confirmCharmEdit}
                    disabled={tempLetters.length < 2}
                    className="flex h-12 flex-1 items-center justify-center rounded-2xl bg-brand text-sm font-black text-white shadow-lg shadow-brand/20 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none disabled:shadow-none"
                  >
                    {t("charm.confirm")}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
});
