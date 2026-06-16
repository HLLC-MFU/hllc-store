"use client";

import Link from "next/link";
import { ClipboardList, Images, LayoutDashboard, LogOut, Package, User } from "lucide-react";
import { useLanguage } from "@/lib/client/language-context";

type Props = {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  pendingCount: number;
  orderCount: number;
  productCount: number;
  isSuperAdmin?: boolean;
  onLogout?: () => void;
};

export function AdminSidebar({ onLogout,
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
      key: "storefront",
      icon: Images,
      label: t("admin.tab.storefront"),
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
    <aside className="hidden md:flex fixed left-0 top-0 h-full w-56 lg:w-64 bg-white border-r border-gray-100 flex-col z-40 shadow-sm">

      {/* Brand */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-gray-100">
        <Link href="/admin" className="hover:opacity-80 transition-opacity">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/HLLCLOGO.png" alt="HLLC" className="h-10 w-auto object-contain" />
        </Link>
      </div>

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

      {/* Footer */}
      {onLogout && (
        <div className="px-3 py-3 border-t border-gray-100">
          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-500 transition-all cursor-pointer"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span className="font-semibold text-sm">ออกจากระบบ</span>
          </button>
        </div>
      )}
    </aside>
  );
}
