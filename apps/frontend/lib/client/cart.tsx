"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

export type LocalizedText = {
  th: string;
  en?: string;
};

export type CartItem = {
  productId: string;
  name: LocalizedText;
  description?: LocalizedText;
  price: number;
  stock?: number;
  imageUrl?: string;
  selectedOption?: string;
  customName?: string;
  allowCustomName?: boolean;
  quantity: number;
};

export type ProductSync = {
  id: string;
  name: LocalizedText;
  description?: LocalizedText;
  price: number;
  stock: number;
  imageUrl?: string;
  options?: { label: string; imageUrl?: string; stock?: number }[];
};

type CartContextType = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (productId: string, selectedOption?: string, customName?: string) => void;
  updateQty: (productId: string, qty: number, selectedOption?: string, customName?: string) => void;
  syncFromProducts: (products: ProductSync[]) => void;
  clearCart: () => void;
  total: number;
  count: number;
};

const CartContext = createContext<CartContextType | null>(null);

function sameCartLine(
  item: Pick<CartItem, "productId" | "selectedOption" | "customName">,
  productId: string,
  selectedOption?: string,
  customName?: string,
) {
  return (
    item.productId === productId &&
    (item.selectedOption ?? "") === (selectedOption ?? "") &&
    (item.customName ?? "") === (customName ?? "")
  );
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      try {
        const stored = localStorage.getItem("shop-cart");
        if (stored) setItems(JSON.parse(stored) as CartItem[]);
      } catch {}
      setReady(true);
    });
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem("shop-cart", JSON.stringify(items));
  }, [items, ready]);

  function addItem(item: Omit<CartItem, "quantity">) {
    setItems((prev) => {
      const found = prev.find((i) =>
        sameCartLine(i, item.productId, item.selectedOption, item.customName),
      );
      const maxQty = item.stock ?? Number.MAX_SAFE_INTEGER;
      if (found)
        return prev.map((i) =>
          sameCartLine(i, item.productId, item.selectedOption, item.customName)
            ? { ...i, ...item, quantity: Math.min(i.quantity + 1, maxQty) }
            : i
        );
      return [...prev, { ...item, quantity: 1 }];
    });
  }

  function removeItem(productId: string, selectedOption?: string, customName?: string) {
    setItems((prev) => prev.filter((i) => !sameCartLine(i, productId, selectedOption, customName)));
  }

  function updateQty(productId: string, qty: number, selectedOption?: string, customName?: string) {
    if (qty <= 0) {
      removeItem(productId, selectedOption, customName);
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        sameCartLine(i, productId, selectedOption, customName)
          ? { ...i, quantity: Math.min(qty, i.stock ?? qty) }
          : i,
      )
    );
  }

  // Refresh stored cart lines against the latest product data (price, shipping,
  // stock, name, image) so edits in the admin reflect without re-adding.
  const syncFromProducts = useCallback((products: ProductSync[]) => {
    setItems((prev) =>
      prev.map((item) => {
        const product = products.find((p) => p.id === item.productId);
        if (!product) return item;
        const option = item.selectedOption
          ? product.options?.find((o) => o.label === item.selectedOption)
          : undefined;
        const stock = option ? (option.stock ?? product.stock) : product.stock;
        return {
          ...item,
          name: product.name,
          description: product.description,
          price: product.price,
          stock,
          imageUrl: option?.imageUrl ?? product.imageUrl ?? item.imageUrl,
          quantity: stock > 0 ? Math.min(item.quantity, stock) : item.quantity,
        };
      }),
    );
  }, []);

  function clearCart() {
    setItems([]);
  }

  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const count = items.length;

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQty, syncFromProducts, clearCart, total, count }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be within CartProvider");
  return ctx;
}
