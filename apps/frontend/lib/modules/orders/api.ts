import { z } from "zod";
import { apiValidated } from "@/components/admin/api-client";
import { appPath } from "@/lib/client/app-path";
import { normalizeUploads } from "@/lib/client/normalize-uploads";
import { validateResponse } from "@hllc/shared/validation/response-schemas";
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
  const response = await fetch(appPath(`/api/backend/orders?customerPhone=${encodeURIComponent(phone)}`), { cache: "no-store" });
  const payload = await readJson(response);
  if (!response.ok) throw new Error(payload.error ?? "Unable to load orders");
  return validateResponse(z.array(publicOrderResponseSchema), normalizeUploads(payload.data ?? []));
}

export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const response = await fetch(appPath("/api/backend/orders"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const payload = await readJson(response);
  if (!response.ok) throw new Error(payload.error ?? "Unable to create order");
  return validateResponse(orderResponseSchema, normalizeUploads(payload.data));
}

export async function attachPaymentSlip(orderId: string, imageUrl: string): Promise<void> {
  const response = await fetch(appPath(`/api/backend/orders/${orderId}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageUrl }),
  });
  await response.json().catch(() => null);
  if (!response.ok) throw new Error("Unable to attach payment slip");
}

export async function cancelPublicOrder(orderId: string, reason: string): Promise<void> {
  await fetch(appPath(`/api/backend/orders/${orderId}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cancel: true, reason }),
  }).catch(() => null);
}

/* ---- Admin (CSRF-aware, validated through apiValidated) ---- */

const ordersPageSchema = z.object({
  orders: z.array(orderResponseSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
});

export type OrdersPage = z.infer<typeof ordersPageSchema>;

const ordersSummarySchema = z.object({
  totalOrders: z.number(),
  byStatus: z.record(z.string(), z.number()),
  shippedDelivery: z.number(),
  shippedPickup: z.number(),
  pendingReview: z.number(),
  totalRevenue: z.number(),
});

export type OrdersSummary = z.infer<typeof ordersSummarySchema>;

export function fetchAdminOrders(params?: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  sort?: "asc" | "desc";
  deliveryMode?: "all" | "delivery" | "pickup";
}) {
  const qs = new URLSearchParams();
  if (params?.page && params.page > 1) qs.set("page", String(params.page));
  if (params?.limit) qs.set("limit", String(params.limit));
  if (params?.status && params.status !== "all") qs.set("status", params.status);
  if (params?.search) qs.set("search", params.search);
  if (params?.sort && params.sort !== "desc") qs.set("sort", params.sort);
  if (params?.deliveryMode && params.deliveryMode !== "all") qs.set("deliveryMode", params.deliveryMode);
  const query = qs.toString() ? `?${qs}` : "";
  return apiValidated(ordersPageSchema, `/api/backend/admin/orders${query}`);
}

export function fetchAdminOrdersSummary(deliveryMode?: "all" | "delivery" | "pickup") {
  const qs = new URLSearchParams();
  if (deliveryMode && deliveryMode !== "all") qs.set("deliveryMode", deliveryMode);
  const query = qs.toString() ? `?${qs}` : "";
  return apiValidated(ordersSummarySchema, `/api/backend/admin/orders/summary${query}`);
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
