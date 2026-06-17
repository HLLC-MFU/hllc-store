"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type LucideIcon, ChevronLeft, ClipboardList, Home, LayoutDashboard, Mail, Menu, Package, ShoppingCart, User, X } from "lucide-react";
import { useCart } from "@/lib/client/cart";
import { useCartFly } from "@/lib/client/cart-fly";
import { useLanguage } from "@/lib/client/language-context";

export type NavItem = {
  href?: string;
  label: string;
  icon: LucideIcon;
  onClick?: () => void;
  badge?: number;
};

export const SHOP_NAV: NavItem[] = [
  { href: "/home",    label: "nav.home",        icon: Home },
  { href: "/cart",    label: "nav.cart",         icon: ShoppingCart },
  { href: "/profile", label: "nav.track_order", icon: Package },
];

export { ClipboardList, LayoutDashboard, Mail, Package, User };

// ── Flags ──────────────────────────────────────────────────────────────────
const ThaiFlag = () => (
  <svg viewBox="0 0 9 6" className="w-5.5 h-4 rounded-[3px] shadow-xs">
    <rect width="9" height="6" fill="#A51931" />
    <rect y="1" width="9" height="4" fill="#F4F5F8" />
    <rect y="2" width="9" height="2" fill="#2D2A4A" />
  </svg>
);
const UkFlag = () => (
  <svg viewBox="0 0 50 30" className="w-5.5 h-4 rounded-[3px] shadow-xs">
    <rect width="50" height="30" fill="#012169" />
    <path d="M0 0 L50 30 M50 0 L0 30" stroke="#fff" strokeWidth="6" />
    <path d="M0 0 L50 30 M50 0 L0 30" stroke="#C8102E" strokeWidth="2.5" />
    <path d="M25 0 V30 M0 15 H50" stroke="#fff" strokeWidth="10" />
    <path d="M25 0 V30 M0 15 H50" stroke="#C8102E" strokeWidth="6" />
  </svg>
);

function LangToggle() {
  const { lang, setLang } = useLanguage();
  return (
    <button
      type="button"
      onClick={() => setLang(lang === "th" ? "en" : "th")}
      className="flex items-center justify-center h-9 w-9 rounded-full bg-gray-100 hover:bg-gray-200 active:scale-95 transition-all cursor-pointer select-none"
    >
      {lang === "th" ? <ThaiFlag /> : <UkFlag />}
    </button>
  );
}

function CartButton({ count }: { count: number }) {
  const { cartRef } = useCartFly();
  const [bumping, setBumping] = React.useState(false);
  const prevCount = React.useRef(count);

  React.useEffect(() => {
    if (count > prevCount.current) {
      setBumping(true);
      setTimeout(() => setBumping(false), 400);
    }
    prevCount.current = count;
  }, [count]);

  return (
    <Link
      ref={(el) => { cartRef.current = el; }}
      href="/cart"
      className={`relative flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 active:scale-95 transition-all ${bumping ? "cart-bump" : ""}`}
    >
      <ShoppingCart className="w-4.5 h-4.5 text-gray-700" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 min-w-4.5 h-4.5 bg-[#85241F] text-white text-[9px] font-black rounded-full flex items-center justify-center px-0.5 leading-none">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
type AppHeaderProps = {
  navItems?: NavItem[];
  showCart?: boolean;
  showBack?: boolean;
  showLang?: boolean;
  logoHref?: string;
  onLogoClick?: () => void;
};

export function AppHeader({ navItems = SHOP_NAV, showCart = true, showBack = true, showLang = true, logoHref = "/home", onLogoClick }: AppHeaderProps) {
  const [open, setOpen] = React.useState(false);
  const { count } = useCart();
  const { t } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();

  const isSubPage = showBack && pathname !== "/home" && pathname !== "/cart" && pathname !== "/profile";

  return (
    <>
      {/* Fixed bar */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-100 h-14 flex items-center px-5">
        {/* Left — back or hamburger */}
        <div className="flex-1 flex items-center">
          {isSubPage ? (
            <button
              type="button"
              onClick={() => router.back()}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 active:scale-95 transition-all cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 active:scale-95 transition-all cursor-pointer"
            >
              {open ? <X className="w-4.5 h-4.5 text-gray-700" /> : <Menu className="w-4.5 h-4.5 text-gray-700" />}
            </button>
          )}
        </div>

        {/* Center — logo */}
        <Link href={logoHref} onClick={onLogoClick} className="absolute left-1/2 -translate-x-1/2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/HLLCLOGO.png" alt="HLLC" className="h-8 w-auto object-contain" />
        </Link>

        {/* Right — lang + cart */}
        <div className="flex-1 flex items-center justify-end gap-2">
          {showLang && <LangToggle />}
          {showCart && <CartButton count={count} />}
        </div>
      </header>

      {/* Backdrop */}
      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}

      {/* Dropdown */}
      {open && (
        <div className="fixed top-14 left-4 z-50 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 min-w-44">
          {navItems.map(({ href, label, icon: Icon, onClick, badge }) => {
            const isCart = href === "/cart";
            const shownBadge = badge ?? (isCart && count > 0 ? count : null);
            const cls = "flex items-center gap-3 px-4 py-3.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 w-full text-left cursor-pointer";
            const handleClick = () => { onClick?.(); setOpen(false); };
            const inner = (
              <>
                <Icon className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="flex-1">{t(label)}</span>
                {shownBadge != null && shownBadge > 0 && (
                  <span className="text-xs font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">{shownBadge}</span>
                )}
              </>
            );
            return href ? (
              <Link key={label} href={href} onClick={handleClick} className={cls}>{inner}</Link>
            ) : (
              <button key={label} type="button" onClick={handleClick} className={cls}>{inner}</button>
            );
          })}
        </div>
      )}
    </>
  );
}
