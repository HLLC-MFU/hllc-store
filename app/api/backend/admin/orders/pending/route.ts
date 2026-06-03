import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/backend/admin-auth";
import { badRequest, ok } from "@/lib/backend/http";
import { countPendingOrders } from "@/lib/backend/ecom-service";

export async function GET(request: NextRequest) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  try {
    return ok({
      pending: await countPendingOrders(),
    });
  } catch (error) {
    return badRequest(error);
  }
}
