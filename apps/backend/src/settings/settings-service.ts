import { parseOrThrow, paymentSettingsSchema, shippingSettingsSchema, homeContentSchema } from "@hllc/shared/validation/schemas";
import { getSettingsCollection, PAYMENT_SETTINGS_KEY, SHIPPING_SETTINGS_KEY, HOME_CONTENT_KEY, CHARM_SETTINGS_KEY } from "./settings-module";
import { CHARM_COLORS } from "@hllc/shared/config/catalog";
import { now } from "../validation-utils";
import { DEFAULT_SHIPPING_RATES, type ShippingRates } from "@hllc/shared/config/shipping";
import { CATEGORIES, HOME_BLOCK_IDS, type HomeBlockId } from "@hllc/shared/config/catalog";
import type { LocalizedText } from "../types";

export type PaymentSettings = {
  bankName: string;
  bankNameEn: string;
  bankAccountName: string;
  bankAccountNumber: string;
};

const DEFAULTS: PaymentSettings = {
  bankName: "ธนาคารกรุงเทพ",
  bankNameEn: "Bangkok Bank",
  bankAccountName: "นันทเดช วงศ์ไชยา",
  bankAccountNumber: "6621540027",
};

export async function getPaymentSettings(): Promise<PaymentSettings> {
  const collection = await getSettingsCollection();
  const doc = await collection.findOne({ _id: PAYMENT_SETTINGS_KEY as unknown as never });
  if (!doc) return { ...DEFAULTS };
  return {
    bankName: typeof doc.bankName === "string" ? doc.bankName : DEFAULTS.bankName,
    bankNameEn: typeof doc.bankNameEn === "string" ? doc.bankNameEn : DEFAULTS.bankNameEn,
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
    pickupLocation: typeof doc.pickupLocation === "string" ? doc.pickupLocation : "",
    pickupHours: typeof doc.pickupHours === "string" ? doc.pickupHours : "",
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

/* ================================================================
   Home content (editable banner blocks)
   ================================================================ */

export type HomeBlock = {
  imageUrl: string;
  title: LocalizedText;
  subtitle: LocalizedText;
  blockStatus?: "open" | "comingSoon" | "closed";
};

export type HomeContent = {
  blocks: Record<HomeBlockId, HomeBlock>;
};

// Default title/subtitle come from the catalog labels so a fresh store already
// shows sensible block headings before the admin uploads any banners.
function defaultHomeContent(): HomeContent {
  const blocks = {} as Record<HomeBlockId, HomeBlock>;
  for (const category of CATEGORIES) {
    blocks[category.id] = { imageUrl: "", title: category.label, subtitle: { th: "", en: "" } };
    for (const group of category.groups ?? []) {
      blocks[group.id] = { imageUrl: "", title: group.label, subtitle: { th: "", en: "" } };
    }
  }
  return { blocks };
}

const asLocalized = (value: unknown, fallback: LocalizedText): LocalizedText => {
  if (value && typeof value === "object") {
    const v = value as { th?: unknown; en?: unknown };
    return {
      th: typeof v.th === "string" && v.th ? v.th : fallback.th,
      en: typeof v.en === "string" ? v.en : fallback.en,
    };
  }
  return fallback;
};

export async function getHomeContent(): Promise<HomeContent> {
  const defaults = defaultHomeContent();
  const collection = await getSettingsCollection();
  const doc = await collection.findOne({ _id: HOME_CONTENT_KEY as unknown as never });
  const stored = (doc?.blocks ?? {}) as Record<string, unknown>;

  const blocks = {} as Record<HomeBlockId, HomeBlock>;
  for (const id of HOME_BLOCK_IDS) {
    const fallback = defaults.blocks[id];
    const raw = (stored[id] ?? {}) as { imageUrl?: unknown; title?: unknown; subtitle?: unknown; blockStatus?: unknown };
    const rawStatus = raw.blockStatus;
    blocks[id] = {
      imageUrl: typeof raw.imageUrl === "string" ? raw.imageUrl : "",
      title: asLocalized(raw.title, fallback.title),
      subtitle: asLocalized(raw.subtitle, fallback.subtitle),
      blockStatus: (rawStatus === "comingSoon" || rawStatus === "closed") ? rawStatus : "open",
    };
  }
  return { blocks };
}

export async function updateHomeContent(input: unknown): Promise<HomeContent> {
  const parsed = parseOrThrow(homeContentSchema, input);
  // Merge onto current content so partial edits (one block) don't wipe the rest.
  const current = await getHomeContent();
  const merged = { ...current.blocks } as Record<HomeBlockId, HomeBlock>;
  for (const [id, block] of Object.entries(parsed.blocks)) {
    if (!(id in merged)) continue;
    const key = id as HomeBlockId;
    merged[key] = {
      imageUrl: block.imageUrl ?? merged[key].imageUrl,
      title: { th: block.title?.th ?? merged[key].title.th, en: block.title?.en ?? merged[key].title.en },
      subtitle: { th: block.subtitle?.th ?? merged[key].subtitle.th, en: block.subtitle?.en ?? merged[key].subtitle.en },
      blockStatus: block.blockStatus ?? merged[key].blockStatus ?? "open",
    };
  }

  const collection = await getSettingsCollection();
  await collection.updateOne(
    { _id: HOME_CONTENT_KEY as unknown as never },
    { $set: { blocks: merged, updatedAt: now() } },
    { upsert: true },
  );
  return getHomeContent();
}

/* ================================================================
   Charm settings (color images for the dangle add-on)
   ================================================================ */

export type CharmSettings = {
  images: Record<string, string>;
};

export async function getCharmSettings(): Promise<CharmSettings> {
  const collection = await getSettingsCollection();
  const doc = await collection.findOne({ _id: CHARM_SETTINGS_KEY as unknown as never });
  const stored = (doc?.images ?? {}) as Record<string, unknown>;
  const images: Record<string, string> = {};
  for (const { id } of CHARM_COLORS) {
    images[id] = typeof stored[id] === "string" ? (stored[id] as string) : "";
  }
  return { images };
}

export async function updateCharmSettings(input: unknown): Promise<CharmSettings> {
  const raw = (input as { images?: Record<string, unknown> })?.images ?? {};
  const images: Record<string, string> = {};
  for (const { id } of CHARM_COLORS) {
    images[id] = typeof raw[id] === "string" ? (raw[id] as string) : "";
  }
  const collection = await getSettingsCollection();
  await collection.updateOne(
    { _id: CHARM_SETTINGS_KEY as unknown as never },
    { $set: { images, updatedAt: now() } },
    { upsert: true },
  );
  return getCharmSettings();
}
