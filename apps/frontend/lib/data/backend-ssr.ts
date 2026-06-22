import {
  homeContentResponseSchema,
  charmSettingsResponseSchema,
  type HomeContent,
  type CharmSettings,
} from "@/lib/modules/settings";
import { z } from "zod";
import { productResponseSchema } from "@hllc/shared/validation/response-schemas";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

async function fetchBackend<T>(path: string, schema: z.ZodType<T>): Promise<T> {
  const response = await fetch(`${BACKEND_URL}${path}`, { cache: "no-store" });
  const payload = (await response.json()) as { data?: unknown };
  return schema.parse(payload.data);
}

export async function getHomeContent(): Promise<HomeContent> {
  return fetchBackend("/api/backend/home-content", homeContentResponseSchema);
}

export async function getCharmSettings(): Promise<CharmSettings> {
  return fetchBackend("/api/backend/charm-settings", charmSettingsResponseSchema);
}

export async function listStoreProducts() {
  return fetchBackend("/api/backend/products", z.array(productResponseSchema));
}
