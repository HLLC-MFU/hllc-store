import { NextRequest } from "next/server";
import { getAdminIdentity, requireAdmin } from "@/lib/backend/admin-auth";
import { writeAuditLog } from "@/lib/backend/admin-user-service";
import { adminProductRouter } from "@/lib/backend/products/product-router";

export async function GET(request: NextRequest) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  return adminProductRouter.GET();
}

export async function POST(request: NextRequest) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  const response = await adminProductRouter.POST(request);
  const actor = getAdminIdentity(request);
  if (actor && response.ok) {
    await writeAuditLog(actor, "product.created");
  }

  return response;
}
