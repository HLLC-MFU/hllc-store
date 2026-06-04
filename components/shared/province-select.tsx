"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search } from "lucide-react";
import { THAI_PROVINCES } from "@/lib/thai-provinces";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (value: string) => void;
  lang?: "th" | "en";
  error?: string;
};

export function ProvinceSelect({ value, onChange, lang = "th", error }: Props) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [pos, setPos] = React.useState<React.CSSProperties>({});

  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const searchRef = React.useRef<HTMLInputElement>(null);

  const filtered = React.useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return THAI_PROVINCES;
    return THAI_PROVINCES.filter(
      (p) => p.th.includes(q) || p.en.toLowerCase().includes(q)
    );
  }, [search]);

  const selected = THAI_PROVINCES.find((p) => p.th === value);
  const label = selected ? (lang === "th" ? selected.th : selected.en) : "";

  function openDropdown() {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPos({
      position: "fixed",
      top: rect.bottom + 4,
      left: rect.left,
      width: Math.max(rect.width, 220),
      zIndex: 9999,
    });
    setOpen(true);
  }

  function close() {
    setOpen(false);
    setSearch("");
  }

  // Focus search when opened
  React.useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 30);
  }, [open]);

  // Close on outside mousedown (check both trigger and dropdown)
  React.useEffect(() => {
    if (!open) return;
    function onMouseDown(e: MouseEvent) {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (dropdownRef.current?.contains(target)) return;
      close();
    }
    function onScroll() { close(); }
    document.addEventListener("mousedown", onMouseDown);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => (open ? close() : openDropdown())}
        className={cn(
          "flex h-12 w-full items-center justify-between gap-2 rounded-2xl border px-3.5 text-sm bg-white transition-colors",
          error
            ? "border-red-300"
            : open
            ? "border-[#85241F] ring-1 ring-[#85241F]/20"
            : "border-gray-300 hover:border-gray-400"
        )}
      >
        <span className={cn("truncate font-semibold", value ? "text-gray-900" : "text-gray-400")}>
          {label || (lang === "th" ? "เลือกจังหวัด" : "Select province")}
        </span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-gray-400 transition-transform duration-150", open && "rotate-180")} />
      </button>

      {error && <p className="mt-1.5 text-xs font-semibold text-red-500">{error}</p>}

      {open && typeof window !== "undefined" && createPortal(
        <div
          ref={dropdownRef}
          className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl animate-in fade-in slide-in-from-top-1 duration-150 flex flex-col"
          style={{ ...pos, maxHeight: 260 }}
        >
          {/* Search */}
          <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2.5 shrink-0">
            <Search className="h-3.5 w-3.5 shrink-0 text-gray-400" />
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={lang === "th" ? "ค้นหาจังหวัด..." : "Search province..."}
              className="flex-1 bg-transparent text-sm font-semibold text-gray-700 outline-none placeholder:text-gray-400"
            />
          </div>

          {/* List */}
          <ul className="overflow-y-auto flex-1">
            {filtered.length === 0 ? (
              <li className="px-4 py-4 text-center text-xs font-semibold text-gray-400">
                {lang === "th" ? "ไม่พบจังหวัด" : "No results"}
              </li>
            ) : filtered.map((p) => {
              const isSelected = p.th === value;
              return (
                <li key={p.th}>
                  <button
                    type="button"
                    onClick={() => { onChange(p.th); close(); }}
                    className={cn(
                      "flex w-full items-center justify-between px-4 py-2.5 text-sm transition-colors hover:bg-gray-50",
                      isSelected ? "font-black text-[#85241F] bg-[#85241F]/5" : "font-semibold text-gray-700"
                    )}
                  >
                    <span>{lang === "th" ? p.th : p.en}</span>
                    {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-[#85241F]" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>,
        document.body
      )}
    </>
  );
}
