import { MongoClient, type Db } from "mongodb";

declare global {
  var mongoClientPromise: Promise<MongoClient> | undefined;
}

function getMongoUri() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is required");
  }

  return uri;
}

export async function getMongoClient() {
  if (!globalThis.mongoClientPromise) {
    globalThis.mongoClientPromise = new MongoClient(getMongoUri(), { retryWrites: false }).connect();
  }

  return globalThis.mongoClientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await getMongoClient();

  return client.db(process.env.MONGODB_DB ?? "hllc_store");
}
