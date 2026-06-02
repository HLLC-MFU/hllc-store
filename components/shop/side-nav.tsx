"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ShoppingCart, User } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useLanguage } from "@/lib/language-context";
import { LanguageChip } from "@/components/shared/language-chip";

const tabs = [
  { href: "/home", icon: Home, labelKey: "nav.home" },
  { href: "/cart", icon: ShoppingCart, labelKey: "nav.cart" },
  { href: "/profile", icon: User, labelKey: "nav.profile" },
];

export function SideNav() {
  const pathname = usePathname();
  const { count } = useCart();
  const { t } = useLanguage();

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-full w-56 lg:w-64 bg-white border-r border-gray-100 flex-col z-40 shadow-sm">
      {/* Brand */}
      <div className="px-6 py-6 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/HLLCLOGO.png" alt="HLLC" className="h-9 w-auto object-contain shrink-0" />
          <div>
            <p className="font-black text-gray-900 text-base leading-tight">HLLC</p>
            <p className="text-[10px] text-gray-400 font-medium">{t("nav.store")}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {tabs.map(({ href, icon: Icon, labelKey }) => {
          const active = pathname.startsWith(href);
          const showBadge = href === "/cart" && count > 0;

          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                active
                  ? "bg-red-500 text-white shadow-sm shadow-red-200"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {showBadge && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-4 h-4 bg-white text-red-500 text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none border border-red-100">
                    {count > 9 ? "9+" : count}
                  </span>
                )}
              </div>
              <span className="font-semibold text-sm">{t(labelKey)}</span>
              {showBadge && (
                <span className="ml-auto bg-red-100 text-red-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {count > 9 ? "9+" : count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Language Selector + Footer */}
      <div className="px-4 py-4 border-t border-gray-100 flex flex-col gap-3">
        <LanguageChip />

        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <User className="w-4 h-4 text-red-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-700 truncate">{t("nav.guest")}</p>
            <p className="text-[10px] text-gray-400 truncate">kittamat34@gmail.com</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
