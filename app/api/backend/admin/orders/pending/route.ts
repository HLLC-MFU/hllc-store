import { badRequest, ok } from "@/lib/backend/http";
import { countPendingOrders } from "@/lib/backend/ecom-service";

export async function GET() {
  try {
    return ok({
      pending: await countPendingOrders(),
    });
  } catch (error) {
    return badRequest(error);
  }
}
