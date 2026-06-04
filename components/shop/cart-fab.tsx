"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/lib/client/cart";
import { usePathname } from "next/navigation";

export function CartFab() {
  const { count } = useCart();
  const pathname = usePathname();

  if (pathname === "/cart" || pathname.startsWith("/products/")) return null;

  return (
    <Link
      id="cart-fab"
      href="/cart"
      aria-label="ตะกร้าสินค้า"
      className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-[#85241F] hover:bg-[#B72D2A] text-white rounded-full shadow-xl shadow-[#85241F]/30 flex items-center justify-center transition-all active:scale-95 cursor-pointer"
    >
      <ShoppingCart className="w-6 h-6" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 min-w-5 h-5 bg-white text-[#85241F] text-[10px] font-black rounded-full flex items-center justify-center px-1 shadow-sm border border-[#85241F]/10">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
