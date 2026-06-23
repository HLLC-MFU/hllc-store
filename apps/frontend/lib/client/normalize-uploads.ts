import { appPath } from "./app-path";

export function normalizeUploads<T>(value: T): T {
  if (typeof value === "string") {
    return (value.startsWith("/uploads/") ? appPath(value) : value) as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeUploads(item)) as T;
  }

  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      out[key] = normalizeUploads(item);
    }
    return out as T;
  }

  return value;
}
