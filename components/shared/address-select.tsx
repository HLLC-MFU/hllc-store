"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, ChevronRight, Search, X } from "lucide-react";
import {
  loadAddressData,
  findProvince,
  findDistrict,
  type AddressProvince,
} from "@/lib/data/thai-address";

export type AddressValue = {
  province: string;
  district: string;
  subDistrict: string;
  postalCode: string;
};

type Step = "province" | "district" | "subDistrict" | "zip";

type Props = {
  lang: "th" | "en";
  value: AddressValue;
  onChange: (value: AddressValue) => void;
  error?: string;
};

const EMPTY: AddressValue = { province: "", district: "", subDistrict: "", postalCode: "" };

const STEP_LABEL: Record<Step, { th: string; en: string }> = {
  province:    { th: "จังหวัด",        en: "Province" },
  district:    { th: "เขต/อำเภอ",      en: "District" },
  subDistrict: { th: "แขวง/ตำบล",      en: "Sub-district" },
  zip:         { th: "รหัสไปรษณีย์",   en: "Postal code" },
};

function firstEmptyStep(v: AddressValue): Step {
  if (!v.province) return "province";
  if (!v.district) return "district";
  if (!v.subDistrict) return "subDistrict";
  return "zip";
}

export function AddressSelect({ lang, value, onChange, error }: Props) {
  const [data, setData] = useState<AddressProvince[]>([]);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("province");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let alive = true;
    loadAddressData().then((d) => { if (alive) setData(d); }).catch(() => {});
    return () => { alive = false; };
  }, []);

  // Lock body scroll while the picker is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const province = useMemo(() => findProvince(data, value.province), [data, value.province]);
  const district = useMemo(() => findDistrict(province, value.district), [province, value.district]);
  const isBangkok = value.province === "กรุงเทพมหานคร";

  // Decorated Thai names (จังหวัด.. / อำเภอ.. / ตำบล..); English uses the plain name.
  const decoProvince = (th: string) => (lang === "th" ? `จังหวัด${th}` : data.find((p) => p.th === th)?.en ?? th);
  const decoDistrict = (th: string) =>
    lang === "th" ? (th.startsWith("เขต") ? th : `อำเภอ${th}`) : province?.districts.find((d) => d.th === th)?.en ?? th;
  const decoSub = (th: string) =>
    lang === "th" ? `${isBangkok ? "แขวง" : "ตำบล"}${th}` : district?.subDistricts.find((s) => s.th === th)?.en ?? th;

  const zipsFor = (subTh: string) =>
    Array.from(new Set((district?.subDistricts ?? []).filter((s) => s.th === subTh && s.zip).map((s) => s.zip)));

  // Options for the current step (filtered by search query).
  const options = useMemo<string[]>(() => {
    const q = query.trim().toLowerCase();
    let list: string[] = [];
    if (step === "province") list = data.map((p) => p.th);
    else if (step === "district") list = province?.districts.map((d) => d.th) ?? [];
    else if (step === "subDistrict") list = Array.from(new Set(district?.subDistricts.map((s) => s.th) ?? []));
    else list = zipsFor(value.subDistrict);
    if (!q) return list;
    return list.filter((item) => {
      if (step === "zip") return item.includes(q);
      const en =
        step === "province" ? data.find((p) => p.th === item)?.en
        : step === "district" ? province?.districts.find((d) => d.th === item)?.en
        : district?.subDistricts.find((s) => s.th === item)?.en;
      return item.toLowerCase().includes(q) || (en ?? "").toLowerCase().includes(q);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, query, data, province, district, value.subDistrict]);

  function labelOf(step: Step, item: string) {
    if (step === "province") return decoProvince(item);
    if (step === "district") return decoDistrict(item);
    if (step === "subDistrict") return decoSub(item);
    return item;
  }

  function openPicker() {
    setQuery("");
    setStep(firstEmptyStep(value));
    setOpen(true);
  }

  function pick(item: string) {
    setQuery("");
    if (step === "province") { onChange({ ...EMPTY, province: item }); setStep("district"); return; }
    if (step === "district") { onChange({ ...value, district: item, subDistrict: "", postalCode: "" }); setStep("subDistrict"); return; }
    if (step === "subDistrict") {
      const zips = zipsFor(item);
      if (zips.length <= 1) { onChange({ ...value, subDistrict: item, postalCode: zips[0] ?? "" }); setOpen(false); }
      else { onChange({ ...value, subDistrict: item, postalCode: "" }); setStep("zip"); }
      return;
    }
    onChange({ ...value, postalCode: item });
    setOpen(false);
  }

  function clearAll() {
    onChange(EMPTY);
    setStep("province");
    setQuery("");
  }

  const filled = Boolean(value.province);
  const placeholder = lang === "th" ? "จังหวัด, เขต/อำเภอ, แขวง/ตำบล, รหัสไปรษณีย์" : "Province, District, Sub-district, Postal code";

  // Breadcrumb: completed steps (tappable) up to the current one.
  const crumbs: { step: Step; label: string }[] = [];
  if (value.province && step !== "province") crumbs.push({ step: "province", label: decoProvince(value.province) });
  if (value.district && (step === "subDistrict" || step === "zip")) crumbs.push({ step: "district", label: decoDistrict(value.district) });
  if (value.subDistrict && step === "zip") crumbs.push({ step: "subDistrict", label: decoSub(value.subDistrict) });

  return (
    <>
      {/* Collapsed trigger field */}
      <button
        type="button"
        onClick={openPicker}
        className="flex w-full items-center gap-3 bg-transparent py-3 pl-10 pr-1 text-left"
      >
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-gray-400">{placeholder}</p>
          {filled ? (
            <div className="mt-0.5 text-sm font-bold text-gray-900 leading-snug">
              <p>{decoProvince(value.province)}</p>
              {value.district && <p>{decoDistrict(value.district)}</p>}
              {value.subDistrict && <p>{decoSub(value.subDistrict)}</p>}
              {value.postalCode && <p>{value.postalCode}</p>}
            </div>
          ) : (
            <p className="mt-0.5 text-sm font-semibold text-gray-400">
              {lang === "th" ? "แตะเพื่อเลือกที่อยู่" : "Tap to choose address"}
            </p>
          )}
        </div>
        <ChevronRight className="h-5 w-5 shrink-0 text-gray-400" />
      </button>
      {error && <p className="mt-1 px-1 text-xs font-semibold text-red-500">{error}</p>}

      {/* Hidden inputs for the form */}
      <input type="hidden" name="province" value={value.province} />
      <input type="hidden" name="district" value={value.district} />
      <input type="hidden" name="subDistrict" value={value.subDistrict} />
      <input type="hidden" name="postalCode" value={value.postalCode} />

      {/* Full-screen picker */}
      {open && (
        <div className="fixed inset-0 z-100 flex flex-col bg-white animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3.5">
            <button type="button" onClick={() => setOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-100">
              <ArrowLeft className="h-5 w-5 text-gray-700" />
            </button>
            <p className="flex-1 text-sm font-black text-gray-900">{lang === "th" ? "เลือกที่อยู่" : "Choose address"}</p>
            {filled && (
              <button type="button" onClick={clearAll} className="text-sm font-bold text-[#85241F] hover:underline">
                {lang === "th" ? "ล้าง" : "Clear"}
              </button>
            )}
          </div>

          {/* Breadcrumb */}
          <div className="px-4 pt-3">
            <div className="flex flex-col gap-1.5">
              {crumbs.map((c) => (
                <button
                  key={c.step}
                  type="button"
                  onClick={() => { setQuery(""); setStep(c.step); }}
                  className="flex items-center gap-3 px-1 py-1 text-left"
                >
                  <span className="h-3 w-3 shrink-0 rounded-full bg-gray-300" />
                  <span className="text-base font-bold text-gray-700">{c.label}</span>
                </button>
              ))}
              <div className="flex w-full items-center gap-3 rounded-2xl border-2 border-[#85241F]/20 bg-[#85241F]/5 px-4 py-3.5">
                <span className="h-4 w-4 shrink-0 rounded-full bg-[#85241F] ring-4 ring-[#85241F]/15" />
                <span className="text-base font-black text-[#85241F]">
                  {lang === "th" ? "เลือก " : "Select "}{STEP_LABEL[step][lang]}
                </span>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="px-4 py-2">
            <div className="flex items-center gap-2 rounded-xl bg-gray-100 px-3 py-2.5">
              <Search className="h-4 w-4 shrink-0 text-gray-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`${lang === "th" ? "ค้นหา" : "Search"} ${STEP_LABEL[step][lang]}`}
                className="flex-1 bg-transparent text-sm font-semibold text-gray-700 outline-none placeholder:text-gray-400"
                inputMode={step === "zip" ? "numeric" : "text"}
              />
              {query && (
                <button type="button" onClick={() => setQuery("")} className="shrink-0">
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              )}
            </div>
          </div>

          {/* Section header */}
          <p className="bg-gray-50 px-4 py-2.5 text-xs font-black text-gray-400">{STEP_LABEL[step][lang]}</p>

          {/* Options */}
          <div className="flex-1 divide-y divide-gray-100 overflow-y-auto">
            {options.length === 0 ? (
              <p className="py-10 text-center text-sm font-bold text-gray-400">
                {lang === "th" ? "ไม่พบรายการ" : "No results"}
              </p>
            ) : (
              options.map((item) => {
                const selected =
                  step === "province" ? value.province
                  : step === "district" ? value.district
                  : step === "subDistrict" ? value.subDistrict
                  : value.postalCode;
                const isSelected = item === selected;
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => pick(item)}
                    className={`flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left text-base hover:bg-gray-50 active:bg-gray-100 ${isSelected ? "font-black text-[#85241F]" : "font-semibold text-gray-800"}`}
                  >
                    <span>{labelOf(step, item)}</span>
                    {isSelected && <Check className="h-5 w-5 shrink-0 text-[#85241F]" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </>
  );
}
