import { ObjectId, type Document } from "mongodb";
import { getDb } from "./mongodb";
import type {
  CreateOrderInput,
  CreateProductInput,
  Order,
  OrderItem,
  OrderStatus,
  PaymentSlipInput,
  Product,
  ReviewSlipInput,
} from "./types";

function assertText(value: unknown, field: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${field} is required`);
  }

  return value.trim();
}

function assertImageValue(value: unknown, field: string) {
  const imageUrl = assertText(value, field);

  if (imageUrl.startsWith("data:")) {
    if (!/^data:image\/(png|jpe?g|webp|gif);base64,/i.test(imageUrl)) {
      throw new Error(`${field} must be a PNG, JPG, WEBP, or GIF image`);
    }

    if (imageUrl.length > 3_000_000) {
      throw new Error(`${field} is too large`);
    }
  }

  return imageUrl;
}

function assertNumber(value: unknown, field: string) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue) || numberValue < 0) {
    throw new Error(`${field} must be a positive number`);
  }

  return numberValue;
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
  return {
    id: doc._id.toString(),
    name: doc.name,
    slug: doc.slug,
    description: doc.description,
    price: doc.price,
    stock: doc.stock,
    category: doc.category ?? "",
    options: normalizeOptions(doc.options),
    imageUrl: doc.imageUrl,
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
      name: product?.name ?? "สินค้าถูกลบ",
      price: product?.price ?? 0,
      quantity: item.quantity,
      subtotal: (product?.price ?? 0) * item.quantity,
    };
  });

  return {
    id: doc._id.toString(),
    customer: doc.customer,
    items,
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
  const name = assertText(input.name, "name");
  const slug = createSlug(input.slug || name);
  const product = {
    name,
    slug,
    description:
      typeof input.description === "string" ? input.description.trim() : "",
    price: assertNumber(input.price, "price"),
    stock: assertNumber(input.stock, "stock"),
    category: typeof input.category === "string" ? input.category.trim() : "",
    options: normalizeOptions(input.options),
    imageUrl: typeof input.imageUrl === "string" ? input.imageUrl.trim() : "",
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
  const customer = {
    name: assertText(input.customer?.name, "customer.name"),
    phone: assertText(input.customer?.phone, "customer.phone"),
    address: assertText(input.customer?.address, "customer.address"),
  };

  if (!Array.isArray(input.items) || input.items.length === 0) {
    throw new Error("items is required");
  }

  const requestedItems = input.items.map((item) => ({
    productId: assertText(item.productId, "items.productId"),
    quantity: Number(item.quantity),
    selectedOption:
      typeof item.selectedOption === "string" ? item.selectedOption.trim() : "",
  }));

  requestedItems.forEach((item) => {
    if (!Number.isInteger(item.quantity) || item.quantity < 1) {
      throw new Error("items.quantity must be a positive integer");
    }
  });

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
    };
  });

  const total = storedItems.reduce((sum, item) => sum + item._price * item.quantity, 0);

  const timestamp = now();
  const order = {
    customer,
    items: storedItems.map(({ productId, quantity }) => ({ productId, quantity })),
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
    amount:
      typeof input.amount === "number" ? assertNumber(input.amount, "amount") : 0,
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
  
  const updateData: any = {};
  
  if (input.name !== undefined) {
    updateData.name = assertText(input.name, "name");
    updateData.slug = createSlug(input.slug || input.name);
  } else if (input.slug !== undefined) {
    updateData.slug = createSlug(input.slug);
  }
  
  if (input.description !== undefined) {
    updateData.description = typeof input.description === "string" ? input.description.trim() : "";
  }
  
  if (input.price !== undefined) {
    updateData.price = assertNumber(input.price, "price");
  }
  
  if (input.stock !== undefined) {
    updateData.stock = assertNumber(input.stock, "stock");
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

