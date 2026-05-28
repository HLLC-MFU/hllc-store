import { NextRequest } from "next/server";
import { badRequest, ok } from "@/lib/backend/http";
import {
  createOrder,
  isOrderStatus,
  listOrders,
} from "@/lib/backend/ecom-service";
import type { CreateOrderInput } from "@/lib/backend/types";

export async function GET(request: NextRequest) {
  const customerPhone = request.nextUrl.searchParams.get("customerPhone");
  const status = request.nextUrl.searchParams.get("status");

  try {
    return ok(
      await listOrders({
        customerPhone: customerPhone ?? undefined,
        status: status && isOrderStatus(status) ? status : undefined,
      }),
    );
  } catch (error) {
    return badRequest(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateOrderInput;
    const order = await createOrder(body);

    return ok(order, { status: 201 });
  } catch (error) {
    return badRequest(error);
  }
}
