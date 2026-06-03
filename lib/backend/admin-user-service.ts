import "server-only";

import { ObjectId, type Document } from "mongodb";
import { z } from "zod";
import {
  ADMIN_PASSWORD,
  ADMIN_USERNAME,
  hashAdminPassword,
  verifyAdminPassword,
  verifyScryptPassword,
  type AdminIdentity,
  type AdminRole,
} from "@/lib/backend/admin-auth";
import { getDb } from "@/lib/backend/mongodb";
import { publishSuperAdminDataChanged } from "@/lib/backend/admin-realtime";

type AdminUserDoc = {
  _id?: ObjectId;
  username: string;
  role: AdminRole;
  passwordHash?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

function now() {
  return new Date().toISOString();
}

function cleanUsername(username: unknown) {
  const result = z.string().min(1, { message: "username is required" }).safeParse(username);
  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? "username is required");
  }
  return result.data.trim().toLowerCase();
}

function cleanRole(role: unknown): AdminRole {
  return role === "superAdmin" ? "superAdmin" : "admin";
}

function publicUser(doc: AdminUserDoc & Document) {
  return {
    id: doc._id?.toString() ?? "",
    username: doc.username,
    role: doc.role,
    active: doc.active,
    registered: Boolean(doc.passwordHash),
    createdAt: doc.createdAt,
  };
}

export async function ensureDefaultSuperAdmin() {
  const db = await getDb();
  const users = db.collection<AdminUserDoc>("admin_users");
  await users.createIndex({ username: 1 }, { unique: true });
  const timestamp = now();
  const username = ADMIN_USERNAME.toLowerCase();
  const existing = await users.findOne({ username });

  await users.updateOne(
    { username },
    {
      $set: {
        role: "superAdmin",
        active: true,
        updatedAt: timestamp,
      },
      $setOnInsert: {
        username,
        passwordHash:
          process.env.ADMIN_PASSWORD_HASH ||
          hashAdminPassword(ADMIN_PASSWORD, "default-dev-admin-salt"),
        createdAt: timestamp,
      },
    },
    { upsert: true },
  );

  if (existing && !existing.passwordHash) {
    await users.updateOne(
      { username },
      {
        $set: {
          passwordHash:
            process.env.ADMIN_PASSWORD_HASH ||
            hashAdminPassword(ADMIN_PASSWORD, "default-dev-admin-salt"),
          updatedAt: timestamp,
        },
      },
    );
  }
}

export async function verifyAdminUser(usernameValue: unknown, password: string) {
  await ensureDefaultSuperAdmin();
  const username = cleanUsername(usernameValue);
  const db = await getDb();
  const user = await db.collection<AdminUserDoc>("admin_users").findOne({ username, active: true });

  if (!user?.passwordHash) return null;

  if (user.username === ADMIN_USERNAME.toLowerCase() && !process.env.ADMIN_PASSWORD_HASH) {
    if (!verifyAdminPassword(password)) return null;
  } else {
    if (!verifyScryptPassword(password, user.passwordHash)) return null;
  }

  return { username: user.username, role: user.role } satisfies AdminIdentity;
}

export async function listAdminUsers() {
  await ensureDefaultSuperAdmin();
  const db = await getDb();
  const docs = await db.collection<AdminUserDoc>("admin_users").find().sort({ createdAt: -1 }).toArray();

  return docs.map(publicUser);
}

