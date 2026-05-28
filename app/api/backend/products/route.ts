import { badRequest, ok } from "@/lib/backend/http";
import { listProducts } from "@/lib/backend/ecom-service";

export async function GET() {
  try {
    return ok(await listProducts());
  } catch (error) {
    return badRequest(error);
  }
}
