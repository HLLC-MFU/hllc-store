import { z } from "zod";

/* ================================================================
   Localized Error Messages
   ================================================================ */

const messages = {
  th: {
    invalidEmail: "รูปแบบอีเมลไม่ถูกต้อง (เช่น name@example.com)",
    emailRequired: "กรุณากรอกอีเมล",
    phoneMin: "เบอร์โทรศัพท์ต้องมีอย่างน้อย 9 หลัก",
    phoneMax: "เบอร์โทรศัพท์ต้องมีไม่เกิน 10 หลัก",
    phoneDigitsOnly: "เบอร์โทรศัพท์ต้องเป็นตัวเลขเท่านั้น",
    postalCodeLength: "รหัสไปรษณีย์ต้องมี 5 หลัก",
    postalCodeDigitsOnly: "รหัสไปรษณีย์ต้องเป็นตัวเลขเท่านั้น",
    nameRequired: "กรุณากรอกชื่อ",
    addressRequired: "กรุณากรอกที่อยู่",
    districtRequired: "กรุณากรอกเขต/อำเภอ",
    provinceRequired: "กรุณากรอกจังหวัด",
    pickupTimeRequired: "กรุณาระบุเวลารับสินค้า",
    firstNameRequired: "กรุณากรอกชื่อ",
    lastNameRequired: "กรุณากรอกนามสกุล",
    itemRequired: "กรุณาเลือกสินค้าอย่างน้อย 1 รายการ",
    quantityMin: "จำนวนต้องไม่น้อยกว่า 1",
    pricePositive: "ราคาต้องเป็นจำนวนบวก",
    stockNonNegative: "จำนวนสต็อกต้องไม่ติดลบ",
    usernameRequired: "กรุณากรอกชื่อผู้ใช้",
    passwordRequired: "กรุณากรอกรหัสผ่าน",
    passwordMin: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร",
    passwordMismatch: "รหัสผ่านไม่ตรงกัน",
    subjectRequired: "กรุณากรอกหัวข้อ",
    textOrHtmlRequired: "กรุณากรอกข้อความหรือ HTML",
    imageInvalid: "รูปภาพต้องเป็น PNG, JPG, WEBP หรือ GIF และขนาดไม่เกิน 3MB",
    invalidId: "รหัสไม่ถูกต้อง",
  },
  en: {
    invalidEmail: "Invalid email format (e.g. name@example.com)",
    emailRequired: "Email is required",
    phoneMin: "Phone number must be at least 9 digits",
    phoneMax: "Phone number must be at most 10 digits",
    phoneDigitsOnly: "Phone number must contain only digits",
    postalCodeLength: "Postal code must be exactly 5 digits",
    postalCodeDigitsOnly: "Postal code must contain only digits",
    nameRequired: "Name is required",
    addressRequired: "Address is required",
    districtRequired: "District is required",
    provinceRequired: "Province is required",
    pickupTimeRequired: "Pickup time is required",
    firstNameRequired: "First name is required",
    lastNameRequired: "Last name is required",
    itemRequired: "Please select at least 1 item",
    quantityMin: "Quantity must be at least 1",
    pricePositive: "Price must be a positive number",
    stockNonNegative: "Stock must be a non-negative integer",
    usernameRequired: "Username is required",
    passwordRequired: "Password is required",
    passwordMin: "Password must be at least 8 characters",
    passwordMismatch: "Passwords do not match",
    subjectRequired: "Subject is required",
    textOrHtmlRequired: "Either text or html is required",
    imageInvalid: "Image must be a valid PNG, JPG, WEBP, or GIF under 3MB",
    invalidId: "Invalid ID",
  },
};

export type Lang = "th" | "en";

export function t(key: keyof (typeof messages)["en"], lang: Lang): string {
  return messages[lang][key] ?? messages.en[key];
}

/* ================================================================
   Schema Builders with i18n
   ================================================================ */

export function emailSchema(lang: Lang = "en") {
  return z.string().email({ message: t("invalidEmail", lang) });
}

export function phoneSchema(lang: Lang = "en") {
  return z
    .string()
    .min(9, { message: t("phoneMin", lang) })
    .max(10, { message: t("phoneMax", lang) })
    .regex(/^\d+$/, { message: t("phoneDigitsOnly", lang) });
}

export function postalCodeSchema(lang: Lang = "en") {
  return z
    .string()
    .length(5, { message: t("postalCodeLength", lang) })
    .regex(/^\d+$/, { message: t("postalCodeDigitsOnly", lang) });
}

/* ================================================================
   Safe Parse Helpers
   ================================================================ */

export interface SafeParseResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string>;
}

