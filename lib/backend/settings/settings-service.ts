import { parseOrThrow } from "@/lib/validation/schemas";
import { paymentSettingsSchema } from "@/lib/validation/schemas";
import { getSettingsCollection, PAYMENT_SETTINGS_KEY } from "./settings-module";
import { now } from "@/lib/backend/validation-utils";

export type PaymentSettings = {
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
};

const DEFAULTS: PaymentSettings = {
  bankName: "ธนาคารกรุงเทพ",
  bankAccountName: "นันทเดช วงศ์ไชยา",
  bankAccountNumber: "6621540027",
};

export async function getPaymentSettings(): Promise<PaymentSettings> {
  const collection = await getSettingsCollection();
  const doc = await collection.findOne({ _id: PAYMENT_SETTINGS_KEY as unknown as never });
  if (!doc) return { ...DEFAULTS };
  return {
    bankName: typeof doc.bankName === "string" ? doc.bankName : DEFAULTS.bankName,
    bankAccountName: typeof doc.bankAccountName === "string" ? doc.bankAccountName : DEFAULTS.bankAccountName,
    bankAccountNumber: typeof doc.bankAccountNumber === "string" ? doc.bankAccountNumber : DEFAULTS.bankAccountNumber,
  };
}

export async function updatePaymentSettings(input: unknown): Promise<PaymentSettings> {
  const parsed = parseOrThrow(paymentSettingsSchema, input);
  const collection = await getSettingsCollection();
  await collection.updateOne(
    { _id: PAYMENT_SETTINGS_KEY as unknown as never },
    { $set: { ...parsed, updatedAt: now() } },
    { upsert: true },
  );
  return getPaymentSettings();
}
