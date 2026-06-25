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

    const result = await orderService.listOrders({
      customerPhone,
      status: status && orderService.isOrderStatus(status) ? status : undefined,
    });

    return ok(result.orders.map(orderService.toPublicOrder));
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
  const search = url.searchParams.get("search") ?? undefined;
  const page = Math.max(parseInt(url.searchParams.get("page") ?? "1", 10) || 1, 1);
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50", 10) || 50, 200);
  const sortOrder = url.searchParams.get("sort") === "asc" ? "asc" : "desc";
  const rawMode = url.searchParams.get("deliveryMode");
  const deliveryMode = rawMode === "delivery" || rawMode === "pickup" ? rawMode : undefined;

  try {
    const result = await orderService.listOrders({
      status: status && orderService.isOrderStatus(status) ? status : undefined,
      excludeStatuses: status ? undefined : undefined,
      page,
      limit,
      search,
      sortOrder,
      deliveryMode,
    });
    return ok({ orders: result.orders, total: result.total, page, limit });
  } catch (error) {
    return badRequest(error);
  }
}

function csvCell(value: string | number): string {
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function exportAdminOrders(request: Request) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const search = url.searchParams.get("search") ?? undefined;
  const sortOrder = url.searchParams.get("sort") === "asc" ? "asc" : "desc";
  const rawMode = url.searchParams.get("deliveryMode");
  const deliveryMode = rawMode === "delivery" || rawMode === "pickup" ? rawMode : undefined;

  try {
    const orders = await orderService.listAllOrdersForExport({
      status: status && orderService.isOrderStatus(status) ? status : undefined,
      search,
      sortOrder,
      deliveryMode,
    });

    const header = ["Order ID", "Date", "Customer Name", "Phone", "Email", "Address", "Delivery Mode", "Items", "Subtotal", "Shipping Fee", "Total", "Status", "Slip Status", "Tracking Number"]
      .map(csvCell).join(",");

    const rows = orders.map((order) => {
      const itemsStr = order.items.map((item) => {
        const name = (item.name as { th?: string; en?: string }).th ?? (item.name as { th?: string; en?: string }).en ?? "";
        let label = item.selectedOption ? `${name} (${item.selectedOption})` : name;
        if (item.customName?.startsWith("charm:")) {
          const parts = item.customName.slice(6).split(":");
          label += ` + พวงกุญแจ สี${parts[0] ?? ""}`;
          if (parts[1]) label += ` · ${parts[1]}`;
        }
        return `${item.quantity}× ${label}`;
      }).join(" | ");

      const date = new Date(order.createdAt).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" });

      return [
        order.id,
        date,
        order.customer.name,
        order.customer.phone,
        order.customer.email ?? "",
        order.customer.address,
        order.deliveryMode ?? "delivery",
        itemsStr,
        order.subtotal ?? order.total,
        order.shippingFee ?? 0,
        order.total,
        order.status,
        order.slip.status,
        order.trackingNumber ?? "",
      ].map(csvCell).join(",");
    });

    const csv = "﻿" + [header, ...rows].join("\n");
    const date = new Date().toISOString().slice(0, 10);

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="orders-${date}.csv"`,
      },
    });
  } catch (error) {
    return badRequest(error);
  }
}

export async function getAdminOrdersSummary(request: Request) {
  const authError = requireAdmin(request);
  if (authError) return authError;
  const url = new URL(request.url);
  const rawMode = url.searchParams.get("deliveryMode");
  const deliveryMode = rawMode === "delivery" || rawMode === "pickup" ? rawMode : undefined;
  try {
    return ok(await orderService.getOrdersSummary(deliveryMode));
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
