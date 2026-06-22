import "dotenv/config";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { adminAuthRouter } from "./admin/admin-auth-router";
import { adminRegisterRouter } from "./admin/admin-register-router";
import { adminUserRouter } from "./admin/admin-user-router";
import * as orderController from "./orders/order-controller";
import * as productController from "./products/product-controller";
import * as orderService from "./orders/order-service";
import {
  adminCharmSettingsRouter,
  adminHomeContentRouter,
  adminPaymentSettingsRouter,
  adminShippingSettingsRouter,
  charmSettingsRouter,
  homeContentRouter,
  paymentSettingsRouter,
  shippingSettingsRouter,
} from "./settings/settings-router";
import { requireAdmin, requireSuperAdmin, getAdminIdentity } from "./admin-auth";
import { writeAuditLog, listAuditLogs } from "./admin-user-service";
import { subscribeAdminRealtime } from "./admin-realtime";
import { sendEmail } from "./email-service";
import { rateLimit } from "./rate-limit";
import { readLimitedJson } from "./request-utils";
import { ok, badRequest, tooManyRequests } from "./http";
import { emailPayloadSchema, parseOrThrow } from "@hllc/shared/validation/schemas";
import type { ReviewSlipInput } from "./types";
import { writeFile, readdir, unlink } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";
import sharp from "sharp";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const PORT = Number(process.env.PORT || 3001);

const app = new Hono();

app.use(
  "*",
  cors({
    origin: FRONTEND_URL,
    credentials: true,
    allowHeaders: ["Content-Type", "x-admin-csrf"],
    exposeHeaders: ["Set-Cookie"],
  }),
);

// Serve uploaded files as static
app.use("/uploads/*", serveStatic({ root: "./" }));

// Info
app.get("/api/backend", (c) =>
  c.json({ data: { name: "HLLC Store Backend", version: "rough-0.1" } }),
);

// ── Products ──────────────────────────────────────────────────────
app.get("/api/backend/products", () => productController.listStoreProducts());

app.get("/api/backend/admin/products", (c) => {
  const err = requireAdmin(c.req.raw);
  return err ?? productController.listAdminProducts();
});

app.post("/api/backend/admin/products", (c) => {
  const err = requireAdmin(c.req.raw);
  return err ?? productController.createProduct(c.req.raw);
});

app.patch("/api/backend/admin/products/:productId", async (c) => {
  const err = requireAdmin(c.req.raw);
  if (err) return err;
  const actor = getAdminIdentity(c.req.raw);
  const productId = c.req.param("productId");
  const response = await productController.updateProduct(c.req.raw, productId);
  if (actor && response.ok) await writeAuditLog(actor, "product.updated", { productId });
  return response;
});

app.delete("/api/backend/admin/products/:productId", async (c) => {
  const err = requireAdmin(c.req.raw);
  if (err) return err;
  const actor = getAdminIdentity(c.req.raw);
  const productId = c.req.param("productId");
  const response = await productController.deleteProduct(productId);
  if (actor && response.ok) await writeAuditLog(actor, "product.deleted", { productId });
  return response;
});

// ── Orders ────────────────────────────────────────────────────────
app.get("/api/backend/orders", (c) => orderController.listCustomerOrders(c.req.raw));
app.post("/api/backend/orders", (c) => orderController.createOrder(c.req.raw));
app.get("/api/backend/orders/:orderId", (c) => orderController.getPublicOrder(c.req.param("orderId")));
app.patch("/api/backend/orders/:orderId", (c) =>
  orderController.attachPaymentSlip(c.req.raw, c.req.param("orderId")),
);

app.get("/api/backend/admin/orders", (c) => orderController.listAdminOrders(c.req.raw));
app.get("/api/backend/admin/orders/pending", (c) => orderController.getPendingOrdersCount(c.req.raw));
app.get("/api/backend/admin/orders/:orderId", (c) =>
  orderController.getAdminOrder(c.req.raw, c.req.param("orderId")),
);
app.patch("/api/backend/admin/orders/:orderId", (c) =>
  orderController.updateAdminOrder(c.req.raw, c.req.param("orderId")),
);
app.post("/api/backend/admin/orders/:orderId", (c) =>
  orderController.resendOrderEmail(c.req.raw, c.req.param("orderId")),
);

