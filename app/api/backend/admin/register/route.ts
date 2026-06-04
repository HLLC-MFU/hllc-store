import { NextRequest } from "next/server";
import { badRequest, ok, tooManyRequests } from "@/lib/backend/http";
import { rateLimit } from "@/lib/backend/rate-limit";
import { registerAdminPassword } from "@/lib/backend/admin-user-service";
import { readLimitedJson } from "@/lib/backend/request-utils";
import { adminRegisterBackendSchema, parseOrThrow } from "@/lib/validation/schemas";

export async function POST(request: NextRequest) {
  const limit = rateLimit(request, { bucket: "admin-register", windowMs: 60_000, max: 5 });
  if (limit.limited) {
    return tooManyRequests(limit.retryAfterSeconds, "too many registration attempts");
  }

  try {
    const body = await readLimitedJson<{ username?: unknown; password?: unknown }>(request, 16_000);
    const parsed = parseOrThrow(adminRegisterBackendSchema, body ?? {});

    return ok(await registerAdminPassword(parsed));
  } catch (error) {
    return badRequest(error);
  }
}
