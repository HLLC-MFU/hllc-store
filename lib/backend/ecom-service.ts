import { ObjectId, type Document } from "mongodb";
import { getDb } from "./mongodb";
import { z } from "zod";
import { createOrderSchema, imageUrlSchema, parseOrThrow } from "@/lib/schemas";
import type {
  CreateOrderInput,
  CreateProductInput,
  Order,
  OrderItem,
  OrderStatus,
  PaymentSlipInput,
  Product,
  ReviewSlipInput,
  LocalizedText,
} from "./types";

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
          const [label = "", imageUrl = ""] = item.split("|").map((part) => part.trim());
          return label ? { label, imageUrl } : null;
        }

        if (item && typeof item === "object") {
          const option = item as { label?: unknown; name?: unknown; value?: unknown; imageUrl?: unknown; image?: unknown };
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

          return label ? { label, imageUrl } : null;
        }

        return null;
      })
      .filter((item): item is { label: string; imageUrl: string } => Boolean(item));
  }

  if (typeof value === "string") {
    return value
      .split(/\r?\n|,/)
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => {
        const [label = "", imageUrl = ""] = item.split("|").map((part) => part.trim());
        return { label, imageUrl };
      });
  }

  return [];
}

function createSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function toProduct(doc: Document): Product {
  const imageUrls: string[] = Array.isArray(doc.imageUrls)
    ? doc.imageUrls.filter((u: unknown) => typeof u === "string" && u)
    : [];

  let nameObj: LocalizedText = { th: "" };
  if (doc.name && typeof doc.name === "object") {
    nameObj = {
      th: doc.name.th || "",
      en: doc.name.en || undefined,
    };
  } else {
    nameObj = {
      th: typeof doc.name === "string" ? doc.name : "",
      en: typeof doc.nameEn === "string" ? doc.nameEn : undefined,
    };
  }

  let descObj: LocalizedText = { th: "" };
  if (doc.description && typeof doc.description === "object") {
    descObj = {
      th: doc.description.th || "",
      en: doc.description.en || undefined,
    };
  } else {
    descObj = {
      th: typeof doc.description === "string" ? doc.description : "",
      en: typeof doc.descriptionEn === "string" ? doc.descriptionEn : undefined,
    };
  }

  return {
    id: doc._id.toString(),
    name: nameObj,
    slug: doc.slug,
    description: descObj,
    price: doc.price,
    stock: doc.stock,
    shippingFirstItem: Number(doc.shippingFirstItem ?? doc.shipping ?? 0),
    shippingAdditionalItem: Number(doc.shippingAdditionalItem ?? 0),
    category: doc.category ?? "",
    options: normalizeOptions(doc.options),
    imageUrl: doc.imageUrl ?? imageUrls[0] ?? "",
    imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
    active: doc.active,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
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

export async function listProducts() {
  const db = await getDb();
  const products = await db
    .collection("products")
    .find({ active: true })
    .sort({ createdAt: -1 })
    .toArray();

  return products.map(toProduct);
}

export async function listAdminProducts() {
  const db = await getDb();
  const products = await db
    .collection("products")
    .find()
    .sort({ createdAt: -1 })
    .toArray();

  return products.map(toProduct);
}

export async function createProduct(input: CreateProductInput) {
  const db = await getDb();
  const timestamp = now();
  const nameTh = assertText(input.name.th, "name.th");
  const slug = createSlug(input.slug || nameTh);
  const product = {
    name: {
      th: nameTh,
      en: typeof input.name.en === "string" ? input.name.en.trim() : "",
    },
    slug,
    description: {
      th: typeof input.description?.th === "string" ? input.description.th.trim() : "",
      en: typeof input.description?.en === "string" ? input.description.en.trim() : "",
    },
    price: assertNumber(input.price, "price"),
    stock: assertNumber(input.stock, "stock"),
    shippingFirstItem: assertNumber(input.shippingFirstItem ?? 0, "shippingFirstItem"),
    shippingAdditionalItem: assertNumber(input.shippingAdditionalItem ?? 0, "shippingAdditionalItem"),
    category: typeof input.category === "string" ? input.category.trim() : "",
    options: normalizeOptions(input.options),
    imageUrl: typeof input.imageUrl === "string" ? input.imageUrl.trim() : "",
    imageUrls: Array.isArray(input.imageUrls) ? input.imageUrls.filter((u) => typeof u === "string" && u) : [],
    active: input.active ?? true,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  const result = await db.collection("products").insertOne(product);

  return toProduct({ _id: result.insertedId, ...product });
}

export async function getProduct(productId: string) {
  const db = await getDb();
  const product = await db
    .collection("products")
    .findOne({ _id: assertObjectId(productId), active: true });

  return product ? toProduct(product) : null;
}

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

    return {
      productId: product._id,
      quantity: item.quantity,
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
    items: storedItems.map(({ productId, quantity }) => ({ productId, quantity })),
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
      order.items.map((item) =>
        db.collection("products").updateOne(
          { _id: assertObjectId(item.productId) },
          { $inc: { stock: -item.quantity }, $set: { updatedAt: timestamp } },
        ),
      ),
    );
  }

  return toOrder(result);
}

export async function updateOrderStatus(
  orderId: string,
  status?: OrderStatus,
  trackingNumber?: string,
) {
  const db = await getDb();
  const timestamp = now();
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
      order.items.map((item) =>
        db.collection("products").updateOne(
          { _id: assertObjectId(item.productId) },
          { $inc: { stock: item.quantity }, $set: { updatedAt: timestamp } },
        ),
      ),
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

export async function updateProduct(productId: string, input: Partial<CreateProductInput>) {
  const db = await getDb();
  const timestamp = now();
  
  const updateData: Document = {};
  
  if (input.name !== undefined) {
    if (input.name.th !== undefined) {
      updateData["name.th"] = assertText(input.name.th, "name.th");
      updateData.slug = createSlug(input.slug || input.name.th);
    }
    if (input.name.en !== undefined) {
      updateData["name.en"] = typeof input.name.en === "string" ? input.name.en.trim() : "";
    }
  } else if (input.slug !== undefined) {
    updateData.slug = createSlug(input.slug);
  }
  
  if (input.description !== undefined) {
    if (input.description.th !== undefined) {
      updateData["description.th"] = typeof input.description.th === "string" ? input.description.th.trim() : "";
    }
    if (input.description.en !== undefined) {
      updateData["description.en"] = typeof input.description.en === "string" ? input.description.en.trim() : "";
    }
  }
  
  if (input.price !== undefined) {
    updateData.price = assertNumber(input.price, "price");
  }
  
  if (input.stock !== undefined) {
    updateData.stock = assertNumber(input.stock, "stock");
  }

  if (input.shippingFirstItem !== undefined) {
    updateData.shippingFirstItem = assertNumber(input.shippingFirstItem, "shippingFirstItem");
  }

  if (input.shippingAdditionalItem !== undefined) {
    updateData.shippingAdditionalItem = assertNumber(input.shippingAdditionalItem, "shippingAdditionalItem");
  }

  if (input.category !== undefined) {
    updateData.category = typeof input.category === "string" ? input.category.trim() : "";
  }

  if (input.options !== undefined) {
    updateData.options = normalizeOptions(input.options);
  }
  
  if (input.imageUrl !== undefined) {
    updateData.imageUrl = typeof input.imageUrl === "string" ? input.imageUrl.trim() : "";
  }

  if (input.imageUrls !== undefined) {
    updateData.imageUrls = Array.isArray(input.imageUrls)
      ? input.imageUrls.filter((u) => typeof u === "string" && u)
      : [];
  }
  
  if (input.active !== undefined) {
    updateData.active = input.active;
  }
  
  updateData.updatedAt = timestamp;

  const result = await db.collection("products").findOneAndUpdate(
    { _id: assertObjectId(productId) },
    { $set: updateData },
    { returnDocument: "after" }
  );

  if (!result) {
    throw new Error("product not found");
  }

  return toProduct(result);
}

export async function deleteProduct(productId: string) {
  const db = await getDb();
  const result = await db.collection("products").deleteOne({ _id: assertObjectId(productId) });
  
  if (result.deletedCount === 0) {
    throw new Error("product not found");
  }
  
  return { success: true };
}

