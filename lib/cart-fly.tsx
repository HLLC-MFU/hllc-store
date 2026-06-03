"use client";

import React, { createContext, useContext, useCallback, useRef, useState } from "react";
import { createPortal } from "react-dom";

type FlyDot = { id: number; startX: number; startY: number; endX: number; endY: number; imageUrl?: string };

type CartFlyContextType = {
  flyToCart: (sourceEl: HTMLElement, imageUrl?: string) => void;
  cartRef: React.RefObject<HTMLElement | null>;
};

const CartFlyContext = createContext<CartFlyContextType | null>(null);

export function CartFlyProvider({ children }: { children: React.ReactNode }) {
  const [dots, setDots] = useState<FlyDot[]>([]);
  const cartRef = useRef<HTMLElement | null>(null);
  const counter = useRef(0);

  const flyToCart = useCallback((sourceEl: HTMLElement, imageUrl?: string) => {
    if (!cartRef.current) return;
    const from = sourceEl.getBoundingClientRect();
    const to = cartRef.current.getBoundingClientRect();
    const id = ++counter.current;
    setDots((prev) => [...prev, {
      id,
      startX: from.left + from.width / 2,
      startY: from.top + from.height / 2,
      endX: to.left + to.width / 2,
      endY: to.top + to.height / 2,
      imageUrl,
    }]);
    setTimeout(() => setDots((prev) => prev.filter((d) => d.id !== id)), 700);
  }, []);

  return (
    <CartFlyContext.Provider value={{ flyToCart, cartRef }}>
      {children}
      {typeof window !== "undefined" && createPortal(
        <>{dots.map((dot) => <FlyingDot key={dot.id} dot={dot} />)}</>,
        document.body
      )}
    </CartFlyContext.Provider>
  );
}

function FlyingDot({ dot }: { dot: FlyDot }) {
  const dx = dot.endX - dot.startX;
  const dy = dot.endY - dot.startY;
  const size = 52;
  return (
    <div
      className="pointer-events-none fixed z-[9999]"
      style={{
        left: dot.startX - size / 2,
        top: dot.startY - size / 2,
        width: size,
        height: size,
        animation: "cart-fly 0.65s cubic-bezier(0.25,0.46,0.45,0.94) forwards",
        ["--dx" as string]: `${dx}px`,
        ["--dy" as string]: `${dy}px`,
      }}
    >
      {dot.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={dot.imageUrl} alt="" className="w-full h-full rounded-2xl object-cover shadow-xl ring-2 ring-white" />
      ) : (
        <div className="w-full h-full rounded-2xl bg-[#85241F] shadow-xl ring-2 ring-white flex items-center justify-center text-lg">🛍️</div>
      )}
    </div>
  );
}

export function useCartFly() {
  const ctx = useContext(CartFlyContext);
  if (!ctx) throw new Error("useCartFly must be within CartFlyProvider");
  return ctx;
}