/**
 * Safe parse a schema and return a localized single error string
 * plus optional field-level errors.
 */
export function safeParseWithLang<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  lang: Lang = "en"
): SafeParseResult<T> {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }

  const issues = result.error.issues;
  const firstError = issues[0]?.message ?? t("invalidEmail", lang);

  const fieldErrors: Record<string, string> = {};
  for (const issue of issues) {
    const path = issue.path.join(".");
    if (path && !fieldErrors[path]) {
      fieldErrors[path] = issue.message;
    }
  }

  return { success: false, error: firstError, fieldErrors };
}

/**
 * Validate a single email string and return localized error (empty = valid).
 */
export function validateEmail(email: string, lang: Lang = "en"): string {
  const trimmed = email.trim();
  if (!trimmed) return t("emailRequired", lang);
  const result = emailSchema(lang).safeParse(trimmed);
  if (!result.success) {
    return result.error.issues[0]?.message ?? t("invalidEmail", lang);
  }
  return "";
}

/**
 * Validate a single phone string and return localized error (empty = valid).
 */
export function validatePhone(phone: string, lang: Lang = "en"): string {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return t("phoneMin", lang);
  const result = phoneSchema(lang).safeParse(digits);
  if (!result.success) {
    return result.error.issues[0]?.message ?? t("phoneMin", lang);
  }
  return "";
}

/**
 * Normalize helpers
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase().replace(/\s/g, "");
}

export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

/* ================================================================
   Composite Schema Builders
   ================================================================ */

export function checkoutFormSchema(lang: Lang = "en") {
  return z.union([
    z.object({
      deliveryMode: z.literal("delivery"),
      name: z.string().min(1, { message: t("nameRequired", lang) }),
      phone: phoneSchema(lang),
      email: emailSchema(lang),
      address: z.string().min(1, { message: t("addressRequired", lang) }),
      district: z.string().min(1, { message: t("districtRequired", lang) }),
      province: z.string().min(1, { message: t("provinceRequired", lang) }),
      postalCode: postalCodeSchema(lang),
    }),
    z.object({
      deliveryMode: z.literal("pickup"),
      name: z.string().min(1, { message: t("nameRequired", lang) }),
      phone: phoneSchema(lang),
      email: emailSchema(lang),
      pickupTime: z.string().min(1, { message: t("pickupTimeRequired", lang) }),
    }),
  ]);
}

export function orderSheetDeliverySchema(lang: Lang = "en") {
  return z.object({
    deliveryMode: z.literal("delivery"),
    firstName: z.string().min(1, { message: t("firstNameRequired", lang) }),
    lastName: z.string().min(1, { message: t("lastNameRequired", lang) }),
    streetAddress: z.string().min(1, { message: t("addressRequired", lang) }),
    district: z.string().min(1, { message: t("districtRequired", lang) }),
    province: z.string().min(1, { message: t("provinceRequired", lang) }),
    postalCode: postalCodeSchema(lang),
    phone: phoneSchema(lang),
    email: emailSchema(lang),
  });
}

export function orderSheetPickupSchema(lang: Lang = "en") {
  return z.object({
    deliveryMode: z.literal("pickup"),
    pickupName: z.string().min(1, { message: t("nameRequired", lang) }),
    pickupTime: z.string().min(1, { message: t("pickupTimeRequired", lang) }),
    pickupPhone: phoneSchema(lang),
    email: emailSchema(lang),
  });
}

export function orderSheetSchema(lang: Lang = "en") {
  return z.union([orderSheetDeliverySchema(lang), orderSheetPickupSchema(lang)]);
}

export function loginSchema(lang: Lang = "en") {
  return z.object({
    username: z.string().min(1, { message: t("usernameRequired", lang) }),
    password: z.string().min(1, { message: t("passwordRequired", lang) }),
  });
}

export function registerSchema(lang: Lang = "en") {
  return z
    .object({
      username: z.string().min(1, { message: t("usernameRequired", lang) }),
      password: z.string().min(8, { message: t("passwordMin", lang) }),
      confirmPassword: z.string().min(1, { message: t("passwordRequired", lang) }),
      secretKey: z.string().optional(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("passwordMismatch", lang),
      path: ["confirmPassword"],
    });
}

export function emailPayloadSchema(lang: Lang = "en") {
  return z
    .object({
      to: emailSchema(lang),
      subject: z.string().min(1, { message: t("subjectRequired", lang) }),
      text: z.string().optional(),
      html: z.string().optional(),
    })
    .refine((data) => Boolean(data.text?.trim()) || Boolean(data.html?.trim()), {
      message: t("textOrHtmlRequired", lang),
      path: ["text"],
    });
}
