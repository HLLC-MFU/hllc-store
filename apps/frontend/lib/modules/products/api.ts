import { z } from "zod";
import { apiValidated, api } from "@/components/admin/api-client";
import { appPath } from "@/lib/client/app-path";
import { normalizeUploads } from "@/lib/client/normalize-uploads";
import { productResponseSchema, type Product, type ProductInput } from "./types";

export function fetchAdminProducts() {
  return apiValidated(z.array(productResponseSchema), "/api/backend/admin/products");
}

// Storefront (anonymous): current active products, used to refresh cart items
// against the latest price / shipping / stock.
export async function fetchStoreProducts(): Promise<Product[]> {
  const response = await fetch(appPath("/api/backend/products"), { cache: "no-store" });
  const payload = (await response.json()) as { data?: unknown; error?: string };
  if (!response.ok) throw new Error(payload.error ?? "Unable to load products");
  return z.array(productResponseSchema).parse(normalizeUploads(payload.data ?? []));
}

export function createProduct(input: ProductInput) {
  return apiValidated(productResponseSchema, "/api/backend/admin/products", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateProduct(product: Product) {
  return apiValidated(productResponseSchema, `/api/backend/admin/products/${product.id}`, {
    method: "PATCH",
    body: JSON.stringify(product),
  });
}

export function deleteProduct(id: string) {
  return api<{ success: boolean }>(`/api/backend/admin/products/${id}`, { method: "DELETE" });
}
