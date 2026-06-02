import { NextRequest } from "next/server";
import { badRequest, ok } from "@/lib/backend/http";
import { reviewPaymentSlip } from "@/lib/backend/ecom-service";
import type { ReviewSlipInput } from "@/lib/backend/types";
import { sendEmail, slipApprovedEmail, slipRejectedEmail } from "@/lib/backend/email-service";

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

    // Fire-and-forget email notification
    const customerName = order.customer.name;
    const emailPayload = body.approved
      ? slipApprovedEmail(customerName, orderId)
      : slipRejectedEmail(customerName, orderId, body.note);
    void sendEmail(emailPayload);

    return ok(order);
  } catch (error) {
    return badRequest(error);
  }
}
