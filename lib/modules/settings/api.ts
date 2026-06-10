import { apiValidated } from "@/components/admin/api-client";
import { paymentSettingsResponseSchema, type PaymentSettings } from "./types";

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
