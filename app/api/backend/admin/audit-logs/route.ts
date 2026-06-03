import { NextRequest } from "next/server";
import { requireSuperAdmin } from "@/lib/backend/admin-auth";
import { listAuditLogs } from "@/lib/backend/admin-user-service";
import { badRequest, ok } from "@/lib/backend/http";

export async function GET(request: NextRequest) {
  const authError = requireSuperAdmin(request);
  if (authError) return authError;

  try {
    return ok(await listAuditLogs());
  } catch (error) {
    return badRequest(error);
  }
}
