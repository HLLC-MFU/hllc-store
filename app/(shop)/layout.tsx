import { AppHeader } from "@/components/shared/app-header";
import { SideNav } from "@/components/shop/side-nav";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <SideNav />
      <div className="md:hidden">
        <AppHeader />
      </div>
      <div className="pt-14 md:pt-0 md:pl-56 lg:pl-64">
        {children}
      </div>
    </div>
  );
}
