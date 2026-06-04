import { ObjectId, type Document } from "mongodb";
import { getDb } from "./mongodb";
import { z } from "zod";
import { createOrderSchema, imageUrlSchema, parseOrThrow } from "@/lib/validation/schemas";
import type {
  CreateOrderInput,
  Order,
  OrderItem,
  OrderStatus,
  PaymentSlipInput,
  PublicOrder,
  ReviewSlipInput,
} from "./types";

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
    slip: { status: order.slip.status, imageUrl: order.slip.imageUrl },
    trackingNumber: order.trackingNumber,
    cancellationReason: order.cancellationReason,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

function assertText(value: unknown, field: string) {
  const result = z.string().min(1, { message: `${field} is required` }).safeParse(value);
  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? `${field} is required`);
  }
  return result.data.trim();
}

function assertImageValue(value: unknown, field: string) {
  const result = imageUrlSchema.safeParse(value);
  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? `${field} is invalid`);
  }
  return result.data;
}

function assertNumber(value: unknown, field: string) {
  const result = z.coerce.number().finite().min(0, { message: `${field} must be a positive number` }).safeParse(value);
  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? `${field} must be a positive number`);
  }
  return result.data;
}

function normalizeOptionStock(value: unknown) {
  if (value === undefined || value === null || value === "") return undefined;
  return assertNumber(value, "option.stock");
}

function assertObjectId(id: string) {
  if (!ObjectId.isValid(id)) {
    throw new Error("invalid id");
  }

  return new ObjectId(id);
}

function now() {
  return new Date().toISOString();
}

function normalizeOptions(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") {
          const [label = "", imageUrl = "", stock = ""] = item.split("|").map((part) => part.trim());
          const optionStock = normalizeOptionStock(stock);
          return label ? { label, imageUrl, ...(optionStock !== undefined ? { stock: optionStock } : {}) } : null;
        }

        if (item && typeof item === "object") {
          const option = item as { label?: unknown; name?: unknown; value?: unknown; imageUrl?: unknown; image?: unknown; stock?: unknown };
          const label =
            typeof option.label === "string"
              ? option.label.trim()
              : typeof option.name === "string"
                ? option.name.trim()
                : typeof option.value === "string"
                  ? option.value.trim()
                  : "";
          const imageUrl =
            typeof option.imageUrl === "string"
              ? option.imageUrl.trim()
              : typeof option.image === "string"
                ? option.image.trim()
                : "";

          const optionStock = normalizeOptionStock(option.stock);

          return label ? { label, imageUrl, ...(optionStock !== undefined ? { stock: optionStock } : {}) } : null;
        }

        return null;
      })
      .filter((item): item is { label: string; imageUrl: string; stock?: number } => Boolean(item));
  }

  if (typeof value === "string") {
    return value
      .split(/\r?\n|,/)
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => {
        const [label = "", imageUrl = "", stock = ""] = item.split("|").map((part) => part.trim());
        const optionStock = normalizeOptionStock(stock);
        return { label, imageUrl, ...(optionStock !== undefined ? { stock: optionStock } : {}) };
      });
  }

  return [];
}

