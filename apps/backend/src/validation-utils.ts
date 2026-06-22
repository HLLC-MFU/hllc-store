import { ObjectId } from "mongodb";
import { z } from "zod";

export function assertText(value: unknown, field: string) {
  const result = z.string().min(1, { message: `${field} is required` }).safeParse(value);
  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? `${field} is required`);
  }
  return result.data.trim();
}

export function assertNumber(value: unknown, field: string) {
  const result = z.coerce.number().finite().min(0, { message: `${field} must be a positive number` }).safeParse(value);
  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? `${field} must be a positive number`);
  }
  return result.data;
}

export function assertObjectId(id: string, label = "id") {
  if (!ObjectId.isValid(id)) {
    throw new Error(`invalid ${label}`);
  }

  return new ObjectId(id);
}

export function now() {
  return new Date().toISOString();
}

function normalizeOptionStock(value: unknown) {
  if (value === undefined || value === null || value === "") return undefined;
  return assertNumber(value, "option.stock");
}

type NormalizedOption = { label: string; labelEn?: string; imageUrl: string; stock?: number };

/**
 * `normalizeImage` lets callers run image values through their own validation/normalization
 * (e.g. product-service validates against imageUrlSchema, order-service keeps the raw trimmed string).
 */
export function normalizeOptions(
  value: unknown,
  normalizeImage: (value: unknown) => string = (v) => (typeof v === "string" ? v.trim() : ""),
): NormalizedOption[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") {
          const [label = "", imageUrl = "", stock = ""] = item.split("|").map((part) => part.trim());
          const optionStock = normalizeOptionStock(stock);
          return label
            ? { label, imageUrl: normalizeImage(imageUrl), ...(optionStock !== undefined ? { stock: optionStock } : {}) }
            : null;
        }

        if (item && typeof item === "object") {
          const option = item as { label?: unknown; labelEn?: unknown; name?: unknown; value?: unknown; imageUrl?: unknown; image?: unknown; stock?: unknown };
          const label =
            typeof option.label === "string"
              ? option.label.trim()
              : typeof option.name === "string"
                ? option.name.trim()
                : typeof option.value === "string"
                  ? option.value.trim()
                  : "";
          const labelEn = typeof option.labelEn === "string" ? option.labelEn.trim() || undefined : undefined;
          const imageUrl =
            typeof option.imageUrl === "string"
              ? option.imageUrl.trim()
              : typeof option.image === "string"
                ? option.image.trim()
                : "";

          const optionStock = normalizeOptionStock(option.stock);

          return label
            ? { label, ...(labelEn ? { labelEn } : {}), imageUrl: normalizeImage(imageUrl), ...(optionStock !== undefined ? { stock: optionStock } : {}) }
            : null;
        }

        return null;
      })
      .filter((item): item is NormalizedOption => Boolean(item));
  }

  if (typeof value === "string") {
    return value
      .split(/\r?\n|,/)
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => {
        const [label = "", imageUrl = "", stock = ""] = item.split("|").map((part) => part.trim());
        const optionStock = normalizeOptionStock(stock);
        return { label, imageUrl: normalizeImage(imageUrl), ...(optionStock !== undefined ? { stock: optionStock } : {}) };
      });
  }

  return [];
}
