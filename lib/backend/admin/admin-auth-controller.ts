import type { NextRequest } from "next/server";
import {
  clearAdminSessionCookie,
  getAdminIdentity,
  setAdminSessionCookie,
} from "@/lib/backend/admin-auth";
import { ok, unauthorized } from "@/lib/backend/http";
import { verifyAdminUser } from "@/lib/backend/admin-user-service";
import { readLimitedJson } from "@/lib/backend/request-utils";
import { loginSchema, parseOrThrow } from "@/lib/validation/schemas";
import { enforceRateLimit } from "./admin-controller-utils";

export async function getSession(request: NextRequest) {
  const user = getAdminIdentity(request);
  return ok({ authenticated: Boolean(user), user });
}

export async function login(request: NextRequest) {
  const limited = enforceRateLimit(request, "admin-login", 8, "too many login attempts");
  if (limited) return limited;

  const body = await readLimitedJson<{
    username?: unknown;
    password?: unknown;
  }>(request, 8_000).catch(() => null);

  const parsed = parseOrThrow(loginSchema, body ?? {});
  const identity = await verifyAdminUser(parsed.username, parsed.password);

  if (!identity) {
    return unauthorized("invalid username or password");
  }

  return setAdminSessionCookie(ok({ authenticated: true, user: identity }), identity);
}

export async function logout() {
  return clearAdminSessionCookie(ok({ authenticated: false }));
}
