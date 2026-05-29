import { getDb } from "@/lib/backend/mongodb";

export const PRODUCT_COLLECTION = "products";

export async function getProductCollection() {
  const db = await getDb();
  const collection = db.collection(PRODUCT_COLLECTION);

  await collection.createIndex({ slug: 1 }, { unique: true });
  await collection.createIndex({ active: 1, createdAt: -1 });

  return collection;
}
