"use client";

import React from "react";
import { LanguageProvider } from "@/lib/client/language-context";
import { CartProvider } from "@/lib/client/cart";
import { CartFlyProvider } from "@/lib/client/cart-fly";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <CartProvider>
        <CartFlyProvider>{children}</CartFlyProvider>
      </CartProvider>
    </LanguageProvider>
  );
}
