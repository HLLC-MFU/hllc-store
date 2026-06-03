"use client";

import React from "react";
import { LanguageProvider } from "@/lib/language-context";
import { CartProvider } from "@/lib/cart";
import { CartFlyProvider } from "@/lib/cart-fly";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <CartProvider>
        <CartFlyProvider>{children}</CartFlyProvider>
      </CartProvider>
    </LanguageProvider>
  );
}