app.post("/api/backend/admin/slips/:orderId", async (c) => {
  const err = requireAdmin(c.req.raw);
  if (err) return err;
  const actor = getAdminIdentity(c.req.raw);
  const orderId = c.req.param("orderId");
  try {
    const body = await readLimitedJson<ReviewSlipInput>(c.req.raw, 8_000);
    const order = await orderService.reviewPaymentSlip(orderId, body);
    if (actor) {
      await writeAuditLog(actor, body.approved ? "slip.approved" : "slip.rejected", {
        orderId,
        customerName: order.customer.name,
      });
    }
    return ok(order);
  } catch (error) {
    return badRequest(error);
  }
});

// ── Admin auth ────────────────────────────────────────────────────
app.get("/api/backend/admin/auth", (c) => adminAuthRouter.GET(c.req.raw));
app.post("/api/backend/admin/auth", (c) => adminAuthRouter.POST(c.req.raw));
app.delete("/api/backend/admin/auth", () => adminAuthRouter.DELETE());

// ── Admin register & users ────────────────────────────────────────
app.post("/api/backend/admin/register", (c) => adminRegisterRouter.POST(c.req.raw));

app.get("/api/backend/admin/users", (c) => adminUserRouter.GET(c.req.raw));
app.post("/api/backend/admin/users", (c) => adminUserRouter.POST(c.req.raw));
app.delete("/api/backend/admin/users", (c) => adminUserRouter.DELETE(c.req.raw));
app.patch("/api/backend/admin/users", (c) => adminUserRouter.PATCH(c.req.raw));

// ── Admin audit logs ──────────────────────────────────────────────
app.get("/api/backend/admin/audit-logs", async (c) => {
  const err = requireSuperAdmin(c.req.raw);
  if (err) return err;
  try {
    return ok(await listAuditLogs());
  } catch (error) {
    return badRequest(error);
  }
});

// ── Settings (public) ─────────────────────────────────────────────
app.get("/api/backend/payment-settings", () => paymentSettingsRouter.GET());
app.get("/api/backend/shipping-settings", () => shippingSettingsRouter.GET());
app.get("/api/backend/home-content", () => homeContentRouter.GET());
app.get("/api/backend/charm-settings", () => charmSettingsRouter.GET());

// ── Settings (admin) ──────────────────────────────────────────────
app.get("/api/backend/admin/payment-settings", (c) => {
  const err = requireSuperAdmin(c.req.raw);
  return err ?? adminPaymentSettingsRouter.GET();
});
app.patch("/api/backend/admin/payment-settings", async (c) => {
  const err = requireSuperAdmin(c.req.raw);
  if (err) return err;
  const actor = getAdminIdentity(c.req.raw);
  const response = await adminPaymentSettingsRouter.PATCH(c.req.raw);
  if (actor && response.ok) await writeAuditLog(actor, "payment_settings.updated", {});
  return response;
});

app.get("/api/backend/admin/shipping-settings", (c) => {
  const err = requireSuperAdmin(c.req.raw);
  return err ?? adminShippingSettingsRouter.GET();
});
app.patch("/api/backend/admin/shipping-settings", async (c) => {
  const err = requireSuperAdmin(c.req.raw);
  if (err) return err;
  const actor = getAdminIdentity(c.req.raw);
  const response = await adminShippingSettingsRouter.PATCH(c.req.raw);
  if (actor && response.ok) await writeAuditLog(actor, "shipping_settings.updated", {});
  return response;
});

app.get("/api/backend/admin/home-content", (c) => {
  const err = requireAdmin(c.req.raw);
  return err ?? adminHomeContentRouter.GET();
});
app.patch("/api/backend/admin/home-content", async (c) => {
  const err = requireAdmin(c.req.raw);
  if (err) return err;
  const actor = getAdminIdentity(c.req.raw);
  const response = await adminHomeContentRouter.PATCH(c.req.raw);
  if (actor && response.ok) await writeAuditLog(actor, "home_content.updated", {});
  return response;
});

