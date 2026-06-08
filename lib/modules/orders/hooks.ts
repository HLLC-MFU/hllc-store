import { useState } from "react";
import { fetchOrdersByPhone } from "./api";
import type { PublicOrder } from "./types";

/** Loads a customer's orders by phone number, tracking loading/error state. */
export function useOrdersByPhone() {
  const [orders, setOrders] = useState<PublicOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load(phone: string) {
    setLoading(true);
    setError("");
    try {
      const result = await fetchOrdersByPhone(phone);
      setOrders(result);
      return result;
    } catch (err) {
      setOrders([]);
      setError(err instanceof Error ? err.message : "Unable to load orders");
      return [];
    } finally {
      setLoading(false);
    }
  }

  return { orders, loading, error, load };
}
