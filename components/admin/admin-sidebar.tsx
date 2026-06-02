"use client";

import { ClipboardList, LayoutDashboard, Package, User } from "lucide-react";
import { LanguageChip } from "@/components/shared/language-chip";
import { useLanguage } from "@/lib/language-context";

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
      label: "หน้าหลัก",
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
    <aside className="fixed left-0 top-0 z-40 hidden h-full w-56 flex-col border-r border-gray-100 bg-white shadow-sm lg:flex xl:w-64">
      <div className="flex justify-center border-b border-gray-100 px-6 py-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/HLLCLOGO.png" alt="HLLC" className="h-14 w-auto object-contain" />
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
        {navItems.map(({ key, icon: Icon, label, count, badge }) => {
          const active = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-left transition-all ${
                active
                  ? "bg-gray-900 text-white shadow-sm"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <div className="relative shrink-0">
                <Icon className="h-5 w-5" />
                {badge ? (
                  <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-0.5 text-[9px] font-bold leading-none text-white">
                    {badge > 9 ? "9+" : badge}
                  </span>
                ) : null}
              </div>
              <span className="flex-1 text-sm font-semibold">{label}</span>
              {count !== null ? (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    active ? "bg-white/20 text-white" : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {count}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      <div className="flex flex-col gap-3 border-t border-gray-100 px-4 py-4">
        <LanguageChip />

        <div className="flex items-center gap-2.5 px-1">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100">
            <LayoutDashboard className="h-3.5 w-3.5 text-gray-500" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-gray-700">Admin</p>
            <p className="truncate text-[10px] text-gray-400">หลังบ้าน HLLC</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
