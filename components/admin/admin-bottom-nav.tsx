"use client";

import { ClipboardList, LayoutDashboard, Package } from "lucide-react";
import { useLanguage } from "@/lib/language-context";

type Props = {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  pendingCount: number;
};

export function AdminBottomNav({ activeTab, setActiveTab, pendingCount }: Props) {
  const { t } = useLanguage();

  const tabs = [
    { key: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { key: "orders", icon: ClipboardList, label: t("admin.tab.orders"), badge: pendingCount },
    { key: "products", icon: Package, label: t("admin.tab.products") },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] z-50">
      <div className="flex items-center justify-around px-4 py-2">
        {tabs.map(({ key, icon: Icon, label, badge }) => {
          const active = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className="flex flex-col items-center gap-1 min-w-[64px] cursor-pointer py-1"
            >
              <div className="relative">
                <Icon className={`w-6 h-6 transition-colors ${active ? "text-[#85241F]" : "text-gray-400"}`} />
                {badge ? (
                  <span className="absolute -top-1.5 -right-1.5 min-w-4 h-4 rounded-full bg-rose-500 px-1 text-[9px] leading-4 text-white font-black text-center">
                    {badge > 9 ? "9+" : badge}
                  </span>
                ) : null}
              </div>
              <span className={`text-[10px] font-semibold transition-colors ${active ? "text-[#85241F]" : "text-gray-400"}`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
