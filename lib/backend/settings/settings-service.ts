import { parseOrThrow } from "@/lib/validation/schemas";
import { paymentSettingsSchema, shippingSettingsSchema } from "@/lib/validation/schemas";
import { getSettingsCollection, PAYMENT_SETTINGS_KEY, SHIPPING_SETTINGS_KEY } from "./settings-module";
import { now } from "@/lib/backend/validation-utils";
import { DEFAULT_SHIPPING_RATES, type ShippingRates } from "@/lib/config/shipping";

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

const num = (value: unknown, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

export async function getShippingSettings(): Promise<ShippingRates> {
  const collection = await getSettingsCollection();
  const doc = await collection.findOne({ _id: SHIPPING_SETTINGS_KEY as unknown as never });
  if (!doc) return { ...DEFAULT_SHIPPING_RATES };
  return {
    normalFirstItem: num(doc.normalFirstItem, DEFAULT_SHIPPING_RATES.normalFirstItem),
    normalAdditionalItem: num(doc.normalAdditionalItem, DEFAULT_SHIPPING_RATES.normalAdditionalItem),
    remoteFirstItem: num(doc.remoteFirstItem, DEFAULT_SHIPPING_RATES.remoteFirstItem),
    remoteAdditionalItem: num(doc.remoteAdditionalItem, DEFAULT_SHIPPING_RATES.remoteAdditionalItem),
    islandFirstItem: num(doc.islandFirstItem, DEFAULT_SHIPPING_RATES.islandFirstItem),
    islandAdditionalItem: num(doc.islandAdditionalItem, DEFAULT_SHIPPING_RATES.islandAdditionalItem),
  };
}

export async function updateShippingSettings(input: unknown): Promise<ShippingRates> {
  const parsed = parseOrThrow(shippingSettingsSchema, input);
  const collection = await getSettingsCollection();
  await collection.updateOne(
    { _id: SHIPPING_SETTINGS_KEY as unknown as never },
    { $set: { ...parsed, updatedAt: now() } },
    { upsert: true },
  );
  return getShippingSettings();
}
