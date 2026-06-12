import { NextRequest } from "next/server";
import { getAdminIdentity, requireAdmin } from "@/lib/backend/admin-auth";
import { writeAuditLog } from "@/lib/backend/admin-user-service";
import { adminHomeContentRouter } from "@/lib/backend/settings/settings-router";

export async function GET(request: NextRequest) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  return adminHomeContentRouter.GET();
}

export async function PATCH(request: NextRequest) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  const response = await adminHomeContentRouter.PATCH(request);
  const actor = getAdminIdentity(request);
  if (actor && response.ok) {
    await writeAuditLog(actor, "home_content.updated", {});
  }

  return response;
}
