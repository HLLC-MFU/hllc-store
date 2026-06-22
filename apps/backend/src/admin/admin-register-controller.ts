import { badRequest, ok } from "../http";
import { registerAdminPassword } from "../admin-user-service";
import { readLimitedJson } from "../request-utils";
import { adminRegisterBackendSchema, parseOrThrow } from "@hllc/shared/validation/schemas";
import { enforceRateLimit } from "./admin-controller-utils";

export async function register(request: Request) {
  const limited = enforceRateLimit(request, "admin-register", 5, "too many registration attempts");
  if (limited) return limited;

  try {
    const body = await readLimitedJson<{ username?: unknown; password?: unknown }>(request, 16_000);
    const parsed = parseOrThrow(adminRegisterBackendSchema, body ?? {});

    return ok(await registerAdminPassword(parsed));
  } catch (error) {
    return badRequest(error);
  }
}
