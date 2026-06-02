import { NextRequest } from "next/server";
import { getAdminIdentity, requireAdmin } from "@/lib/backend/admin-auth";
import { writeAuditLog } from "@/lib/backend/admin-user-service";
import { badRequest, ok } from "@/lib/backend/http";
import { readLimitedJson } from "@/lib/backend/request-utils";
import { reviewPaymentSlip } from "@/lib/backend/ecom-service";
import type { ReviewSlipInput } from "@/lib/backend/types";
import { sendEmail, slipApprovedEmail, slipRejectedEmail } from "@/lib/backend/email-service";

type RouteContext = {
  params: Promise<{
    orderId: string;
  }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  try {
    const { orderId } = await context.params;
    const body = await readLimitedJson<ReviewSlipInput>(request, 32_000);
    const order = await reviewPaymentSlip(orderId, body);
    const actor = getAdminIdentity(request);
    if (actor) {
      await writeAuditLog(actor, body.approved ? "slip.approved" : "slip.rejected", { orderId });
    }

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
