import { z } from "zod";

export const paymentSettingsResponseSchema = z.object({
  bankName: z.string(),
  bankNameEn: z.string().optional().default(""),
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
  pickupLocation: z.string().optional(),
  pickupHours: z.string().optional(),
});

export type ShippingSettings = z.infer<typeof shippingSettingsResponseSchema>;

const localizedTextResponseSchema = z.object({
  th: z.string(),
  en: z.string().optional(),
});

export const homeBlockResponseSchema = z.object({
  imageUrl: z.string(),
  title: localizedTextResponseSchema,
  subtitle: localizedTextResponseSchema,
  blockStatus: z.enum(["open", "comingSoon", "closed"]).optional(),
});

export const homeContentResponseSchema = z.object({
  blocks: z.record(z.string(), homeBlockResponseSchema),
});

export type HomeBlock = z.infer<typeof homeBlockResponseSchema>;
export type HomeContent = z.infer<typeof homeContentResponseSchema>;

export const charmSettingsResponseSchema = z.object({
  images: z.record(z.string(), z.string()),
});

export type CharmSettings = z.infer<typeof charmSettingsResponseSchema>;
