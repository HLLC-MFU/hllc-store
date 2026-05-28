import { NextRequest } from "next/server";
import { badRequest, ok } from "@/lib/backend/http";
import {
  createProduct,
  listAdminProducts,
} from "@/lib/backend/ecom-service";
import type { CreateProductInput } from "@/lib/backend/types";

export async function GET() {
  try {
    return ok(await listAdminProducts());
  } catch (error) {
    return badRequest(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateProductInput;
    const product = await createProduct(body);

    return ok(product, { status: 201 });
  } catch (error) {
    return badRequest(error);
  }
}
