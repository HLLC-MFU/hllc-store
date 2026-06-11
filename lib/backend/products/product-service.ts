import { type Document } from "mongodb";
import { createProductSchema, imageUrlSchema, parseOrThrow } from "@/lib/validation/schemas";
import type { CreateProductInput, Product, LocalizedText } from "@/lib/backend/types";
import { getProductCollection } from "./product-module";
import { assertText, assertNumber, assertObjectId, now, normalizeOptions } from "@/lib/backend/validation-utils";

function normalizeImageValue(value: unknown) {
  if (value === undefined || value === null || value === "") return "";
  const result = imageUrlSchema.safeParse(value);
  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? "imageUrl is invalid");
  }
  return result.data;
}

function normalizeOptionImageValue(value: unknown) {
  if (value === undefined || value === null || value === "") return "";
  return normalizeImageValue(value);
}

function createSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function toProduct(doc: Document): Product {
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
    price: Number(doc.price ?? 0),
    stock: Number(doc.stock ?? 0),
    shippingFirstItem: Number(doc.shippingFirstItem ?? doc.shipping ?? 0),
    shippingAdditionalItem: Number(doc.shippingAdditionalItem ?? 0),
    remoteShippingFirstItem: Number(doc.remoteShippingFirstItem ?? 0),
    remoteShippingAdditionalItem: Number(doc.remoteShippingAdditionalItem ?? 0),
    islandShippingFirstItem: Number(doc.islandShippingFirstItem ?? 0),
    islandShippingAdditionalItem: Number(doc.islandShippingAdditionalItem ?? 0),
    category: doc.category ?? "",
    options: normalizeOptions(doc.options, normalizeOptionImageValue),
    imageUrl: doc.imageUrl || imageUrls[0] || "",
    imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
    active: doc.active ?? true,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function buildCreateProduct(input: CreateProductInput) {
  const timestamp = now();
  const parsed = parseOrThrow(createProductSchema, input);
  const nameTh = parsed.name.th;
  const slug = createSlug(parsed.slug || nameTh) || `product-${Date.now()}`;

  return {
    name: {
      th: nameTh,
      en: parsed.name.en ?? "",
    },
    slug,
    description: {
      th: parsed.description?.th ?? "",
      en: parsed.description?.en ?? "",
    },
    price: parsed.price,
    stock: parsed.stock,
    shippingFirstItem: parsed.shippingFirstItem ?? 0,
    shippingAdditionalItem: parsed.shippingAdditionalItem ?? 0,
    remoteShippingFirstItem: parsed.remoteShippingFirstItem ?? 0,
    remoteShippingAdditionalItem: parsed.remoteShippingAdditionalItem ?? 0,
    islandShippingFirstItem: parsed.islandShippingFirstItem ?? 0,
    islandShippingAdditionalItem: parsed.islandShippingAdditionalItem ?? 0,
    category: parsed.category ?? "",
    options: normalizeOptions(input.options, normalizeOptionImageValue),
    imageUrl: normalizeImageValue(input.imageUrl),
    imageUrls: Array.isArray(input.imageUrls)
      ? input.imageUrls.map((url) => normalizeImageValue(url)).filter(Boolean)
      : [],
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
      updateData["description.th"] =
        typeof input.description.th === "string" ? input.description.th.trim() : "";
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

  if (input.remoteShippingFirstItem !== undefined) {
    updateData.remoteShippingFirstItem = assertNumber(input.remoteShippingFirstItem, "remoteShippingFirstItem");
  }

  if (input.remoteShippingAdditionalItem !== undefined) {
    updateData.remoteShippingAdditionalItem = assertNumber(input.remoteShippingAdditionalItem, "remoteShippingAdditionalItem");
  }

  if (input.islandShippingFirstItem !== undefined) {
    updateData.islandShippingFirstItem = assertNumber(input.islandShippingFirstItem, "islandShippingFirstItem");
  }

  if (input.islandShippingAdditionalItem !== undefined) {
    updateData.islandShippingAdditionalItem = assertNumber(input.islandShippingAdditionalItem, "islandShippingAdditionalItem");
  }

  if (input.category !== undefined) {
    updateData.category =
      typeof input.category === "string" ? input.category.trim() : "";
  }

  if (input.options !== undefined) {
    updateData.options = normalizeOptions(input.options, normalizeOptionImageValue);
  }

  if (input.imageUrl !== undefined) {
    updateData.imageUrl = normalizeImageValue(input.imageUrl);
  }

  if (input.imageUrls !== undefined) {
    updateData.imageUrls = Array.isArray(input.imageUrls)
      ? input.imageUrls.map((url) => normalizeImageValue(url)).filter(Boolean)
      : [];
  }

  if (input.active !== undefined) {
    updateData.active = input.active;
  }

  const result = await collection.findOneAndUpdate(
    { _id: assertObjectId(productId, "product id") },
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
  const oid = assertObjectId(productId, "product id");

  const result = await collection.deleteOne({ _id: oid });

  if (result.deletedCount === 0) {
    throw new Error("product not found");
  }

  const { getDb } = await import("@/lib/backend/mongodb");
  const db = await getDb();
  const timestamp = new Date().toISOString();

  await db.collection("orders").updateMany(
    {
      "items.productId": oid,
      status: { $in: ["pending_payment", "payment_review"] },
    },
    {
      $set: {
        status: "cancelled",
        cancellationReason: `สินค้า ${productId} ถูกลบออกจากระบบ`,
        cancelledBy: "system",
        cancelledAt: timestamp,
        updatedAt: timestamp,
      },
    },
  );

  return { success: true };
}
