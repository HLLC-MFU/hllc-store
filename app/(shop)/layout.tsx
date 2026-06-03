import { AppHeader } from "@/components/shared/app-header";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="lg:hidden">
        <AppHeader />
      </div>
      <div className="lg:pt-0 pt-14">
        {children}
      </div>
    </div>
  );
}
