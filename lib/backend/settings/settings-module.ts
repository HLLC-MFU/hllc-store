import { getDb } from "@/lib/backend/mongodb";

export const SETTINGS_COLLECTION = "settings";
export const PAYMENT_SETTINGS_KEY = "payment";
export const SHIPPING_SETTINGS_KEY = "shipping";
export const HOME_CONTENT_KEY = "home-content";
export const CHARM_SETTINGS_KEY = "charm-settings";

export async function getSettingsCollection() {
  const db = await getDb();
  return db.collection(SETTINGS_COLLECTION);
}
