/**
 * Validation utilities powered by Zod.
 * Re-exports from schemas-i18n for backward compatibility.
 */
export {
  emailSchema,
  phoneSchema,
  postalCodeSchema,
  validateEmail,
  validatePhone,
  normalizeEmail,
  normalizePhone,
  safeParseWithLang,
  type Lang,
  type SafeParseResult,
} from "./schemas-i18n";

export { parseOrThrow } from "./schemas";

import { z } from "zod";

/**
 * Legacy wrapper — check if email is valid (boolean).
 */
export function isValidEmail(email: string): boolean {
  const result = z.string().email().safeParse(email.trim());
  return result.success;
}
