import { z } from "zod";

/* ================================================================
   Base Schemas
   ================================================================ */

export const emailSchema = z.string().email("Invalid email address");

export const phoneSchema = z
  .string()
  .min(9, "Phone number must be at least 9 digits")
  .max(10, "Phone number must be at most 10 digits")
  .regex(/^\d+$/, "Phone number must contain only digits");

export const postalCodeSchema = z
  .string()
  .length(5, "Postal code must be exactly 5 digits")
  .regex(/^\d+$/, "Postal code must contain only digits");

export const objectIdSchema = z
  .string()
  .length(24, "Invalid ID")
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format");

/* ================================================================
   Cart / Checkout Schemas
   ================================================================ */

export const cartItemInputSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  selectedOption: z.string().optional(),
});

export const deliveryInfoSchema = z.object({
  name: z.string().min(1, "Recipient name is required"),
  phone: phoneSchema,
  email: emailSchema,
  address: z.string().min(1, "Shipping address is required"),
  district: z.string().min(1, "District is required"),
  province: z.string().min(1, "Province is required"),
  postalCode: postalCodeSchema,
});

export const pickupInfoSchema = z.object({
  name: z.string().min(1, "Pickup name is required"),
  phone: phoneSchema,
  email: emailSchema,
  pickupTime: z.string().min(1, "Pickup time is required"),
});

export const checkoutFormSchema = z.union([
  z.object({
    deliveryMode: z.literal("delivery"),
    name: z.string().min(1, "Recipient name is required"),
    phone: phoneSchema,
    email: emailSchema,
    address: z.string().min(1, "Shipping address is required"),
    district: z.string().min(1, "District is required"),
    province: z.string().min(1, "Province is required"),
    postalCode: postalCodeSchema,
  }),
  z.object({
    deliveryMode: z.literal("pickup"),
    name: z.string().min(1, "Pickup name is required"),
    phone: phoneSchema,
    email: emailSchema,
    pickupTime: z.string().min(1, "Pickup time is required"),
  }),
]);

export const createOrderSchema = z.object({
  customer: z.object({
    name: z.string().min(1, "Name is required"),
    phone: z.string().min(1, "Phone is required"),
    email: emailSchema,
    address: z.string().min(1, "Address is required"),
  }),
  items: z.array(cartItemInputSchema).min(1, "At least one item is required"),
  deliveryMode: z.enum(["delivery", "pickup"]).optional(),
});

/* ================================================================
   Order Sheet (Quick Buy) Schemas
   ================================================================ */

export const orderSheetDeliverySchema = z.object({
  deliveryMode: z.literal("delivery"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  streetAddress: z.string().min(1, "Address is required"),
  district: z.string().min(1, "District is required"),
  province: z.string().min(1, "Province is required"),
  postalCode: postalCodeSchema,
  phone: phoneSchema,
  email: emailSchema,
});

export const orderSheetPickupSchema = z.object({
  deliveryMode: z.literal("pickup"),
  pickupName: z.string().min(1, "Pickup name is required"),
  pickupTime: z.string().min(1, "Pickup time is required"),
  pickupPhone: phoneSchema,
  email: emailSchema,
});

export const orderSheetSchema = z.union([
  orderSheetDeliverySchema,
  orderSheetPickupSchema,
]);

/* ================================================================
   Product Schemas
   ================================================================ */

export const localizedTextSchema = z.object({
  th: z.string().min(1, "Thai text is required"),
  en: z.string().optional(),
});

export const productOptionSchema = z.object({
  label: z.string().min(1, "Option label is required"),
  imageUrl: z.string().optional(),
  stock: z.coerce.number().int().min(0, "Option stock must be a non-negative integer").optional(),
});

export const createProductSchema = z.object({
  name: localizedTextSchema,
  slug: z.string().optional(),
  description: localizedTextSchema.optional(),
  price: z.coerce.number().finite().min(0, "Price must be a positive number"),
  stock: z.coerce.number().int().min(0, "Stock must be a non-negative integer"),
  shippingFirstItem: z.coerce.number().finite().min(0, "Shipping first item must be a positive number").optional(),
  shippingAdditionalItem: z.coerce.number().finite().min(0, "Shipping additional item must be a positive number").optional(),
  category: z.string().optional(),
  options: z.array(z.union([z.string(), productOptionSchema])).optional(),
  imageUrl: z.string().optional(),
  imageUrls: z.array(z.string()).optional(),
  active: z.boolean().optional(),
});

/* ================================================================
   Admin Auth Schemas
   ================================================================ */

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z
  .object({
    username: z.string().min(1, "Username is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm password is required"),
    secretKey: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const adminRegisterBackendSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

/* ================================================================
   Email Schemas
   ================================================================ */

export const emailPayloadSchema = z.object({
  to: emailSchema,
  subject: z.string().min(1, "Subject is required"),
  text: z.string().optional(),
  html: z.string().optional(),
}).refine((data) => Boolean(data.text?.trim()) || Boolean(data.html?.trim()), {
  message: "Either text or html is required",
  path: ["text"],
});

/* ================================================================
   Slip / Image Schemas
   ================================================================ */

export const imageUrlSchema = z
  .string()
  .refine(
    (val) =>
      val.startsWith("data:")
        ? /^data:image\/(png|jpe?g|webp|gif);base64,/i.test(val) && val.length <= 3_000_000
        : true,
    {
      message: "Image must be a valid PNG, JPG, WEBP, or GIF under 3MB",
    }
  );

/* ================================================================
   Parse Helpers
   ================================================================ */

export function parseOrThrow<T>(schema: z.ZodSchema<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    const msg = result.error.issues[0]?.message ?? "Validation failed";
    throw new Error(msg);
  }
  return result.data;
}

/* ================================================================
   Type Exports
   ================================================================ */

export type EmailInput = z.infer<typeof emailSchema>;
export type DeliveryInfo = z.infer<typeof deliveryInfoSchema>;
export type PickupInfo = z.infer<typeof pickupInfoSchema>;
export type CheckoutForm = z.infer<typeof checkoutFormSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type OrderSheetDelivery = z.infer<typeof orderSheetDeliverySchema>;
export type OrderSheetPickup = z.infer<typeof orderSheetPickupSchema>;
export type OrderSheetForm = z.infer<typeof orderSheetSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type EmailPayload = z.infer<typeof emailPayloadSchema>;
