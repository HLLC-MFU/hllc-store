"use client";

import React from "react";
import { LanguageProvider } from "@/lib/language-context";
import { CartProvider } from "@/lib/cart";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <CartProvider>{children}</CartProvider>
    </LanguageProvider>
  );
}
