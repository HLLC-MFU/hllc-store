import { NextRequest } from "next/server";
import { badRequest, ok } from "@/lib/backend/http";
import {
  isOrderStatus,
  listOrders,
} from "@/lib/backend/ecom-service";

export async function GET(request: NextRequest) {
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
