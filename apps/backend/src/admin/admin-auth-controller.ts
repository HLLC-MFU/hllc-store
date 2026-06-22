import {
  clearCookieHeaders,
  getAdminIdentity,
  sessionCookieHeaders,
} from "../admin-auth";
import { ok, okWithCookies, unauthorized } from "../http";
import { verifyAdminUser } from "../admin-user-service";
import { readLimitedJson } from "../request-utils";
import { loginSchema, parseOrThrow } from "@hllc/shared/validation/schemas";
import { enforceRateLimit } from "./admin-controller-utils";

export async function getSession(request: Request) {
  const user = getAdminIdentity(request);
  return ok({ authenticated: Boolean(user), user });
}

export async function login(request: Request) {
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

  return okWithCookies({ authenticated: true, user: identity }, sessionCookieHeaders(identity));
}

export async function logout() {
  return okWithCookies({ authenticated: false }, clearCookieHeaders());
}
