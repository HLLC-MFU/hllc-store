import { getAdminIdentity, type AdminIdentity } from "../admin-auth";
import { tooManyRequests } from "../http";
import { rateLimit } from "../rate-limit";

export function requireActor(request: Request): AdminIdentity {
  const actor = getAdminIdentity(request);
  if (!actor) throw new Error("admin session required");
  return actor;
}

export function enforceRateLimit(request: Request, bucket: string, max: number, message: string) {
  const limit = rateLimit(request, { bucket, windowMs: 60_000, max });
  if (limit.limited) {
    return tooManyRequests(limit.retryAfterSeconds, message);
  }
  return null;
}
