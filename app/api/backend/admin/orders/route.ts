import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/backend/admin-auth";
import { badRequest, ok } from "@/lib/backend/http";
import {
  isOrderStatus,
  listOrders,
} from "@/lib/backend/order-service";

export async function GET(request: NextRequest) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  const status = request.nextUrl.searchParams.get("status");

  try {
    return ok(
      await listOrders({
        status: status && isOrderStatus(status) ? status : undefined,
      }),
    );
  } catch (error) {
    return badRequest(error);
  }
}
