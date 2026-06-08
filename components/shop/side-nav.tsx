"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Package, ShoppingCart } from "lucide-react";
import { useCart } from "@/lib/client/cart";
import { useLanguage } from "@/lib/client/language-context";
import { LanguageChip } from "@/components/shared/language-chip";

export function SideNav() {
  const pathname = usePathname();
  const { count } = useCart();
  const { t } = useLanguage();

  const tabs = [
    { href: "/home",    icon: Home,         label: t("nav.home") },
    { href: "/profile", icon: Package,      label: t("nav.track_order") },
    { href: "/cart",    icon: ShoppingCart, label: t("nav.cart"), badge: count > 0 ? count : null },
  ];

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-full w-56 lg:w-64 bg-white border-r border-gray-100 flex-col z-40 shadow-sm">

      {/* Brand */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-gray-100">
        <Link href="/home" className="hover:opacity-80 transition-opacity">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/HLLCLOGO.png" alt="HLLC" className="h-10 w-auto object-contain" />
        </Link>
        <LanguageChip />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {tabs.map(({ href, icon: Icon, label, badge }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                active
                  ? "bg-gray-900 text-white shadow-sm"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <div className="relative shrink-0">
                <Icon className="w-5 h-5" />
                {badge && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-4 h-4 bg-[#85241F] text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </div>
              <span className="font-semibold text-sm flex-1">{label}</span>
            </Link>
          );
        })}
      </nav>

    </aside>
  );
}
