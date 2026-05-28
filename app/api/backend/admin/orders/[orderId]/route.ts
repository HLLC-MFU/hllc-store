import { NextRequest } from "next/server";
import { badRequest, notFound, ok } from "@/lib/backend/http";
import {
  getOrder,
  isOrderStatus,
  updateOrderStatus,
} from "@/lib/backend/ecom-service";

type RouteContext = {
  params: Promise<{
    orderId: string;
  }>;
};

type UpdateOrderBody = {
  status?: unknown;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const { orderId } = await context.params;
  const order = await getOrder(orderId);

  if (!order) {
    return notFound("order not found");
  }

  return ok(order);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { orderId } = await context.params;
    const body = (await request.json()) as UpdateOrderBody;

    if (typeof body.status !== "string" || !isOrderStatus(body.status)) {
      throw new Error("status is invalid");
    }

    return ok(await updateOrderStatus(orderId, body.status));
  } catch (error) {
    return badRequest(error);
  }
}
