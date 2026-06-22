import { z } from "zod";
import {
  adminAuthSessionResponseSchema,
  adminUserResponseSchema,
  auditLogResponseSchema,
  currentAdminResponseSchema,
} from "@hllc/shared/validation/response-schemas";

export {
  adminAuthSessionResponseSchema,
  adminUserResponseSchema,
  auditLogResponseSchema,
  currentAdminResponseSchema,
};

export type CurrentAdmin = z.infer<typeof currentAdminResponseSchema>;
export type AdminRole = CurrentAdmin["role"];
export type AdminUser = z.infer<typeof adminUserResponseSchema>;
export type AuditLog = z.infer<typeof auditLogResponseSchema>;
export type AdminAuthSession = z.infer<typeof adminAuthSessionResponseSchema>;
