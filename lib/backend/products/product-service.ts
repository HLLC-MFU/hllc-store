import { ObjectId, type Document } from "mongodb";
import type { CreateProductInput, Product } from "@/lib/backend/types";
import { getProductCollection } from "./product-module";

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

function assertPercent(value: unknown, field: string) {
  const numberValue = assertNumber(value ?? 0, field);

  if (numberValue > 100) {
    throw new Error(`${field} must be between 0 and 100`);
  }

  return numberValue;
}

function assertObjectId(id: string) {
  if (!ObjectId.isValid(id)) {
    throw new Error("invalid product id");
  }

  return new ObjectId(id);
}

function createSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function now() {
  return new Date().toISOString();
}

export function toProduct(doc: Document): Product {
  return {
    id: doc._id.toString(),
    name: doc.name,
    slug: doc.slug,
    description: doc.description ?? "",
    price: Number(doc.price ?? 0),
    stock: Number(doc.stock ?? 0),
    discount: Number(doc.discount ?? 0),
    category: doc.category ?? "",
    imageUrl: doc.imageUrl ?? "",
    active: doc.active ?? true,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function buildCreateProduct(input: CreateProductInput) {
  const timestamp = now();
  const name = assertText(input.name, "name");

  return {
    name,
    slug: createSlug(input.slug || name),
    description:
      typeof input.description === "string" ? input.description.trim() : "",
    price: assertNumber(input.price, "price"),
    stock: assertNumber(input.stock, "stock"),
    discount: assertPercent(input.discount, "discount"),
    category: typeof input.category === "string" ? input.category.trim() : "",
    imageUrl: typeof input.imageUrl === "string" ? input.imageUrl.trim() : "",
    active: input.active ?? true,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export async function listStoreProducts() {
  const collection = await getProductCollection();
  const products = await collection
    .find({ active: true })
    .sort({ createdAt: -1 })
    .toArray();

  return products.map(toProduct);
}

export async function listAdminProducts() {
  const collection = await getProductCollection();
  const products = await collection.find().sort({ createdAt: -1 }).toArray();

  return products.map(toProduct);
}

export async function createProduct(input: CreateProductInput) {
  const collection = await getProductCollection();
  const product = buildCreateProduct(input);
  const result = await collection.insertOne(product);

  return toProduct({ _id: result.insertedId, ...product });
}

export async function updateProduct(
  productId: string,
  input: Partial<CreateProductInput>,
) {
  const collection = await getProductCollection();
  const updateData: Document = { updatedAt: now() };

  if (input.name !== undefined) {
    updateData.name = assertText(input.name, "name");
    updateData.slug = createSlug(input.slug || input.name);
  } else if (input.slug !== undefined) {
    updateData.slug = createSlug(input.slug);
  }

  if (input.description !== undefined) {
    updateData.description =
      typeof input.description === "string" ? input.description.trim() : "";
  }

  if (input.price !== undefined) {
    updateData.price = assertNumber(input.price, "price");
  }

  if (input.stock !== undefined) {
    updateData.stock = assertNumber(input.stock, "stock");
  }

  if (input.discount !== undefined) {
    updateData.discount = assertPercent(input.discount, "discount");
  }

  if (input.category !== undefined) {
    updateData.category =
      typeof input.category === "string" ? input.category.trim() : "";
  }

  if (input.imageUrl !== undefined) {
    updateData.imageUrl =
      typeof input.imageUrl === "string" ? input.imageUrl.trim() : "";
  }

  if (input.active !== undefined) {
    updateData.active = input.active;
  }

  const result = await collection.findOneAndUpdate(
    { _id: assertObjectId(productId) },
    { $set: updateData },
    { returnDocument: "after" },
  );

  if (!result) {
    throw new Error("product not found");
  }

  return toProduct(result);
}

export async function deleteProduct(productId: string) {
  const collection = await getProductCollection();
  const result = await collection.deleteOne({ _id: assertObjectId(productId) });

  if (result.deletedCount === 0) {
    throw new Error("product not found");
  }

  return { success: true };
}
