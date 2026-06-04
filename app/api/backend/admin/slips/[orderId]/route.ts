import { NextRequest } from "next/server";
import { getAdminIdentity, requireAdmin } from "@/lib/backend/admin-auth";
import { writeAuditLog } from "@/lib/backend/admin-user-service";
import { badRequest, ok } from "@/lib/backend/http";
import { readLimitedJson } from "@/lib/backend/request-utils";
import { reviewPaymentSlip } from "@/lib/backend/order-service";
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
      await writeAuditLog(actor, body.approved ? "slip.approved" : "slip.rejected", {
        orderId,
        customerName: order.customer.name,
        note: body.note,
      });
    }

    // Fire-and-forget email notification
    const customerName = order.customer.name;
    const emailPayload = body.approved
      ? slipApprovedEmail(customerName, orderId, order.customer.email, order.customer.phone)
      : slipRejectedEmail(customerName, orderId, body.note, order.customer.email, order.customer.phone);
    if (emailPayload.to) {
      void sendEmail(emailPayload).catch((error) => {
        console.error("[EMAIL_ERROR]", error instanceof Error ? error.message : "failed to send email");
      });
    }

    return ok(order);
  } catch (error) {
    return badRequest(error);
  }
}
