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
  trackingNumber?: unknown;
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

    const nextStatus =
      typeof body.status === "string" && isOrderStatus(body.status)
        ? body.status
        : undefined;

    if (body.status !== undefined && !nextStatus) {
      throw new Error("status is invalid");
    }

    const trackingNumber =
      typeof body.trackingNumber === "string" ? body.trackingNumber : undefined;

    if (!nextStatus && trackingNumber === undefined) {
      throw new Error("status or trackingNumber is required");
    }

    return ok(await updateOrderStatus(orderId, nextStatus, trackingNumber));
  } catch (error) {
    return badRequest(error);
  }
}
