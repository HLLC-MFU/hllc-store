import { NextRequest } from "next/server";
import {
  clearAdminSessionCookie,
  getAdminIdentity,
  setAdminSessionCookie,
} from "@/lib/backend/admin-auth";
import { ok, tooManyRequests, unauthorized } from "@/lib/backend/http";
import { rateLimit } from "@/lib/backend/rate-limit";
import { verifyAdminUser } from "@/lib/backend/admin-user-service";
import { readLimitedJson } from "@/lib/backend/request-utils";
import { loginSchema, parseOrThrow } from "@/lib/validation/schemas";

export async function GET(request: NextRequest) {
  const user = getAdminIdentity(request);
  return ok({ authenticated: Boolean(user), user });
}

export async function POST(request: NextRequest) {
  const limit = rateLimit(request, { bucket: "admin-login", windowMs: 60_000, max: 8 });
  if (limit.limited) {
    return tooManyRequests(limit.retryAfterSeconds, "too many login attempts");
  }

  const body = (await readLimitedJson<{
    username?: unknown;
    password?: unknown;
  }>(request, 8_000).catch(() => null));

  const parsed = parseOrThrow(loginSchema, body ?? {});
  const identity = await verifyAdminUser(parsed.username, parsed.password);

  if (!identity) {
    return unauthorized("invalid username or password");
  }

  return setAdminSessionCookie(ok({ authenticated: true, user: identity }), identity);
}

export async function DELETE() {
  return clearAdminSessionCookie(ok({ authenticated: false }));
}
