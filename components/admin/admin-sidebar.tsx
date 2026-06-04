"use client";

import Link from "next/link";
import { ClipboardList, LayoutDashboard, Mail, Package, User } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { LanguageChip } from "@/components/shared/language-chip";

type Props = {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  pendingCount: number;
  orderCount: number;
  productCount: number;
  isSuperAdmin?: boolean;
};

export function AdminSidebar({
  activeTab,
  setActiveTab,
  pendingCount,
  orderCount,
  productCount,
  isSuperAdmin = false,
}: Props) {
  const { t } = useLanguage();

  const navItems = [
    {
      key: "dashboard",
      icon: LayoutDashboard,
      label: t("admin.tab.dashboard"),
      count: null,
      badge: null,
    },
    {
      key: "orders",
      icon: ClipboardList,
      label: t("admin.tab.orders"),
      count: orderCount,
      badge: pendingCount > 0 ? pendingCount : null,
    },
    {
      key: "products",
      icon: Package,
      label: t("admin.tab.products"),
      count: productCount,
      badge: null,
    },
    {
      key: "email",
      icon: Mail,
      label: "Email",
      count: null,
      badge: null,
    },
    ...(isSuperAdmin
      ? [
          {
            key: "superAdmin",
            icon: User,
            label: "SuperAdmin",
            count: null,
            badge: null,
          },
        ]
      : []),
  ];

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 h-full w-56 xl:w-64 bg-white border-r border-gray-100 flex-col z-40 shadow-sm">

      {/* Brand */}
      <Link href="/admin" className="flex justify-center px-6 py-6 border-b border-gray-100 hover:opacity-80 transition-opacity">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/HLLCLOGO.png" alt="HLLC" className="h-14 w-auto object-contain" />
      </Link>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {navItems.map(({ key, icon: Icon, label, count, badge }) => {
          const active = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all cursor-pointer text-left ${
                active
                  ? "bg-gray-900 text-white shadow-sm"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <div className="relative shrink-0">
                <Icon className="w-5 h-5" />
                {badge && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-4 h-4 bg-orange-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </div>
              <span className="font-semibold text-sm flex-1">{label}</span>
              {count !== null && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  active ? "bg-white/20 text-white" : "bg-gray-100 text-gray-400"
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Language + Footer */}
      <div className="px-4 py-4 border-t border-gray-100 flex flex-col gap-3">
        <LanguageChip />

        <div className="flex items-center gap-2.5 px-1">
          <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
            <LayoutDashboard className="w-3.5 h-3.5 text-gray-500" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-gray-700">Admin</p>
            <p className="text-[10px] text-gray-400 truncate">หลังบ้าน HLLC</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
