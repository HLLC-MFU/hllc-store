import { NextRequest } from "next/server";
import { getAdminIdentity, requireAdmin } from "@/lib/backend/admin-auth";
import { writeAuditLog } from "@/lib/backend/admin-user-service";
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
import { readLimitedJson } from "@/lib/backend/request-utils";

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
  const authError = requireAdmin(_request);
  if (authError) return authError;

  const { orderId } = await context.params;
  const order = await getOrder(orderId);

  if (!order) {
    return notFound("order not found");
  }

  return ok(order);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  try {
    const { orderId } = await context.params;
    const body = await readLimitedJson<UpdateOrderBody>(request, 16_000);
    const actor = getAdminIdentity(request);

    if (typeof body.trackingNumber === "string") {
      const updated = await updateTrackingNumber(orderId, body.trackingNumber);
      if (actor) await writeAuditLog(actor, "order.tracking_updated", { orderId });
      return ok(updated);
    }

    if (body.cancel === true && typeof body.reason === "string") {
      const updated = await cancelOrder(orderId, body.reason, actor?.username ?? "admin");
      if (actor) await writeAuditLog(actor, "order.cancelled", { orderId });
      return ok(updated);
    }

    if (
      body.addNote !== null &&
      typeof body.addNote === "object" &&
      "text" in (body.addNote as object) &&
      "action" in (body.addNote as object)
    ) {
      const n = body.addNote as { text: string; action: string; by?: string };
      const updated = await addAdminNote(orderId, { text: n.text, action: n.action, by: n.by ?? actor?.username ?? "admin" });
      if (actor) await writeAuditLog(actor, "order.note_added", { orderId, action: n.action });
      return ok(updated);
    }

    if (typeof body.status !== "string" || !isOrderStatus(body.status)) {
      throw new Error("status is invalid");
    }

    const updated = await updateOrderStatus(orderId, body.status);
    if (actor) await writeAuditLog(actor, "order.status_updated", { orderId, status: body.status });

    if (body.status === "payment_review") {
      void sendEmail(slipResetEmail(updated.customer.name, updated.id));
    }

    return ok(updated);
  } catch (error) {
    return badRequest(error);
  }
}
