import { NextRequest } from "next/server";
import { badRequest, notFound, ok } from "@/lib/backend/http";
import {
  addAdminNote,
  cancelOrder,
  getOrder,
  isOrderStatus,
  updateOrderStatus,
  updateTrackingNumber,
} from "@/lib/backend/ecom-service";
import { sendEmail, slipResetEmail } from "@/lib/backend/email-service";

type RouteContext = {
  params: Promise<{
    orderId: string;
  }>;
};

type UpdateOrderBody = {
  status?: unknown;
  trackingNumber?: unknown;
  cancel?: unknown;
  reason?: unknown;
  addNote?: unknown;
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

    if (typeof body.trackingNumber === "string") {
      return ok(await updateTrackingNumber(orderId, body.trackingNumber));
    }

    if (body.cancel === true && typeof body.reason === "string") {
      return ok(await cancelOrder(orderId, body.reason, "admin"));
    }

    if (
      body.addNote !== null &&
      typeof body.addNote === "object" &&
      "text" in (body.addNote as object) &&
      "action" in (body.addNote as object)
    ) {
      const n = body.addNote as { text: string; action: string; by?: string };
      return ok(await addAdminNote(orderId, { text: n.text, action: n.action, by: n.by ?? "admin" }));
    }

    if (typeof body.status !== "string" || !isOrderStatus(body.status)) {
      throw new Error("status is invalid");
    }

    const updated = await updateOrderStatus(orderId, body.status);

    if (body.status === "payment_review") {
      void sendEmail(slipResetEmail(updated.customer.name, updated.id));
    }

    return ok(updated);
  } catch (error) {
    return badRequest(error);
  }
}
