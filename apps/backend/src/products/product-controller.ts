import type { CreateProductInput } from "../types";
import { badRequest, ok } from "../http";
import { readLimitedJson } from "../request-utils";
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

export async function createProduct(request: Request) {
  try {
    const body = await readLimitedJson<CreateProductInput>(request);
    return ok(await productService.createProduct(body), { status: 201 });
  } catch (error) {
    return badRequest(error);
  }
}

export async function updateProduct(request: Request, productId: string) {
  try {
    const body = await readLimitedJson<Partial<CreateProductInput>>(request);
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

export async function listAllProductImageUrls(): Promise<string[]> {
  return productService.listAllProductImageUrls();
}
