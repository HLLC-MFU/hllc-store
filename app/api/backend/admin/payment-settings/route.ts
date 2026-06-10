import { NextRequest } from "next/server";
import { getAdminIdentity, requireSuperAdmin } from "@/lib/backend/admin-auth";
import { writeAuditLog } from "@/lib/backend/admin-user-service";
import { adminPaymentSettingsRouter } from "@/lib/backend/settings/settings-router";

export async function GET(request: NextRequest) {
  const authError = requireSuperAdmin(request);
  if (authError) return authError;

  return adminPaymentSettingsRouter.GET();
}

export async function PATCH(request: NextRequest) {
  const authError = requireSuperAdmin(request);
  if (authError) return authError;

  const response = await adminPaymentSettingsRouter.PATCH(request);
  const actor = getAdminIdentity(request);
  if (actor && response.ok) {
    await writeAuditLog(actor, "payment_settings.updated", {});
  }

  return response;
}
