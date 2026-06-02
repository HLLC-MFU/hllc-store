import "server-only";

import { ObjectId, type Document } from "mongodb";
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
  if (typeof username !== "string" || !username.trim()) {
    throw new Error("username is required");
  }

  return username.trim().toLowerCase();
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

export async function registerAdminPassword(input: { username?: unknown; password?: unknown }) {
  await ensureDefaultSuperAdmin();
  const username = cleanUsername(input.username);
  const password = typeof input.password === "string" ? input.password : "";

  if (password.length < 8) {
    throw new Error("password must be at least 8 characters");
  }

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

export async function listAuditLogs() {
  const db = await getDb();
  const docs = await db.collection("admin_audit_logs").find().sort({ createdAt: -1 }).limit(100).toArray();

  return docs.map((doc) => ({
    id: doc._id.toString(),
    actorUsername: doc.actorUsername,
    actorRole: doc.actorRole,
    action: doc.action,
    metadata: doc.metadata ?? {},
    createdAt: doc.createdAt,
  }));
}
