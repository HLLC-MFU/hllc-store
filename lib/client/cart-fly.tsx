"use client";

import React, { createContext, useContext, useCallback, useRef, useState } from "react";
import Image from "next/image";
import { createPortal } from "react-dom";

type FlyDot = {
  id: number;
  startX: number;
  startY: number;
  dx: number;
  dy: number;
  imageUrl?: string;
};

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
    const to   = cartRef.current.getBoundingClientRect();
    const id   = ++counter.current;

    setDots((prev) => [...prev, {
      id,
      startX: from.left + from.width  / 2,
      startY: from.top  + from.height / 2,
      dx: (to.left + to.width  / 2) - (from.left + from.width  / 2),
      dy: (to.top  + to.height / 2) - (from.top  + from.height / 2),
      imageUrl,
    }]);

    setTimeout(() => setDots((p) => p.filter((d) => d.id !== id)), 820);
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

const SIZE = 56;

function FlyingDot({ dot }: { dot: FlyDot }) {
  // arc: lift slightly up, then sweep to target
  const liftX = dot.dx * 0.08;
  const liftY = -36;
  const midX  = dot.dx * 0.55;
  const midY  = dot.dy * 0.35 - 55;

  return (
    <div
      className="shop-cart-particle pointer-events-none fixed z-9999 rounded-2xl overflow-hidden"
      style={{
        left: dot.startX - SIZE / 2,
        top:  dot.startY - SIZE / 2,
        width:  SIZE,
        height: SIZE,
        ["--cart-fly-lift-x" as string]: `${liftX}px`,
        ["--cart-fly-lift-y" as string]: `${liftY}px`,
        ["--cart-fly-mid-x"  as string]: `${midX}px`,
        ["--cart-fly-mid-y"  as string]: `${midY}px`,
        ["--cart-fly-end-x"  as string]: `${dot.dx}px`,
        ["--cart-fly-end-y"  as string]: `${dot.dy}px`,
      }}
    >
      {dot.imageUrl ? (
        <Image
          src={dot.imageUrl}
          alt=""
          width={SIZE}
          height={SIZE}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-[#85241F] flex items-center justify-center text-xl">🛍️</div>
      )}
    </div>
  );
}

export function useCartFly() {
  const ctx = useContext(CartFlyContext);
  if (!ctx) throw new Error("useCartFly must be within CartFlyProvider");
  return ctx;
}
