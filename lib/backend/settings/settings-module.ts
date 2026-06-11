import { getDb } from "@/lib/backend/mongodb";

export const SETTINGS_COLLECTION = "settings";
export const PAYMENT_SETTINGS_KEY = "payment";
export const SHIPPING_SETTINGS_KEY = "shipping";

export async function getSettingsCollection() {
  const db = await getDb();
  return db.collection(SETTINGS_COLLECTION);
}
