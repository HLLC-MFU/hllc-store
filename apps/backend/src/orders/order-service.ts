import { type Document } from "mongodb";
import { getDb } from "../mongodb";
import { createOrderSchema, imageUrlSchema, parseOrThrow } from "@hllc/shared/validation/schemas";
import { assertText, assertObjectId, now, normalizeOptions } from "../validation-utils";
import { publishOrdersUpdated } from "../admin-realtime";
import { calcShippingFee } from "@hllc/shared/config/shipping";
import { isRemoteArea } from "@hllc/shared/data/remote-areas";
import { isIslandArea } from "@hllc/shared/data/island-areas";
import { getShippingSettings } from "../settings/settings-service";
import { sendEmail, trackingNumberEmail, pickupReadyEmail, orderCancelledEmail, orderCompletedEmail, orderConfirmedEmail, slipReceivedEmail, slipApprovedEmail, slipRejectedEmail } from "../email-service";
import { getOrdersCollection } from "./order-module";
import type {
  CreateOrderInput,
  Order,
  OrderItem,
  OrderStatus,
  PaymentSlipInput,
  PublicOrder,
  ReviewSlipInput,
} from "../types";

/** Strip PII + internal fields before returning an order to an anonymous customer. */
export function toPublicOrder(order: Order): PublicOrder {
  return {
    id: order.id,
    customer: { name: order.customer.name, phone: order.customer.phone },
    items: order.items,
    subtotal: order.subtotal,
    shippingFee: order.shippingFee,
    deliveryMode: order.deliveryMode,
    total: order.total,
    status: order.status,
    slip: { status: order.slip.status, imageUrl: order.slip.imageUrl, reviewNote: order.slip.reviewNote },
    trackingNumber: order.trackingNumber,
    cancellationReason: order.cancellationReason,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

function assertImageValue(value: unknown, field: string) {
  const result = imageUrlSchema.safeParse(value);
  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? `${field} is invalid`);
  }
  return result.data;
}

function notifyEmail(payload: ReturnType<typeof trackingNumberEmail>) {
  if (!payload.to) return;

  void sendEmail(payload).catch((error) => {
    console.error("[EMAIL_ERROR]", error instanceof Error ? error.message : "failed to send email");
  });
}

function charmAddonPrice(customName?: string): number {
  if (!customName?.startsWith("charm:")) return 0;
  const letters = customName.split(":")[2] ?? "";
  return 30 + Math.max(0, letters.length - 2) * 10;
}

