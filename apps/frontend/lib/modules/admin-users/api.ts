import { z } from "zod";
import { api, apiValidated } from "@/components/admin/api-client";
import {
  adminAuthSessionResponseSchema,
  adminUserResponseSchema,
  auditLogResponseSchema,
} from "./types";

export function fetchSession() {
  return apiValidated(adminAuthSessionResponseSchema, "/api/backend/admin/auth");
}

export function login(username: string, password: string) {
  return apiValidated(adminAuthSessionResponseSchema, "/api/backend/admin/auth", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export function logout() {
  return api("/api/backend/admin/auth", { method: "DELETE" });
}

export function fetchAdminUsers() {
  return apiValidated(z.array(adminUserResponseSchema), "/api/backend/admin/users");
}

export function fetchAuditLogs() {
  return apiValidated(z.array(auditLogResponseSchema), "/api/backend/admin/audit-logs");
}

export function createAdminUser(username: string, role: "superAdmin" | "admin") {
  return apiValidated(adminUserResponseSchema, "/api/backend/admin/users", {
    method: "POST",
    body: JSON.stringify({ username, role }),
  });
}

export function deleteAdminUser(username: string) {
  return api("/api/backend/admin/users", {
    method: "DELETE",
    body: JSON.stringify({ username }),
  });
}

export function resetAdminPassword(username: string) {
  return api("/api/backend/admin/users", {
    method: "PATCH",
    body: JSON.stringify({ username }),
  });
}