export async function createAdminUser(input: { username?: unknown; role?: unknown }, actor: AdminIdentity) {
  const db = await getDb();
  const username = cleanUsername(input.username);
  const role = cleanRole(input.role);
  const timestamp = now();
  const doc: AdminUserDoc = {
    username,
    role,
    active: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  const result = await db.collection<AdminUserDoc>("admin_users").insertOne(doc);
  await writeAuditLog(actor, "admin_user.created", { username, role });

  return publicUser({ ...doc, _id: result.insertedId } as AdminUserDoc & Document);
}

export async function registerAdminPassword(input: { username: string; password: string }) {
  await ensureDefaultSuperAdmin();
  const username = cleanUsername(input.username);
  const password = input.password;

  const db = await getDb();
  const existing = await db.collection<AdminUserDoc>("admin_users").findOne({ username, active: true });
  if (!existing) throw new Error("user invitation not found");
  if (existing.passwordHash) throw new Error("user is already registered");

  const salt = new ObjectId().toString();
  await db.collection<AdminUserDoc>("admin_users").updateOne(
    { username },
    {
      $set: {
        passwordHash: hashAdminPassword(password, salt),
        updatedAt: now(),
      },
    },
  );
  await writeAuditLog({ username, role: existing.role }, "admin_user.registered", { username });

  return { success: true };
}

export async function writeAuditLog(
  actor: AdminIdentity,
  action: string,
  metadata: Record<string, unknown> = {},
) {
  const db = await getDb();
  await db.collection("admin_audit_logs").insertOne({
    actorUsername: actor.username,
    actorRole: actor.role,
    action,
    metadata,
    createdAt: now(),
  });
  publishSuperAdminDataChanged();
}

function actionLabel(action: string) {
  const labels: Record<string, string> = {
    "admin_user.created": "Created admin account",
    "admin_user.registered": "Registered admin account",
    "order.tracking_updated": "Updated tracking number",
    "order.cancelled": "Cancelled order",
    "order.note_added": "Added order note",
    "order.status_updated": "Updated order status",
    "product.created": "Created product",
    "product.updated": "Updated product",
    "product.deleted": "Deleted product",
    "slip.approved": "Approved payment slip",
    "slip.rejected": "Rejected payment slip",
  };

  return labels[action] ?? action;
}

function textValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function localizedName(value: unknown) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    const text = value as { th?: unknown; en?: unknown };
    return textValue(text.th) || textValue(text.en);
  }

  return "";
}

export async function listAuditLogs() {
  const db = await getDb();
  const docs = await db.collection("admin_audit_logs").find().sort({ createdAt: -1 }).limit(100).toArray();
  const productIds = docs
    .map((doc) => textValue(doc.metadata?.productId))
    .filter((id) => ObjectId.isValid(id))
    .map((id) => new ObjectId(id));
  const orderIds = docs
    .map((doc) => textValue(doc.metadata?.orderId))
    .filter((id) => ObjectId.isValid(id))
    .map((id) => new ObjectId(id));

  const [products, orders] = await Promise.all([
    productIds.length
      ? db.collection("products").find({ _id: { $in: productIds } }).project({ name: 1, slug: 1 }).toArray()
      : Promise.resolve([]),
    orderIds.length
      ? db.collection("orders").find({ _id: { $in: orderIds } }).project({ customer: 1 }).toArray()
      : Promise.resolve([]),
  ]);

  const productNames = new Map(products.map((product) => [
    product._id.toString(),
    localizedName(product.name) || textValue(product.slug),
  ]));
  const orderLabels = new Map(orders.map((order) => [
    order._id.toString(),
    `${textValue(order.customer?.name) || "Customer"} (${order._id.toString().slice(-6).toUpperCase()})`,
  ]));

  return docs.map((doc) => ({
    id: doc._id.toString(),
    actorUsername: doc.actorUsername,
    actorRole: doc.actorRole,
    action: doc.action,
    actionLabel: actionLabel(doc.action),
    metadata: doc.metadata ?? {},
    targetLabel:
      textValue(doc.metadata?.productName) ||
      textValue(doc.metadata?.customerName) ||
      (textValue(doc.metadata?.productId) ? productNames.get(textValue(doc.metadata.productId)) : "") ||
      (textValue(doc.metadata?.orderId) ? orderLabels.get(textValue(doc.metadata.orderId)) : "") ||
      textValue(doc.metadata?.username) ||
      "",
    createdAt: doc.createdAt,
  }));
}
