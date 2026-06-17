import type { NextRequest } from "next/server";
import { getAdminIdentity, requireAdmin } from "@/lib/backend/admin-auth";
import { writeAuditLog } from "@/lib/backend/admin-user-service";
import { badRequest, notFound, ok } from "@/lib/backend/http";
import { readLimitedJson } from "@/lib/backend/request-utils";
import type { CreateOrderInput, PaymentSlipInput } from "@/lib/backend/types";
import * as orderService from "./order-service";

type UpdateOrderBody = {
  status?: unknown;
  trackingNumber?: unknown;
  cancel?: unknown;
  reason?: unknown;
  addNote?: unknown;
};

/* ---------- storefront ---------- */

export async function listCustomerOrders(request: NextRequest) {
  const customerPhone = request.nextUrl.searchParams.get("customerPhone")?.replace(/\D/g, "") ?? "";
  const status = request.nextUrl.searchParams.get("status");

  try {
    if (customerPhone.length < 9) {
      throw new Error("customerPhone is required");
    }

    const orders = await orderService.listOrders({
      customerPhone,
      status: status && orderService.isOrderStatus(status) ? status : undefined,
    });

    return ok(orders.map(orderService.toPublicOrder));
  } catch (error) {
    return badRequest(error);
  }
}

export async function createOrder(request: NextRequest) {
  try {
    const body = await readLimitedJson<CreateOrderInput>(request, 64_000);
    const order = await orderService.createOrder(body);
    return ok(order, { status: 201 });
  } catch (error) {
    console.error("[createOrder] 400:", error instanceof Error ? error.message : error);
    return badRequest(error);
  }
}

export async function getPublicOrder(orderId: string) {
  const order = await orderService.getOrder(orderId);

  if (!order) {
    return notFound("order not found");
  }

  return ok(orderService.toPublicOrder(order));
}

export async function attachPaymentSlip(request: NextRequest, orderId: string) {
  try {
    const body = await readLimitedJson<PaymentSlipInput>(request, 8_000_000);
    const order = await orderService.attachPaymentSlip(orderId, body);
    return ok(orderService.toPublicOrder(order));
  } catch (error) {
    return badRequest(error);
  }
}

/* ---------- admin ---------- */

export async function listAdminOrders(request: NextRequest) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  const status = request.nextUrl.searchParams.get("status");

  try {
    return ok(
      await orderService.listOrders({
        status: status && orderService.isOrderStatus(status) ? status : undefined,
        excludeStatuses: status ? undefined : ["pending_payment"],
      }),
    );
  } catch (error) {
    return badRequest(error);
  }
}

export async function getAdminOrder(request: NextRequest, orderId: string) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  const order = await orderService.getOrder(orderId);

  if (!order) {
    return notFound("order not found");
  }

  return ok(order);
}

export async function getPendingOrdersCount(request: NextRequest) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  try {
    return ok({ pending: await orderService.countPendingOrders() });
  } catch (error) {
    return badRequest(error);
  }
}

export async function updateAdminOrder(request: NextRequest, orderId: string) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  try {
    const body = await readLimitedJson<UpdateOrderBody>(request, 16_000);
    const actor = getAdminIdentity(request);

    if (typeof body.trackingNumber === "string") {
      const updated = await orderService.setOrderTrackingNumber(orderId, body.trackingNumber);
      if (actor) await writeAuditLog(actor, "order.tracking_updated", { orderId, customerName: updated.customer.name });
      return ok(updated);
    }

    if (body.cancel === true && typeof body.reason === "string") {
      const updated = await orderService.cancelOrder(orderId, body.reason, actor?.username ?? "admin");
      if (actor) await writeAuditLog(actor, "order.cancelled", { orderId, customerName: updated.customer.name, reason: body.reason });
      return ok(updated);
    }

    if (
      body.addNote !== null &&
      typeof body.addNote === "object" &&
      "text" in (body.addNote as object) &&
      "action" in (body.addNote as object)
    ) {
      const n = body.addNote as { text: string; action: string; by?: string };
      const updated = await orderService.addAdminNote(orderId, { text: n.text, action: n.action, by: n.by ?? actor?.username ?? "admin" });
      if (actor) await writeAuditLog(actor, "order.note_added", { orderId, customerName: updated.customer.name, action: n.action });
      return ok(updated);
    }

    if (typeof body.status !== "string" || !orderService.isOrderStatus(body.status)) {
      throw new Error("status is invalid");
    }

    const updated = await orderService.transitionOrderStatus(orderId, body.status);
    if (actor) await writeAuditLog(actor, "order.status_updated", { orderId, customerName: updated.customer.name, status: body.status });

    return ok(updated);
  } catch (error) {
    return badRequest(error);
  }
}