function toOrder(doc: Document): Order {
  const products: Document[] = doc._products ?? [];
  const items: OrderItem[] = (doc.items as Document[]).map((item) => {
    const product = products.find((p) => p._id.equals(item.productId));
    return {
      productId: item.productId.toString(),
      name: product?.name && typeof product.name === "object"
        ? product.name as import("./types").LocalizedText
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
      _shippingFirstItem: Number(product.shippingFirstItem ?? product.shipping ?? 0),
      _shippingAdditionalItem: Number(product.shippingAdditionalItem ?? 0),
    };
  });

  const subtotal = storedItems.reduce((sum, item) => sum + item._price * item.quantity, 0);
  const deliveryMode = parsed.deliveryMode ?? "delivery";
  const shippingFee = deliveryMode === "pickup"
    ? 0
    : storedItems.reduce(
      (sum, item) =>
        sum + item._shippingFirstItem + item._shippingAdditionalItem * Math.max(0, item.quantity - 1),
      0,
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

  const result = await db.collection("orders").insertOne(order);

  return toOrder({ _id: result.insertedId, ...order });
}

export async function listOrders(filters?: {
  customerPhone?: string;
  status?: OrderStatus;
}) {
  const db = await getDb();
  const query: Document = {};

  if (filters?.customerPhone) {
    query["customer.phone"] = filters.customerPhone;
  }

  if (filters?.status) {
    query.status = filters.status;
  }

  const orders = await db
    .collection("orders")
    .aggregate([
      { $match: query },
      { $sort: { createdAt: -1 } },
      ...ORDERS_LOOKUP_PIPELINE,
    ])
    .toArray();

  return orders.map(toOrder);
}

export async function countPendingOrders() {
  const db = await getDb();

  return db.collection("orders").countDocuments({
    $or: [{ status: "payment_review" }, { "slip.status": "pending" }],
  });
}

export async function getOrder(orderId: string) {
  const db = await getDb();
  const results = await db
    .collection("orders")
    .aggregate([
      { $match: { _id: assertObjectId(orderId) } },
      ...ORDERS_LOOKUP_PIPELINE,
    ])
    .toArray();

  return results[0] ? toOrder(results[0]) : null;
}

export async function attachPaymentSlip(orderId: string, input: PaymentSlipInput) {
  const db = await getDb();
  const timestamp = now();
  const slip = {
    imageUrl: assertImageValue(input.imageUrl, "imageUrl"),
    paidAt: input.paidAt,
    note: input.note,
    status: "pending",
  };

  const result = await db.collection("orders").findOneAndUpdate(
    { _id: assertObjectId(orderId) },
    {
      $set: {
        slip,
        status: "payment_review",
        updatedAt: timestamp,
      },
    },
    { returnDocument: "after" },
  );

  if (!result) {
    throw new Error("order not found");
  }

  return toOrder(result);
}

export async function reviewPaymentSlip(orderId: string, input: ReviewSlipInput) {
  const db = await getDb();
  const order = await getOrder(orderId);

  if (!order) {
    throw new Error("order not found");
  }

  if (order.slip.status !== "pending") {
    throw new Error("slip is not pending review");
  }

  const timestamp = now();
  const result = await db.collection("orders").findOneAndUpdate(
    { _id: assertObjectId(orderId) },
    {
      $set: {
        "slip.status": input.approved ? "approved" : "rejected",
        "slip.reviewedBy": assertText(input.reviewedBy, "reviewedBy"),
        "slip.reviewedAt": timestamp,
        "slip.reviewNote": input.note,
        status: input.approved ? "packing" : "cancelled",
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

  return toOrder(result);
}

export async function updateOrderStatus(
  orderId: string,
  status?: OrderStatus,
  _trackingNumber?: string,
) {
  const db = await getDb();
  const timestamp = now();
  void _trackingNumber;
  const updateFields: Document = { status, updatedAt: timestamp };

  if (status === "payment_review") {
    updateFields["slip.status"] = "pending";
  }

  const updateOp: Document = { $set: updateFields };
  if (status === "payment_review") {
    updateOp["$unset"] = { "slip.reviewedBy": "", "slip.reviewedAt": "", "slip.reviewNote": "" };
  }

  const result = await db.collection("orders").findOneAndUpdate(
    { _id: assertObjectId(orderId) },
    updateOp,
    { returnDocument: "after" },
  );

  if (!result) {
    throw new Error("order not found");
  }

  return toOrder(result);
}

export async function updateTrackingNumber(orderId: string, trackingNumber: string) {
  const db = await getDb();
  const result = await db.collection("orders").findOneAndUpdate(
    { _id: assertObjectId(orderId) },
    { $set: { trackingNumber: trackingNumber.trim(), updatedAt: now() } },
    { returnDocument: "after" },
  );

  if (!result) {
    throw new Error("order not found");
  }

  return toOrder(result);
}

export async function cancelOrder(orderId: string, reason: string, cancelledBy: string) {
  const db = await getDb();
  const order = await getOrder(orderId);

  if (!order) {
    throw new Error("order not found");
  }

  const timestamp = now();
  const result = await db.collection("orders").findOneAndUpdate(
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

  return toOrder(result);
}

export async function addAdminNote(
  orderId: string,
  note: { text: string; by: string; action: string },
) {
  const db = await getDb();
  const entry = {
    text: assertText(note.text, "text"),
    by: assertText(note.by, "by"),
    action: assertText(note.action, "action"),
    at: now(),
  };

  const result = await db.collection("orders").findOneAndUpdate(
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

