import { apiValidated } from "@/components/admin/api-client";
import {
  paymentSettingsResponseSchema,
  shippingSettingsResponseSchema,
  homeContentResponseSchema,
  type PaymentSettings,
  type ShippingSettings,
  type HomeContent,
} from "./types";

/** Storefront (anonymous): read the active payment account. */
export async function fetchPaymentSettings(): Promise<PaymentSettings> {
  const response = await fetch("/api/backend/payment-settings", { cache: "no-store" });
  const payload = (await response.json()) as { data?: unknown; error?: string };
  if (!response.ok) throw new Error(payload.error ?? "Unable to load payment settings");
  return paymentSettingsResponseSchema.parse(payload.data ?? {});
}

export function fetchAdminPaymentSettings() {
  return apiValidated(paymentSettingsResponseSchema, "/api/backend/admin/payment-settings");
}

export function updatePaymentSettings(input: PaymentSettings) {
  return apiValidated(paymentSettingsResponseSchema, "/api/backend/admin/payment-settings", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

/** Storefront (anonymous): read current shipping rates. */
export async function fetchShippingSettings(): Promise<ShippingSettings> {
  const response = await fetch("/api/backend/shipping-settings", { cache: "no-store" });
  const payload = (await response.json()) as { data?: unknown; error?: string };
  if (!response.ok) throw new Error(payload.error ?? "Unable to load shipping settings");
  return shippingSettingsResponseSchema.parse(payload.data ?? {});
}

export function fetchAdminShippingSettings() {
  return apiValidated(shippingSettingsResponseSchema, "/api/backend/admin/shipping-settings");
}

export function updateShippingSettings(input: ShippingSettings) {
  return apiValidated(shippingSettingsResponseSchema, "/api/backend/admin/shipping-settings", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

/** Storefront (anonymous): read editable home banner content. */
export async function fetchHomeContent(): Promise<HomeContent> {
  const response = await fetch("/api/backend/home-content", { cache: "no-store" });
  const payload = (await response.json()) as { data?: unknown; error?: string };
  if (!response.ok) throw new Error(payload.error ?? "Unable to load home content");
  return homeContentResponseSchema.parse(payload.data ?? {});
}

export function fetchAdminHomeContent() {
  return apiValidated(homeContentResponseSchema, "/api/backend/admin/home-content");
}

export function updateHomeContent(input: { blocks: Record<string, unknown> }) {
  return apiValidated(homeContentResponseSchema, "/api/backend/admin/home-content", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}
