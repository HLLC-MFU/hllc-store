import {
  homeContentResponseSchema,
  charmSettingsResponseSchema,
  type HomeContent,
  type CharmSettings,
} from "@/lib/modules/settings";
import { z } from "zod";
import { productResponseSchema } from "@hllc/shared/validation/response-schemas";
import { normalizeUploads } from "@/lib/client/normalize-uploads";
import { CATEGORIES, CHARM_COLORS } from "@hllc/shared/config/catalog";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

async function fetchBackend<T>(path: string, schema: z.ZodType<T>, fallback: T): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(`${BACKEND_URL}${path}`, { cache: "no-store", signal: controller.signal });
    const payload = (await response.json().catch(() => ({}))) as { data?: unknown };
    if (!response.ok || payload.data === undefined) return fallback;
    return schema.parse(normalizeUploads(payload.data));
  } catch {
    return fallback;
  } finally {
    clearTimeout(timer);
  }
}

const fallbackHomeContent: HomeContent = {
  blocks: Object.fromEntries(
    CATEGORIES.flatMap((category) => [
      [
        category.id,
        {
          imageUrl: "",
          title: category.label,
          subtitle: { th: "", en: "" },
          blockStatus: "open" as const,
        },
      ],
      ...(category.groups ?? []).map((group) => [
        group.id,
        {
          imageUrl: "",
          title: group.label,
          subtitle: group.subtitle ?? { th: "", en: "" },
          blockStatus: "open" as const,
        },
      ]),
    ]),
  ),
};

const fallbackCharmSettings: CharmSettings = {
  images: Object.fromEntries(CHARM_COLORS.map((color) => [color.id, ""])),
};

export async function getHomeContent(): Promise<HomeContent> {
  return fetchBackend("/api/backend/home-content", homeContentResponseSchema, fallbackHomeContent);
}

export async function getCharmSettings(): Promise<CharmSettings> {
  return fetchBackend("/api/backend/charm-settings", charmSettingsResponseSchema, fallbackCharmSettings);
}

export async function listStoreProducts() {
  return fetchBackend("/api/backend/products", z.array(productResponseSchema), []);
}
