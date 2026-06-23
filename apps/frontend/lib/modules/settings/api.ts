import { apiValidated } from "@/components/admin/api-client";
import { appPath } from "@/lib/client/app-path";
import { normalizeUploads } from "@/lib/client/normalize-uploads";
import {
  paymentSettingsResponseSchema,
  shippingSettingsResponseSchema,
  homeContentResponseSchema,
  charmSettingsResponseSchema,
  type PaymentSettings,
  type ShippingSettings,
  type HomeContent,
  type CharmSettings,
} from "./types";

/** Storefront (anonymous): read the active payment account. */
export async function fetchPaymentSettings(): Promise<PaymentSettings> {
  const response = await fetch(appPath("/api/backend/payment-settings"), { cache: "no-store" });
  const payload = (await response.json()) as { data?: unknown; error?: string };
  if (!response.ok) throw new Error(payload.error ?? "Unable to load payment settings");
  return paymentSettingsResponseSchema.parse(normalizeUploads(payload.data ?? {}));
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
  const response = await fetch(appPath("/api/backend/shipping-settings"), { cache: "no-store" });
  const payload = (await response.json()) as { data?: unknown; error?: string };
  if (!response.ok) throw new Error(payload.error ?? "Unable to load shipping settings");
  return shippingSettingsResponseSchema.parse(normalizeUploads(payload.data ?? {}));
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
  const response = await fetch(appPath("/api/backend/home-content"), { cache: "no-store" });
  const payload = (await response.json()) as { data?: unknown; error?: string };
  if (!response.ok) throw new Error(payload.error ?? "Unable to load home content");
  return homeContentResponseSchema.parse(normalizeUploads(payload.data ?? {}));
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

/** Storefront: read charm color images. */
export async function fetchCharmSettings(): Promise<CharmSettings> {
  const response = await fetch(appPath("/api/backend/charm-settings"), { cache: "no-store" });
  const payload = (await response.json()) as { data?: unknown; error?: string };
  if (!response.ok) throw new Error(payload.error ?? "Unable to load charm settings");
  return charmSettingsResponseSchema.parse(normalizeUploads(payload.data ?? { images: {} }));
}

export function fetchAdminCharmSettings() {
  return apiValidated(charmSettingsResponseSchema, "/api/backend/admin/charm-settings");
}

export function updateCharmSettings(input: CharmSettings) {
  return apiValidated(charmSettingsResponseSchema, "/api/backend/admin/charm-settings", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}
