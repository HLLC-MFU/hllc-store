import { z } from "zod";
import { apiValidated, api } from "@/components/admin/api-client";
import { productResponseSchema, type Product, type ProductInput } from "./types";

export function fetchAdminProducts() {
  return apiValidated(z.array(productResponseSchema), "/api/backend/admin/products");
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
