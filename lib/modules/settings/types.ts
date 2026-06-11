import { z } from "zod";

export const paymentSettingsResponseSchema = z.object({
  bankName: z.string(),
  bankAccountName: z.string(),
  bankAccountNumber: z.string(),
});

export type PaymentSettings = z.infer<typeof paymentSettingsResponseSchema>;

export const shippingSettingsResponseSchema = z.object({
  normalFirstItem: z.number(),
  normalAdditionalItem: z.number(),
  remoteFirstItem: z.number(),
  remoteAdditionalItem: z.number(),
  islandFirstItem: z.number(),
  islandAdditionalItem: z.number(),
});

export type ShippingSettings = z.infer<typeof shippingSettingsResponseSchema>;
