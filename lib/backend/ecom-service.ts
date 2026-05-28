import { ObjectId, type Document } from "mongodb";
import { getDb } from "./mongodb";
import type {
  CreateOrderInput,
  CreateProductInput,
  Order,
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
    imageUrl: doc.imageUrl,
    active: doc.active,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function toOrder(doc: Document): Order {
  return {
    id: doc._id.toString(),
    customer: doc.customer,
    items: doc.items,
    total: doc.total,
    status: doc.status,
    slip: doc.slip,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

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

  const items = requestedItems.map((item) => {
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
      productId: product._id.toString(),
      name: product.name,
      price: product.price,
      quantity: item.quantity,
      subtotal: product.price * item.quantity,
    };
  });

  const timestamp = now();
  const order = {
    customer,
    items,
    total: items.reduce((sum, item) => sum + item.subtotal, 0),
    status: "pending_payment" satisfies OrderStatus,
    slip: {
      imageUrl: "",
      status: "none",
    },
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  const result = await db.collection("orders").insertOne(order);

  await Promise.all(
    requestedItems.map((item) =>
      db
        .collection("products")
        .updateOne(
          { _id: assertObjectId(item.productId) },
          { $inc: { stock: -item.quantity }, $set: { updatedAt: timestamp } },
        ),
    ),
  );

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
    .find(query)
    .sort({ createdAt: -1 })
    .toArray();

  return orders.map(toOrder);
}

export async function getOrder(orderId: string) {
  const db = await getDb();
  const order = await db
    .collection("orders")
    .findOne({ _id: assertObjectId(orderId) });

  return order ? toOrder(order) : null;
}

export async function attachPaymentSlip(orderId: string, input: PaymentSlipInput) {
  const db = await getDb();
  const timestamp = now();
  const slip = {
    imageUrl: assertText(input.imageUrl, "imageUrl"),
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
        status: input.approved ? "paid" : "pending_payment",
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

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const db = await getDb();
  const result = await db.collection("orders").findOneAndUpdate(
    { _id: assertObjectId(orderId) },
    { $set: { status, updatedAt: now() } },
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