app.get("/api/backend/admin/charm-settings", (c) => {
  const err = requireAdmin(c.req.raw);
  return err ?? adminCharmSettingsRouter.GET();
});
app.patch("/api/backend/admin/charm-settings", (c) => {
  const err = requireAdmin(c.req.raw);
  return err ?? adminCharmSettingsRouter.PATCH(c.req.raw);
});

// ── Admin realtime (SSE) ──────────────────────────────────────────
app.get("/api/backend/admin/realtime", (c) => {
  const err = requireAdmin(c.req.raw);
  if (err) return err;

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      const send = (event: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };
      const unsubscribe = subscribeAdminRealtime(send);
      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(": heartbeat\n\n"));
      }, 30_000);
      send({ type: "connected", at: new Date().toISOString() });
      c.req.raw.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        unsubscribe();
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Content-Type": "text/event-stream",
      "X-Accel-Buffering": "no",
    },
  });
});

// ── File upload ───────────────────────────────────────────────────
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const SAFE_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

app.post("/api/upload", async (c) => {
  const err = requireAdmin(c.req.raw);
  if (err) return err;

  const formData = await c.req.raw.formData().catch(() => null);
  if (!formData) return c.json({ error: "Invalid form data" }, 400);

  const file = formData.get("file");
  if (!file || typeof file === "string" || !(file instanceof File)) {
    return c.json({ error: "No file provided" }, 400);
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return c.json({ error: "Only JPG, PNG, WEBP, GIF allowed" }, 400);
  }

  const rawBuffer = Buffer.from(await file.arrayBuffer());
  if (rawBuffer.length > MAX_FILE_SIZE) return c.json({ error: "File must be under 5MB" }, 400);

  const webpBuffer = await sharp(rawBuffer).webp({ quality: 85 }).toBuffer();

  const rawSlug = formData.get("slug");
  const slug = typeof rawSlug === "string" && SAFE_SLUG_RE.test(rawSlug) ? rawSlug : null;
  const uploadsDir = join(process.cwd(), "uploads");

  if (slug) {
    const existing = (await readdir(uploadsDir).catch(() => [] as string[])).filter(
      (f) => f === `${slug}.webp` || (f.startsWith(`${slug}.`) && f !== `${slug}.webp`),
    );
    await Promise.all(existing.map((f) => unlink(join(uploadsDir, f)).catch(() => null)));
  }

  const filename = `${slug ?? randomUUID()}.webp`;
  await writeFile(join(uploadsDir, filename), webpBuffer);
  return c.json({ url: `/uploads/${filename}` });
});

// ── Cleanup unused upload files (admin) ───────────────────────────
app.delete("/api/backend/admin/uploads/cleanup", async (c) => {
  const err = requireAdmin(c.req.raw);
  if (err) return err;

  const [products, files] = await Promise.all([
    productController.listAllProductImageUrls(),
    readdir(join(process.cwd(), "uploads")).catch(() => [] as string[]),
  ]);

  const usedFilenames = new Set(
    products.flatMap((url) => {
      const match = /\/uploads\/([^/]+)$/.exec(url);
      return match ? [match[1]] : [];
    }),
  );

  const deleted: string[] = [];
  for (const file of files) {
    if (!usedFilenames.has(file)) {
      await unlink(join(process.cwd(), "uploads", file)).catch(() => null);
      deleted.push(file);
    }
  }

  return c.json({ data: { deleted, count: deleted.length } });
});

// ── Send email (admin) ────────────────────────────────────────────
app.post("/api/send-email", async (c) => {
  const err = requireAdmin(c.req.raw);
  if (err) return err;
  const limit = rateLimit(c.req.raw, { bucket: "send-email", windowMs: 60_000, max: 10 });
  if (limit.limited) return tooManyRequests(limit.retryAfterSeconds, "too many email requests");
  try {
    const body = await readLimitedJson<{ to?: unknown; subject?: unknown; text?: unknown; html?: unknown }>(
      c.req.raw,
      32_000,
    );
    const payload = parseOrThrow(emailPayloadSchema, body);
    await sendEmail(payload);
    return ok({ status: "200", message: "email sent" });
  } catch (error) {
    return badRequest(error);
  }
});

serve({ fetch: app.fetch, port: PORT }, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
