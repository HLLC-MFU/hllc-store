import { getDb } from "../mongodb";

export const ORDERS_COLLECTION = "orders";

export async function getOrdersCollection() {
  const db = await getDb();
  const collection = db.collection(ORDERS_COLLECTION);

  await collection.createIndex({ "customer.phone": 1, createdAt: -1 });
  await collection.createIndex({ status: 1, createdAt: -1 });

  return collection;
}
