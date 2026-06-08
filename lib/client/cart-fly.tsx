"use client";

import React, { createContext, useContext, useCallback, useRef } from "react";

type CartFlyContextType = {
  flyToCart: (sourceEl: HTMLElement, imageUrl?: string) => void;
  cartRef: React.RefObject<HTMLElement | null>;
};

const CartFlyContext = createContext<CartFlyContextType | null>(null);

export function CartFlyProvider({ children }: { children: React.ReactNode }) {
  const cartRef = useRef<HTMLElement | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const flyToCart = useCallback((_sourceEl: HTMLElement, _imageUrl?: string) => {}, []);

  return (
    <CartFlyContext.Provider value={{ flyToCart, cartRef }}>
      {children}
    </CartFlyContext.Provider>
  );
}

export function useCartFly() {
  const ctx = useContext(CartFlyContext);
  if (!ctx) throw new Error("useCartFly must be within CartFlyProvider");
  return ctx;
}
