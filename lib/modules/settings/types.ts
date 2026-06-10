import { z } from "zod";

export const paymentSettingsResponseSchema = z.object({
  bankName: z.string(),
  bankAccountName: z.string(),
  bankAccountNumber: z.string(),
});

export type PaymentSettings = z.infer<typeof paymentSettingsResponseSchema>;
