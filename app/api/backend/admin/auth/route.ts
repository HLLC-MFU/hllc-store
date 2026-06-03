import { NextRequest, NextResponse } from "next/server";
import {
  clearAdminSessionCookie,
  getAdminIdentity,
  setAdminSessionCookie,
} from "@/lib/backend/admin-auth";
import { ok, unauthorized } from "@/lib/backend/http";
import { verifyAdminUser } from "@/lib/backend/admin-user-service";
import { readLimitedJson } from "@/lib/backend/request-utils";
import { loginSchema, parseOrThrow } from "@/lib/schemas";

const attempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 8;

function clientKey(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "local"
  );
}

function rateLimit(request: NextRequest) {
  const key = clientKey(request);
  const now = Date.now();
  const record = attempts.get(key);

  if (!record || record.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  record.count += 1;
  return record.count > MAX_ATTEMPTS;
}

export async function GET(request: NextRequest) {
  const user = getAdminIdentity(request);
  return ok({ authenticated: Boolean(user), user });
}

export async function POST(request: NextRequest) {
  if (rateLimit(request)) {
    return NextResponse.json(
      { error: "too many login attempts" },
      { status: 429 },
    );
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
