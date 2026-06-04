import { NextRequest } from "next/server";
import { badRequest, ok } from "@/lib/backend/http";
import { readLimitedJson } from "@/lib/backend/request-utils";
import {
  createOrder,
  isOrderStatus,
  listOrders,
  toPublicOrder,
} from "@/lib/backend/order-service";
import type { CreateOrderInput } from "@/lib/backend/types";

export async function GET(request: NextRequest) {
  const customerPhone = request.nextUrl.searchParams.get("customerPhone")?.replace(/\D/g, "") ?? "";
  const status = request.nextUrl.searchParams.get("status");

  try {
    if (customerPhone.length < 9) {
      throw new Error("customerPhone is required");
    }

    const orders = await listOrders({
      customerPhone,
      status: status && isOrderStatus(status) ? status : undefined,
    });

    return ok(orders.map(toPublicOrder));
  } catch (error) {
    return badRequest(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await readLimitedJson<CreateOrderInput>(request, 64_000);
    const order = await createOrder(body);

    return ok(order, { status: 201 });
  } catch (error) {
    return badRequest(error);
  }
}
