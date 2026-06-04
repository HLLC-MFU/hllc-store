import { ObjectId, type Document } from "mongodb";
import { z } from "zod";
import { createProductSchema, imageUrlSchema, parseOrThrow } from "@/lib/schemas";
import type { CreateProductInput, Product, LocalizedText } from "@/lib/backend/types";
import { getProductCollection } from "./product-module";

function assertText(value: unknown, field: string) {
  const result = z.string().min(1, { message: `${field} is required` }).safeParse(value);
  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? `${field} is required`);
  }
  return result.data.trim();
}

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

function assertNumber(value: unknown, field: string) {
  const result = z.coerce.number().finite().min(0, { message: `${field} must be a positive number` }).safeParse(value);
  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? `${field} must be a positive number`);
  }
  return result.data;
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

function normalizeOptions(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") {
          const [label = "", imageUrl = ""] = item.split("|").map((part) => part.trim());
          return label ? { label, imageUrl: normalizeOptionImageValue(imageUrl) } : null;
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

          return label ? { label, imageUrl: normalizeOptionImageValue(imageUrl) } : null;
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
        return { label, imageUrl: normalizeOptionImageValue(imageUrl) };
      });
  }

  return [];
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
    category: doc.category ?? "",
    options: normalizeOptions(doc.options),
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
    category: parsed.category ?? "",
    options: normalizeOptions(input.options),
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

  if (input.category !== undefined) {
    updateData.category =
      typeof input.category === "string" ? input.category.trim() : "";
  }

  if (input.options !== undefined) {
    updateData.options = normalizeOptions(input.options);
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
  const oid = assertObjectId(productId);

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
