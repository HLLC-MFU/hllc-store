import { z } from "zod";
import { productResponseSchema } from "@hllc/shared/validation/response-schemas";
import { normalizeUploads } from "@/lib/client/normalize-uploads";

type RawProduct = z.infer<typeof productResponseSchema>;
export type StoreProduct = Omit<RawProduct, "options" | "category" | "group"> & {
  options: NonNullable<RawProduct["options"]>;
  category: string;
  group: string;
};

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

export async function getStoreProducts(): Promise<StoreProduct[]> {
  const response = await fetch(`${BACKEND_URL}/api/backend/products`, { cache: "no-store" });
  const payload = (await response.json()) as { data?: unknown };
  const products = z.array(productResponseSchema).parse(normalizeUploads(payload.data ?? []));
  return products.map((p) => ({
    ...p,
    options: p.options ?? [],
    category: p.category ?? "",
    group: p.group ?? "",
  }));
}
