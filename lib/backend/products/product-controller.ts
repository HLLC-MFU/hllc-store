import type { NextRequest } from "next/server";
import type { CreateProductInput } from "@/lib/backend/types";
import { badRequest, ok } from "@/lib/backend/http";
import * as productService from "./product-service";

export async function listStoreProducts() {
  try {
    return ok(await productService.listStoreProducts());
  } catch (error) {
    return badRequest(error);
  }
}

export async function listAdminProducts() {
  try {
    return ok(await productService.listAdminProducts());
  } catch (error) {
    return badRequest(error);
  }
}

export async function createProduct(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateProductInput;
    return ok(await productService.createProduct(body), { status: 201 });
  } catch (error) {
    return badRequest(error);
  }
}

export async function updateProduct(request: NextRequest, productId: string) {
  try {
    const body = (await request.json()) as Partial<CreateProductInput>;
    return ok(await productService.updateProduct(productId, body));
  } catch (error) {
    return badRequest(error);
  }
}

export async function deleteProduct(productId: string) {
  try {
    return ok(await productService.deleteProduct(productId));
  } catch (error) {
    return badRequest(error);
  }
}
