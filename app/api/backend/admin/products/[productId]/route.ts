import { NextRequest } from "next/server";
import { getAdminIdentity, requireAdmin } from "@/lib/backend/admin-auth";
import { writeAuditLog } from "@/lib/backend/admin-user-service";
import { listAdminProducts } from "@/lib/backend/products/product-service";
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
    const payload = await response.clone().json().catch(() => null) as { data?: { name?: { th?: string; en?: string } } } | null;
    await writeAuditLog(actor, "product.updated", {
      productId,
      productName: payload?.data?.name?.th || payload?.data?.name?.en,
    });
  }

  return response;
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  const { productId } = await context.params;
  const product = await listAdminProducts()
    .then((products) => products.find((item) => item.id === productId) ?? null)
    .catch(() => null);
  const response = await adminProductByIdRouter.DELETE(request, context);
  const actor = getAdminIdentity(request);
  if (actor && response.ok) {
    await writeAuditLog(actor, "product.deleted", {
      productId,
      productName: product?.name.th || product?.name.en,
    });
  }

  return response;
}
