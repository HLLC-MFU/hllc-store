import { NextRequest } from "next/server";
import { badRequest, notFound, ok } from "@/lib/backend/http";
import {
  attachPaymentSlip,
  getOrder,
} from "@/lib/backend/ecom-service";
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

  return ok(order);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { orderId } = await context.params;
    const body = (await request.json()) as PaymentSlipInput;
    const order = await attachPaymentSlip(orderId, body);

    return ok(order);
  } catch (error) {
    return badRequest(error);
  }
}
