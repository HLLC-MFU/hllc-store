import { z } from "zod";

/* ================================================================
   Shared response shapes returned by the backend `{ data: T }` envelope.
   Validate these before the payload enters component state so an
   unexpected API shape fails loudly instead of producing `undefined`
   deep inside the UI.
   ================================================================ */

export const localizedTextResponseSchema = z.object({
  th: z.string(),
  en: z.string().optional(),
});

const orderStatusResponseSchema = z.enum([
  "pending_payment",
  "payment_review",
  "paid",
  "packing",
  "shipped",
  "completed",
  "cancelled",
]);

const slipStatusResponseSchema = z.enum(["none", "pending", "approved", "rejected"]);

const orderItemResponseSchema = z.object({
  productId: z.string(),
  name: localizedTextResponseSchema,
  price: z.number(),
  quantity: z.number(),
  subtotal: z.number(),
  selectedOption: z.string().optional(),
});

const orderCommonResponseSchema = z.object({
  id: z.string(),
  items: z.array(orderItemResponseSchema),
  subtotal: z.number(),
  shippingFee: z.number(),
  deliveryMode: z.enum(["delivery", "pickup"]),
  total: z.number(),
  status: orderStatusResponseSchema,
  trackingNumber: z.string().optional(),
  cancellationReason: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

/** Anonymous customer-facing order shape (phone lookup, order confirmation). */
export const publicOrderResponseSchema = orderCommonResponseSchema.extend({
  customer: z.object({ name: z.string(), phone: z.string() }),
  slip: z.object({ status: slipStatusResponseSchema, imageUrl: z.string() }),
});

/** Full admin-facing order shape, including customer PII and review metadata. */
export const orderResponseSchema = orderCommonResponseSchema.extend({
  customer: z.object({
    name: z.string(),
    phone: z.string(),
    email: z.string(),
    address: z.string(),
  }),
  slip: z.object({
    imageUrl: z.string().optional(),
    status: slipStatusResponseSchema,
    paidAt: z.string().optional(),
  }),
  adminNotes: z.array(z.object({ text: z.string(), by: z.string(), at: z.string(), action: z.string() })).optional(),
});

const productOptionResponseSchema = z.object({
  label: z.string(),
  imageUrl: z.string().optional(),
  stock: z.number().optional(),
});

export const productResponseSchema = z.object({
  id: z.string(),
  name: localizedTextResponseSchema,
  slug: z.string(),
  description: localizedTextResponseSchema.optional(),
  price: z.number(),
  stock: z.number(),
  shippingFirstItem: z.number(),
  shippingAdditionalItem: z.number(),
  category: z.string().optional(),
  options: z.array(productOptionResponseSchema).optional(),
  imageUrl: z.string().optional(),
  imageUrls: z.array(z.string()).optional(),
  active: z.boolean(),
});

const adminRoleResponseSchema = z.enum(["superAdmin", "admin"]);

export const currentAdminResponseSchema = z.object({
  username: z.string(),
  role: adminRoleResponseSchema,
});

export const adminUserResponseSchema = z.object({
  id: z.string(),
  username: z.string(),
  role: adminRoleResponseSchema,
  active: z.boolean(),
  registered: z.boolean(),
  createdAt: z.string(),
});

export const auditLogResponseSchema = z.object({
  id: z.string(),
  actorUsername: z.string(),
  actorRole: adminRoleResponseSchema,
  action: z.string(),
  actionLabel: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()),
  targetLabel: z.string().optional(),
  createdAt: z.string(),
});

export const adminAuthSessionResponseSchema = z.object({
  authenticated: z.boolean(),
  user: currentAdminResponseSchema.nullable(),
});

/**
 * Validates an unwrapped `data` payload against a schema. Throws with a short,
 * readable message on mismatch — callers should surface this as a load/error state
 * rather than letting an unexpected shape silently become `undefined` in the UI.
 */
export function validateResponse<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new Error(`unexpected API response shape: ${result.error.issues[0]?.message ?? "validation failed"}`);
  }
  return result.data;
}
