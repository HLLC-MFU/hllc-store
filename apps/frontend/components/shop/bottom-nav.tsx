"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ShoppingCart, User } from "lucide-react";
import { useCart } from "@/lib/client/cart";
import { useLanguage } from "@/lib/client/language-context";
import { LanguageChip } from "@/components/shared/language-chip";

const tabs = [
  { href: "/home", icon: Home, labelKey: "nav.home" },
  { href: "/cart", icon: ShoppingCart, labelKey: "nav.cart" },
  { href: "/track-order", icon: User, labelKey: "nav.profile" },
];

export function BottomNav() {
  const pathname = usePathname();
  const { count } = useCart();
  const { t } = useLanguage();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] z-50">
      <div className="flex items-center justify-around px-6 py-3">
        {tabs.map(({ href, icon: Icon, labelKey }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-1 min-w-[48px]"
            >
              <div className="relative" id={href === "/cart" ? "nav-cart-icon" : undefined}>
                <Icon className={`w-6 h-6 transition-colors ${active ? "text-blue-600" : "text-gray-400"}`} />
                {href === "/cart" && count > 0 ? (
                  <span className="absolute -top-2 -right-2 min-w-4 h-4 rounded-full bg-brand px-1 text-[9px] leading-4 text-white font-black text-center">
                    {count > 9 ? "9+" : count}
                  </span>
                ) : null}
              </div>
              <span className={`text-[10px] font-medium transition-colors ${active ? "text-blue-600" : "text-gray-400"}`}>
                {t(labelKey)}
              </span>
            </Link>
          );
        })}
        <LanguageChip />
      </div>
    </nav>
  );
}
