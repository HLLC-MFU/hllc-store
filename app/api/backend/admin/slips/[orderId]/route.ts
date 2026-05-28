import { NextRequest } from "next/server";
import { badRequest, ok } from "@/lib/backend/http";
import { reviewPaymentSlip } from "@/lib/backend/ecom-service";
import type { ReviewSlipInput } from "@/lib/backend/types";

type RouteContext = {
  params: Promise<{
    orderId: string;
  }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { orderId } = await context.params;
    const body = (await request.json()) as ReviewSlipInput;
    const order = await reviewPaymentSlip(orderId, body);

    return ok(order);
  } catch (error) {
    return badRequest(error);
  }
}
