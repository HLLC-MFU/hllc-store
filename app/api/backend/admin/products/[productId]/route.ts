import { NextRequest } from "next/server";
import { badRequest, ok } from "@/lib/backend/http";
import { updateProduct, deleteProduct } from "@/lib/backend/ecom-service";
import type { CreateProductInput } from "@/lib/backend/types";

type RouteContext = {
  params: Promise<{
    productId: string;
  }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { productId } = await context.params;
    const body = (await request.json()) as Partial<CreateProductInput>;
    const product = await updateProduct(productId, body);

    return ok(product);
  } catch (error) {
    return badRequest(error);
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { productId } = await context.params;
    await deleteProduct(productId);

    return ok({ success: true });
  } catch (error) {
    return badRequest(error);
  }
}
