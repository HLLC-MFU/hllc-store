import { getAdminIdentity, requireAdmin } from "../admin-auth";
import { writeAuditLog } from "../admin-user-service";
import { badRequest, notFound, ok, tooManyRequests } from "../http";
import { readLimitedJson } from "../request-utils";
import { rateLimit } from "../rate-limit";
import type { CreateOrderInput, PaymentSlipInput } from "../types";
import * as orderService from "./order-service";

type UpdateOrderBody = {
  status?: unknown;
  trackingNumber?: unknown;
  cancel?: unknown;
  reason?: unknown;
  addNote?: unknown;
};

/* ---------- storefront ---------- */

export async function listCustomerOrders(request: Request) {
  const limit = rateLimit(request, { bucket: "customer-orders", windowMs: 60_000, max: 30 });
  if (limit.limited) return tooManyRequests(limit.retryAfterSeconds, "too many requests");

  const url = new URL(request.url);
  const customerPhone = url.searchParams.get("customerPhone")?.replace(/\D/g, "") ?? "";
  const status = url.searchParams.get("status");

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

export async function createOrder(request: Request) {
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

export async function attachPaymentSlip(request: Request, orderId: string) {
  try {
    const body = await readLimitedJson<PaymentSlipInput>(request, 8_000_000);
    const order = await orderService.attachPaymentSlip(orderId, body);
    return ok(orderService.toPublicOrder(order));
  } catch (error) {
    return badRequest(error);
  }
}

/* ---------- admin ---------- */

export async function listAdminOrders(request: Request) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  const url = new URL(request.url);
  const status = url.searchParams.get("status");

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

export async function getAdminOrder(request: Request, orderId: string) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  const order = await orderService.getOrder(orderId);

  if (!order) {
    return notFound("order not found");
  }

  return ok(order);
}

export async function getPendingOrdersCount(request: Request) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  try {
    return ok({ pending: await orderService.countPendingOrders() });
  } catch (error) {
    return badRequest(error);
  }
}

export async function resendOrderEmail(request: Request, orderId: string) {
  const authError = requireAdmin(request);
  if (authError) return authError;
  try {
    await orderService.resendOrderEmail(orderId);
    return ok({ message: "ส่ง email ใหม่แล้ว" });
  } catch (error) {
    return badRequest(error);
  }
}

export async function updateAdminOrder(request: Request, orderId: string) {
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
