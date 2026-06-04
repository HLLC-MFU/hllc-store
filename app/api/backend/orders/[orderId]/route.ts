import { NextRequest } from "next/server";
import { badRequest, notFound, ok } from "@/lib/backend/http";
import { readLimitedJson } from "@/lib/backend/request-utils";
import {
  attachPaymentSlip,
  getOrder,
  toPublicOrder,
} from "@/lib/backend/order-service";
import type { PaymentSlipInput } from "@/lib/backend/types";

type RouteContext = {
  params: Promise<{
    orderId: string;
  }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const { orderId } = await context.params;
  const order = await getOrder(orderId);

  if (!order) {
    return notFound("order not found");
  }

  return ok(toPublicOrder(order));
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { orderId } = await context.params;
    const body = await readLimitedJson<PaymentSlipInput>(request);
    const order = await attachPaymentSlip(orderId, body);

    return ok(toPublicOrder(order));
  } catch (error) {
    return badRequest(error);
  }
}
