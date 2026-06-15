import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/backend/admin-auth";
import { adminCharmSettingsRouter } from "@/lib/backend/settings/settings-router";

export async function GET(request: NextRequest) {
  const authError = requireAdmin(request);
  if (authError) return authError;
  return adminCharmSettingsRouter.GET();
}

export async function PATCH(request: NextRequest) {
  const authError = requireAdmin(request);
  if (authError) return authError;
  return adminCharmSettingsRouter.PATCH(request);
}
