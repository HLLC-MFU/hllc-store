"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, User } from "lucide-react";
import { useLanguage } from "@/lib/language-context";

const tabs = [
  { href: "/home", icon: Home, labelKey: "nav.home" },
  { href: "/profile", icon: User, labelKey: "nav.profile" },
];

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useLanguage();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] z-50">
      <div className="flex items-center justify-around px-8 py-3">
        {tabs.map(({ href, icon: Icon, labelKey }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-1 min-w-[48px]"
            >
              <Icon className={`w-6 h-6 transition-colors ${active ? "text-blue-600" : "text-gray-400"}`} />
              <span className={`text-[10px] font-medium transition-colors ${active ? "text-blue-600" : "text-gray-400"}`}>
                {t(labelKey)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