function toOrder(doc: Document): Order {
  const products: Document[] = doc._products ?? [];
  const items: OrderItem[] = (doc.items as Document[]).map((item) => {
    const product = products.find((p) => p._id.equals(item.productId));
    const customName = typeof item.customName === "string" && item.customName.trim()
      ? item.customName.trim()
      : undefined;
    const storedPrice = typeof item._price === "number" ? item._price : (product?.price ?? 0);
    const price = storedPrice + charmAddonPrice(customName);
    return {
      productId: item.productId.toString(),
      name: product?.name && typeof product.name === "object"
        ? product.name as import("../types").LocalizedText
        : { th: typeof product?.name === "string" ? product.name : "สินค้าถูกลบ" },
      price,
      quantity: item.quantity,
      subtotal: price * item.quantity,
      selectedOption: typeof item.selectedOption === "string" && item.selectedOption.trim()
        ? item.selectedOption.trim()
        : undefined,
      customName,
    };
  });
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const shippingFee = Number(doc.shippingFee ?? 0);

  return {
    id: doc._id.toString(),
    customer: doc.customer,
    items,
    subtotal,
    shippingFee,
    deliveryMode: doc.deliveryMode === "pickup" ? "pickup" : "delivery",
    total: subtotal + shippingFee,
    status: doc.status,
    slip: doc.slip,
    slipHistory: Array.isArray(doc.slipHistory) ? doc.slipHistory : [],
    trackingNumber: doc.trackingNumber,
    cancellationReason: doc.cancellationReason,
    adminNotes: doc.adminNotes ?? [],
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

const ORDERS_LOOKUP_PIPELINE: Document[] = [
  {
    $lookup: {
      from: "products",
      localField: "items.productId",
      foreignField: "_id",
      as: "_products",
    },
  },
];

export async function createOrder(input: CreateOrderInput) {
  const db = await getDb();
  const orders = await getOrdersCollection();
  const parsed = parseOrThrow(createOrderSchema, input);
  const customer = {
    ...parsed.customer,
    email: parsed.customer.email.toLowerCase(),
  };

  const requestedItems = parsed.items.map((item) => ({
    productId: item.productId,
    quantity: item.quantity,
    selectedOption: item.selectedOption ?? "",
    customName: item.customName?.trim() ?? "",
  }));

  const products = await db
    .collection("products")
    .find({
      _id: { $in: requestedItems.map((item) => assertObjectId(item.productId)) },
      active: true,
    })
    .toArray();

  const storedItems = requestedItems.map((item) => {
    const product = products.find((candidate) =>
      candidate._id.equals(item.productId),
    );

    if (!product) {
      throw new Error(`product not found: ${item.productId}`);
    }

    if (item.quantity > product.stock) {
      throw new Error(`not enough stock: ${product.name}`);
    }

    const productOptions = normalizeOptions(product.options);
    const selectedOption = item.selectedOption.trim();
    const matchedOption = selectedOption
      ? productOptions.find((option) => option.label === selectedOption)
      : undefined;

    if (selectedOption && productOptions.length > 0 && !matchedOption) {
      const pName = typeof product.name === "object" ? (product.name as { th?: string }).th ?? "" : String(product.name);
      throw new Error(`invalid option selected: ${pName}`);
    }

    const optionStock = matchedOption?.stock ?? product.stock;
    if (matchedOption && item.quantity > optionStock) {
      throw new Error(`not enough option stock: ${matchedOption.label}`);
    }

    const addon = charmAddonPrice(item.customName || undefined);
    return {
      productId: product._id,
      quantity: item.quantity,
      selectedOption,
      customName: item.customName,
      _price: product.price + addon,
    };
  });

  const subtotal = storedItems.reduce((sum, item) => sum + item._price * item.quantity, 0);
  const deliveryMode = parsed.deliveryMode ?? "delivery";
  const rates = await getShippingSettings();
  const postalCode = parsed.customer.postalCode;
  const island = deliveryMode === "delivery" && isIslandArea(postalCode);
  const remote = deliveryMode === "delivery" && !island && isRemoteArea(postalCode);
  const shippingFee = calcShippingFee(
    storedItems.map((item) => ({ quantity: item.quantity })),
    deliveryMode,
    { island, remote, rates },
  );
  const total = subtotal + shippingFee;

  const timestamp = now();
  const order = {
    customer,
    items: storedItems.map(({ productId, quantity, selectedOption, customName }) => ({
      productId,
      quantity,
      selectedOption,
      customName,
    })),
    subtotal,
    shippingFee,
    deliveryMode,
    total,
    status: "pending_payment" satisfies OrderStatus,
    slip: {
      imageUrl: "",
      status: "none",
    },
    trackingNumber: "",
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  const result = await orders.insertOne(order);
  publishOrdersUpdated();

  const created = toOrder({ _id: result.insertedId, ...order });

  if (customer.email) {
    const { pickupLocation } = await getShippingSettings();
    notifyEmail(
      orderConfirmedEmail(customer.name, customer.email, {
        items: storedItems.map((si) => {
          const product = products.find((p) => p._id.equals(si.productId));
          const name = typeof product?.name === "object" ? ((product.name as { th?: string }).th ?? "") : String(product?.name ?? "");
          return { name, qty: si.quantity, option: si.selectedOption || undefined, customName: si.customName || undefined };
        }),
        deliveryMode,
        customerPhone: customer.phone,
        pickupLocation: pickupLocation || undefined,
      }),
    );
  }

  return created;
}

export async function listOrders(filters?: {
  customerPhone?: string;
  status?: OrderStatus;
  excludeStatuses?: OrderStatus[];
  page?: number;
  limit?: number;
  search?: string;
  sortOrder?: "asc" | "desc";
  deliveryMode?: "delivery" | "pickup";
}): Promise<{ orders: Order[]; total: number }> {
  const orders = await getOrdersCollection();
  const query: Document = {};

  if (filters?.customerPhone) {
    query["customer.phone"] = filters.customerPhone;
  }

  if (filters?.status) {
    query.status = filters.status;
  } else if (filters?.excludeStatuses?.length) {
    query.status = { $nin: filters.excludeStatuses };
  }

  if (filters?.deliveryMode) {
    query.deliveryMode = filters.deliveryMode;
  }

  if (filters?.search?.trim()) {
    const s = filters.search.trim();
    const orClauses: Document[] = [
      { "customer.name": { $regex: s, $options: "i" } },
      { "customer.phone": { $regex: s } },
      { "customer.email": { $regex: s, $options: "i" } },
      { "customer.address": { $regex: s, $options: "i" } },
      { trackingNumber: { $regex: s, $options: "i" } },
    ];
    try { orClauses.push({ _id: assertObjectId(s) }); } catch { /* not a valid ObjectId */ }
    query.$or = orClauses;
  }

  const sortDir = filters?.sortOrder === "asc" ? 1 : -1;
  const limit = Math.min(filters?.limit ?? 50, 200);
  const page = Math.max(filters?.page ?? 1, 1);
  const skip = (page - 1) * limit;

  const [results, total] = await Promise.all([
    orders
      .aggregate([
        { $match: query },
        { $sort: { createdAt: sortDir } },
        { $skip: skip },
        { $limit: limit },
        ...ORDERS_LOOKUP_PIPELINE,
      ])
      .toArray(),
    orders.countDocuments(query),
  ]);

  return { orders: results.map(toOrder), total };
}

export async function getOrdersSummary(deliveryMode?: "delivery" | "pickup") {
  const col = await getOrdersCollection();
  const baseMatch: Document = deliveryMode ? { deliveryMode } : {};
  const [statusGroups, revenueResult, pendingCount] = await Promise.all([
    col
      .aggregate([
        ...(deliveryMode ? [{ $match: baseMatch }] : []),
        { $group: { _id: { status: "$status", deliveryMode: "$deliveryMode" }, count: { $sum: 1 } } },
      ])
      .toArray(),
    col
      .aggregate([
        { $match: { ...baseMatch, status: { $in: ["packing", "shipped", "completed"] } } },
        { $group: { _id: null, revenue: { $sum: "$total" } } },
      ])
      .toArray(),
    col.countDocuments({ ...baseMatch, $or: [{ status: "payment_review" }, { "slip.status": "pending" }] }),
  ]);

  const byStatus: Record<string, number> = {};
  let shippedDelivery = 0;
  let shippedPickup = 0;
  for (const g of statusGroups) {
    const { status, deliveryMode } = g._id as { status: string; deliveryMode: string };
    byStatus[status] = (byStatus[status] ?? 0) + (g.count as number);
    if (status === "shipped") {
      if (deliveryMode === "pickup") shippedPickup += g.count as number;
      else shippedDelivery += g.count as number;
    }
  }

  return {
    totalOrders: Object.values(byStatus).reduce((s, c) => s + c, 0),
    byStatus,
    shippedDelivery,
    shippedPickup,
    pendingReview: pendingCount,
    totalRevenue: (revenueResult[0] as { revenue?: number } | undefined)?.revenue ?? 0,
  };
}

export async function countPendingOrders() {
  const orders = await getOrdersCollection();

  return orders.countDocuments({
    $or: [{ status: "payment_review" }, { "slip.status": "pending" }],
  });
}

export async function getOrder(orderId: string) {
  const orders = await getOrdersCollection();
  const results = await orders
    .aggregate([
      { $match: { _id: assertObjectId(orderId) } },
      ...ORDERS_LOOKUP_PIPELINE,
    ])
    .toArray();

  return results[0] ? toOrder(results[0]) : null;
}

export async function attachPaymentSlip(orderId: string, input: PaymentSlipInput) {
  const orders = await getOrdersCollection();
  const order = await getOrder(orderId);

  if (!order) {
    throw new Error("order not found");
  }

  if (!["pending_payment", "payment_review"].includes(order.status)) {
    throw new Error("this order cannot accept a new payment slip");
  }

  const timestamp = now();
  const slip = {
    imageUrl: assertImageValue(input.imageUrl, "imageUrl"),
    paidAt: input.paidAt,
    note: input.note,
    status: "pending",
  };
  const previousSlip = order.slip.imageUrl?.trim()
    ? {
        ...order.slip,
        replacedAt: timestamp,
      }
    : null;
  const updateOp: Document = {
    $set: {
      slip,
      status: "payment_review",
      updatedAt: timestamp,
    },
  };

  if (previousSlip) {
    updateOp.$push = { slipHistory: previousSlip };
  }

  const result = await orders.findOneAndUpdate(
    { _id: assertObjectId(orderId) },
    updateOp,
    { returnDocument: "after" },
  );

  if (!result) {
    throw new Error("order not found");
  }

  publishOrdersUpdated();

  const updated = toOrder(result);
  if (updated.customer.email) {
    notifyEmail(slipReceivedEmail(updated.customer.name, updated.customer.email, updated.customer.phone));
  }

  return updated;
}

export async function reviewPaymentSlip(orderId: string, input: ReviewSlipInput) {
  const db = await getDb();
  const orders = await getOrdersCollection();
  const order = await getOrder(orderId);

  if (!order) {
    throw new Error("order not found");
  }

  if (order.slip.status !== "pending") {
    throw new Error("slip is not pending review");
  }

  const timestamp = now();
  const result = await orders.findOneAndUpdate(
    { _id: assertObjectId(orderId) },
    {
      $set: {
        "slip.status": input.approved ? "approved" : "rejected",
        "slip.reviewedBy": assertText(input.reviewedBy, "reviewedBy"),
        "slip.reviewedAt": timestamp,
        "slip.reviewNote": input.note,
        status: input.approved ? "packing" : "pending_payment",
        updatedAt: timestamp,
      },
    },
    { returnDocument: "after" },
  );

  if (!result) {
    throw new Error("order not found");
  }

  if (input.approved) {
    const stockResults = await Promise.allSettled(
      order.items.map((item) => {
        const inc: Document = { stock: -item.quantity };
        const filter: Document = { _id: assertObjectId(item.productId), stock: { $gte: item.quantity } };
        const options: Document = {};

        if (item.selectedOption) {
          inc["options.$[option].stock"] = -item.quantity;
          options.arrayFilters = [{ "option.label": item.selectedOption, "option.stock": { $exists: true, $gte: item.quantity } }];
        }

        return db.collection("products").updateOne(filter, { $inc: inc, $set: { updatedAt: timestamp } }, options);
      }),
    );

    for (const r of stockResults) {
      if (r.status === "rejected") {
        console.error("[STOCK_UPDATE_ERROR]", r.reason instanceof Error ? r.reason.message : r.reason);
      }
    }
  }

  publishOrdersUpdated();

  if (!input.approved && order.customer.email) {
    notifyEmail(slipRejectedEmail(order.customer.name, input.note, order.customer.email, order.customer.phone));
  }

  return toOrder(result);
}

async function updateOrderStatus(orderId: string, status?: OrderStatus) {
  const orders = await getOrdersCollection();
  const timestamp = now();
  const updateFields: Document = { status, updatedAt: timestamp };

  if (status === "payment_review") {
    updateFields["slip.status"] = "pending";
  }

  const updateOp: Document = { $set: updateFields };
  if (status === "payment_review") {
    updateOp["$unset"] = { "slip.reviewedBy": "", "slip.reviewedAt": "", "slip.reviewNote": "" };
  }

  const result = await orders.findOneAndUpdate(
    { _id: assertObjectId(orderId) },
    updateOp,
    { returnDocument: "after" },
  );

  if (!result) {
    throw new Error("order not found");
  }

  return toOrder(result);
}

/** Transitions an order to a new status, notifies the customer by email when relevant, and broadcasts the update. */
export async function transitionOrderStatus(orderId: string, status: OrderStatus) {
  if (status === "payment_review") {
    throw new Error("ไม่สามารถย้อนกลับไปขอสลิปใหม่ได้ — หากมีปัญหาให้ยกเลิกออเดอร์แทน");
  }

  const updated = await updateOrderStatus(orderId, status);

  // Pickup orders have no tracking number — tell the customer it's ready to collect.
  if (status === "shipped" && updated.deliveryMode === "pickup") {
    const { pickupLocation, pickupHours } = await getShippingSettings();
    notifyEmail(
      pickupReadyEmail(updated.customer.name, updated.customer.email, updated.customer.phone, pickupLocation || undefined, pickupHours || undefined),
    );
  }

  if (status === "completed" && updated.customer.email) {
    notifyEmail(orderCompletedEmail(updated.customer.name, updated.customer.email, updated.customer.phone));
  }

  publishOrdersUpdated();
  return updated;
}

async function updateTrackingNumber(orderId: string, trackingNumber: string) {
  const orders = await getOrdersCollection();
  const result = await orders.findOneAndUpdate(
    { _id: assertObjectId(orderId) },
    { $set: { trackingNumber: trackingNumber.trim(), updatedAt: now() } },
    { returnDocument: "after" },
  );

  if (!result) {
    throw new Error("order not found");
  }

  return toOrder(result);
}

/** Sets the order's tracking number, emails the customer, and broadcasts the update. */
export async function setOrderTrackingNumber(orderId: string, trackingNumber: string) {
  const updated = await updateTrackingNumber(orderId, trackingNumber);

  notifyEmail(
    trackingNumberEmail(
      updated.customer.name,
      updated.trackingNumber ?? trackingNumber,
      updated.customer.email,
      updated.customer.phone,
    ),
  );

  publishOrdersUpdated();
  return updated;
}

export async function cancelOrder(orderId: string, reason: string, cancelledBy: string) {
  const db = await getDb();
  const orders = await getOrdersCollection();
  const order = await getOrder(orderId);

  if (!order) {
    throw new Error("order not found");
  }

  const timestamp = now();
  const result = await orders.findOneAndUpdate(
    { _id: assertObjectId(orderId) },
    {
      $set: {
        status: "cancelled" satisfies OrderStatus,
        cancellationReason: assertText(reason, "reason"),
        cancelledBy: assertText(cancelledBy, "cancelledBy"),
        cancelledAt: timestamp,
        updatedAt: timestamp,
      },
    },
    { returnDocument: "after" },
  );

  if (!result) {
    throw new Error("order not found");
  }

  // คืน stock เฉพาะ order ที่อนุมัติสลิปแล้ว (stock เคยถูกลดไป)
  if (order.slip.status === "approved") {
    const refundResults = await Promise.allSettled(
      order.items.map((item) => {
        const inc: Document = { stock: item.quantity };
        const options: Document = {};

        if (item.selectedOption) {
          inc["options.$[option].stock"] = item.quantity;
          options.arrayFilters = [{ "option.label": item.selectedOption, "option.stock": { $exists: true } }];
        }

        return db.collection("products").updateOne(
          { _id: assertObjectId(item.productId) },
          { $inc: inc, $set: { updatedAt: timestamp } },
          options,
        );
      }),
    );

    for (const r of refundResults) {
      if (r.status === "rejected") {
        console.error("[STOCK_REFUND_ERROR]", r.reason instanceof Error ? r.reason.message : r.reason);
      }
    }
  }

  const cancelled = toOrder(result);
  notifyEmail(
    orderCancelledEmail(
      cancelled.customer.name,
      cancelled.cancellationReason ?? reason,
      cancelled.customer.email,
      cancelled.customer.phone,
    ),
  );

  publishOrdersUpdated();
  return cancelled;
}

export async function resendOrderEmail(orderId: string) {
  const order = await getOrder(orderId);
  if (!order) throw new Error("order not found");
  if (!order.customer.email) throw new Error("ลูกค้าไม่มีอีเมล");

  const { pickupLocation, pickupHours } = await getShippingSettings();
  const isPickup = order.deliveryMode === "pickup";

  if (order.slip.status === "approved" && order.status === "packing") {
    await sendEmail(slipApprovedEmail(order.customer.name, order.customer.email, order.customer.phone));
  } else if (order.status === "shipped" && isPickup) {
    await sendEmail(pickupReadyEmail(order.customer.name, order.customer.email, order.customer.phone, pickupLocation || undefined, pickupHours || undefined));
  } else if (order.status === "shipped" && order.trackingNumber) {
    await sendEmail(trackingNumberEmail(order.customer.name, order.trackingNumber, order.customer.email, order.customer.phone));
  } else if (order.status === "cancelled") {
    await sendEmail(orderCancelledEmail(order.customer.name, order.cancellationReason ?? "", order.customer.email, order.customer.phone));
  } else {
    throw new Error("ไม่มี email ที่เหมาะสมสำหรับสถานะนี้");
  }
}

export async function addAdminNote(
  orderId: string,
  note: { text: string; by: string; action: string },
) {
  const orders = await getOrdersCollection();
  const entry = {
    text: assertText(note.text, "text"),
    by: assertText(note.by, "by"),
    action: assertText(note.action, "action"),
    at: now(),
  };

  const result = await orders.findOneAndUpdate(
    { _id: assertObjectId(orderId) },
    {
      $push: { adminNotes: entry } as Document,
      $set: { updatedAt: entry.at },
    },
    { returnDocument: "after" },
  );

  if (!result) {
    throw new Error("order not found");
  }

  return toOrder(result);
}

export function isOrderStatus(value: string): value is OrderStatus {
  return [
    "pending_payment",
    "payment_review",
    "paid",
    "packing",
    "shipped",
    "completed",
    "cancelled",
  ].includes(value);
}
