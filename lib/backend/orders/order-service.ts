import { type Document } from "mongodb";
import { getDb } from "@/lib/backend/mongodb";
import { createOrderSchema, imageUrlSchema, parseOrThrow } from "@/lib/validation/schemas";
import { assertText, assertObjectId, now, normalizeOptions } from "@/lib/backend/validation-utils";
import { publishOrdersUpdated } from "@/lib/backend/admin-realtime";
import { calcShippingFee } from "@/lib/config/shipping";
import { isRemoteArea } from "@/lib/data/remote-areas";
import { isIslandArea } from "@/lib/data/island-areas";
import { getShippingSettings } from "@/lib/backend/settings/settings-service";
import { sendEmail, trackingNumberEmail, pickupReadyEmail, orderCancelledEmail } from "@/lib/backend/email-service";
import { getOrdersCollection } from "./order-module";
import type {
  CreateOrderInput,
  Order,
  OrderItem,
  OrderStatus,
  PaymentSlipInput,
  PublicOrder,
  ReviewSlipInput,
} from "@/lib/backend/types";

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

function toOrder(doc: Document): Order {
  const products: Document[] = doc._products ?? [];
  const items: OrderItem[] = (doc.items as Document[]).map((item) => {
    const product = products.find((p) => p._id.equals(item.productId));
    return {
      productId: item.productId.toString(),
      name: product?.name && typeof product.name === "object"
        ? product.name as import("@/lib/backend/types").LocalizedText
        : { th: typeof product?.name === "string" ? product.name : "สินค้าถูกลบ" },
      price: product?.price ?? 0,
      quantity: item.quantity,
      subtotal: (product?.price ?? 0) * item.quantity,
      selectedOption: typeof item.selectedOption === "string" && item.selectedOption.trim()
        ? item.selectedOption.trim()
        : undefined,
    };
  });
  const subtotal = Number(doc.subtotal ?? items.reduce((sum, item) => sum + item.subtotal, 0));
  const shippingFee = Number(doc.shippingFee ?? 0);

  return {
    id: doc._id.toString(),
    customer: doc.customer,
    items,
    subtotal,
    shippingFee,
    deliveryMode: doc.deliveryMode === "pickup" ? "pickup" : "delivery",
    total: doc.total,
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

    if (productOptions.length > 0 && !matchedOption) {
      throw new Error(`please select a valid option: ${product.name}`);
    }

    const optionStock = matchedOption?.stock ?? product.stock;
    if (matchedOption && item.quantity > optionStock) {
      throw new Error(`not enough option stock: ${matchedOption.label}`);
    }

    return {
      productId: product._id,
      quantity: item.quantity,
      selectedOption,
      _price: product.price,
      _shippingFirstItem: Number(product.shippingFirstItem ?? 0),
      _shippingAdditionalItem: Number(product.shippingAdditionalItem ?? 0),
      _remoteShippingFirstItem: Number(product.remoteShippingFirstItem ?? 0),
      _remoteShippingAdditionalItem: Number(product.remoteShippingAdditionalItem ?? 0),
      _islandShippingFirstItem: Number(product.islandShippingFirstItem ?? 0),
      _islandShippingAdditionalItem: Number(product.islandShippingAdditionalItem ?? 0),
    };
  });

  const subtotal = storedItems.reduce((sum, item) => sum + item._price * item.quantity, 0);
  const deliveryMode = parsed.deliveryMode ?? "delivery";
  const rates = await getShippingSettings();
  const postalCode = parsed.customer.postalCode;
  const island = deliveryMode === "delivery" && isIslandArea(postalCode);
  const remote = deliveryMode === "delivery" && !island && isRemoteArea(postalCode);
  const shippingFee = calcShippingFee(
    storedItems.map((item) => ({
      quantity: item.quantity,
      shippingFirstItem: item._shippingFirstItem,
      shippingAdditionalItem: item._shippingAdditionalItem,
      remoteShippingFirstItem: item._remoteShippingFirstItem,
      remoteShippingAdditionalItem: item._remoteShippingAdditionalItem,
      islandShippingFirstItem: item._islandShippingFirstItem,
      islandShippingAdditionalItem: item._islandShippingAdditionalItem,
    })),
    deliveryMode,
    { island, remote, rates },
  );
  const total = subtotal + shippingFee;

  const timestamp = now();
  const order = {
    customer,
    items: storedItems.map(({ productId, quantity, selectedOption }) => ({
      productId,
      quantity,
      selectedOption,
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

  return toOrder({ _id: result.insertedId, ...order });
}

export async function listOrders(filters?: {
  customerPhone?: string;
  status?: OrderStatus;
  excludeStatuses?: OrderStatus[];
}) {
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

  const results = await orders
    .aggregate([
      { $match: query },
      { $sort: { createdAt: -1 } },
      ...ORDERS_LOOKUP_PIPELINE,
    ])
    .toArray();

  return results.map(toOrder);
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
  return toOrder(result);
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
    await Promise.all(
      order.items.map((item) => {
        const inc: Document = { stock: -item.quantity };
        const options: Document = {};

        if (item.selectedOption) {
          inc["options.$[option].stock"] = -item.quantity;
          options.arrayFilters = [{ "option.label": item.selectedOption, "option.stock": { $exists: true } }];
        }

        return db.collection("products").updateOne(
          { _id: assertObjectId(item.productId) },
          { $inc: inc, $set: { updatedAt: timestamp } },
          options,
        );
      }),
    );
  }

  publishOrdersUpdated();
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
    notifyEmail(
      pickupReadyEmail(updated.customer.name, updated.customer.email, updated.customer.phone),
    );
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
    await Promise.all(
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
