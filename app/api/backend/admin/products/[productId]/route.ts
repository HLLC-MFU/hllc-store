import { NextRequest } from "next/server";
import { getAdminIdentity, requireAdmin } from "@/lib/backend/admin-auth";
import { writeAuditLog } from "@/lib/backend/admin-user-service";
import { adminProductByIdRouter } from "@/lib/backend/products/product-router";

type RouteContext = {
  params: Promise<{
    productId: string;
  }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  const response = await adminProductByIdRouter.PATCH(request, context);
  const actor = getAdminIdentity(request);
  if (actor && response.ok) {
    const { productId } = await context.params;
    await writeAuditLog(actor, "product.updated", { productId });
  }

  return response;
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  const response = await adminProductByIdRouter.DELETE(request, context);
  const actor = getAdminIdentity(request);
  if (actor && response.ok) {
    const { productId } = await context.params;
    await writeAuditLog(actor, "product.deleted", { productId });
  }

  return response;
}
