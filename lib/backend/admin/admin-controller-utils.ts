import type { NextRequest } from "next/server";
import { getAdminIdentity, type AdminIdentity } from "@/lib/backend/admin-auth";
import { tooManyRequests } from "@/lib/backend/http";
import { rateLimit } from "@/lib/backend/rate-limit";

/** Returns the authenticated admin identity, or throws so the caller's catch block reports it as a bad request. */
export function requireActor(request: NextRequest): AdminIdentity {
  const actor = getAdminIdentity(request);
  if (!actor) throw new Error("admin session required");
  return actor;
}

/** Applies a fixed-window rate limit; returns a 429 response when the bucket is exhausted, otherwise null. */
export function enforceRateLimit(request: NextRequest, bucket: string, max: number, message: string) {
  const limit = rateLimit(request, { bucket, windowMs: 60_000, max });
  if (limit.limited) {
    return tooManyRequests(limit.retryAfterSeconds, message);
  }
  return null;
}
