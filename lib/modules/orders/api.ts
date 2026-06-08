import { z } from "zod";
import { apiValidated } from "@/components/admin/api-client";
import { validateResponse } from "@/lib/validation/response-schemas";
import {
  orderResponseSchema,
  publicOrderResponseSchema,
  type CreateOrderInput,
  type Order,
  type PublicOrder,
  type UpdateAdminOrderInput,
} from "./types";

async function readJson(response: Response): Promise<{ data?: unknown; error?: string }> {
  return (await response.json()) as { data?: unknown; error?: string };
}

/* ---- Storefront (anonymous, raw fetch + validation) ---- */

export async function fetchOrdersByPhone(phone: string): Promise<PublicOrder[]> {
  const response = await fetch(`/api/backend/orders?customerPhone=${encodeURIComponent(phone)}`, { cache: "no-store" });
  const payload = await readJson(response);
  if (!response.ok) throw new Error(payload.error ?? "Unable to load orders");
  return validateResponse(z.array(publicOrderResponseSchema), payload.data ?? []);
}

export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const response = await fetch("/api/backend/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const payload = await readJson(response);
  if (!response.ok) throw new Error(payload.error ?? "Unable to create order");
  return validateResponse(orderResponseSchema, payload.data);
}

export async function attachPaymentSlip(orderId: string, imageUrl: string): Promise<void> {
  const response = await fetch(`/api/backend/orders/${orderId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageUrl }),
  });
  await response.json().catch(() => null);
  if (!response.ok) throw new Error("Unable to attach payment slip");
}

export async function cancelPublicOrder(orderId: string, reason: string): Promise<void> {
  await fetch(`/api/backend/orders/${orderId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cancel: true, reason }),
  }).catch(() => null);
}

/* ---- Admin (CSRF-aware, validated through apiValidated) ---- */

export function fetchAdminOrders() {
  return apiValidated(z.array(orderResponseSchema), "/api/backend/admin/orders");
}

export function reviewPaymentSlip(orderId: string, approved: boolean, reviewedBy: string, note?: string) {
  return apiValidated(orderResponseSchema, `/api/backend/admin/slips/${orderId}`, {
    method: "POST",
    body: JSON.stringify({ approved, reviewedBy, note }),
  });
}

export function updateAdminOrder(orderId: string, input: UpdateAdminOrderInput) {
  return apiValidated(orderResponseSchema, `/api/backend/admin/orders/${orderId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}
