import { CartFab } from "@/components/shop/cart-fab";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
      <CartFab />
    </div>
  );
}
