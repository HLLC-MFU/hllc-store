import "server-only";

import { createHmac, scryptSync, timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { unauthorized } from "@/lib/backend/http";

export const ADMIN_SESSION_COOKIE = "hllc_admin_session";
export const ADMIN_CSRF_COOKIE = "hllc_admin_csrf";
const SESSION_TTL_SECONDS = 60 * 60 * 8;
export type AdminRole = "superAdmin" | "admin";
export type AdminIdentity = { username: string; role: AdminRole };

function requiredEnv(name: string, fallback?: string) {
  const value = process.env[name] || fallback;

  if (process.env.NODE_ENV === "production" && !process.env[name]) {
    throw new Error(`${name} is required in production`);
  }

  return value || "";
}

export const ADMIN_USERNAME = requiredEnv("ADMIN_USERNAME", "adminae");
const COOKIE_SECURE = process.env.COOKIE_SECURE !== "false" && process.env.NODE_ENV === "production";
export const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || "";
export const ADMIN_PASSWORD =
  process.env.ADMIN_PASSWORD ||
  (process.env.NODE_ENV === "production" && ADMIN_PASSWORD_HASH
    ? ""
    : requiredEnv("ADMIN_PASSWORD", "admin12315"));

function sessionSecret() {
  return requiredEnv(
    "ADMIN_SESSION_SECRET",
    "dev-only-change-admin-session-secret-before-production",
  );
}

function sign(payload: string) {
  return createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);

  return left.length === right.length && timingSafeEqual(left, right);
}

export function createAdminSessionToken(identity: AdminIdentity) {
  const expiresAt = Date.now() + SESSION_TTL_SECONDS * 1000;
  const payload = `${identity.username}.${identity.role}.${expiresAt}`;

  return `${payload}.${sign(payload)}`;
}

export function hashAdminPassword(password: string, salt: string) {
  return `scrypt:${salt}:${scryptSync(password, salt, 64).toString("base64url")}`;
}

export function verifyAdminPassword(password: string) {
  if (ADMIN_PASSWORD_HASH) return verifyScryptPassword(password, ADMIN_PASSWORD_HASH);

  if (process.env.NODE_ENV === "production") {
    return false;
  }

  return safeEqual(password, ADMIN_PASSWORD);
}

export function verifyScryptPassword(password: string, passwordHash: string) {
  const [scheme, salt, expectedHash] = passwordHash.split(":");
  if (scheme !== "scrypt" || !salt || !expectedHash) return false;

  return safeEqual(hashAdminPassword(password, salt).split(":")[2], expectedHash);
}

export function verifyAdminSessionToken(token?: string) {
  if (!token) return false;

  return Boolean(getAdminIdentityFromToken(token));
}

export function getAdminIdentityFromToken(token?: string): AdminIdentity | null {
  if (!token) return null;

  const parts = token.split(".");
  if (parts.length !== 4) return null;

  const [username, role, expiresAtValue, signature] = parts;
  const expiresAt = Number(expiresAtValue);
  if (
    !username ||
    !["superAdmin", "admin"].includes(role) ||
    !Number.isFinite(expiresAt) ||
    expiresAt < Date.now()
  ) {
    return null;
  }

  if (!safeEqual(signature, sign(`${username}.${role}.${expiresAtValue}`))) {
    return null;
  }

  return { username, role: role as AdminRole };
}

export function setAdminSessionCookie(response: NextResponse, identity: AdminIdentity) {
  const csrfToken = sign(`csrf.${Date.now()}.${Math.random()}`);

  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: createAdminSessionToken(identity),
    httpOnly: true,
    sameSite: "lax",
    secure: COOKIE_SECURE,
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  response.cookies.set({
    name: ADMIN_CSRF_COOKIE,
    value: csrfToken,
    httpOnly: false,
    sameSite: "lax",
    secure: COOKIE_SECURE,
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });

  return response;
}

export function clearAdminSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: COOKIE_SECURE,
    path: "/",
    maxAge: 0,
  });
  response.cookies.set({
    name: ADMIN_CSRF_COOKIE,
    value: "",
    httpOnly: false,
    sameSite: "lax",
    secure: COOKIE_SECURE,
    path: "/",
    maxAge: 0,
  });

  return response;
}

export function isAdminRequest(request: NextRequest) {
  return Boolean(getAdminIdentity(request));
}

export function getAdminIdentity(request: NextRequest) {
  return getAdminIdentityFromToken(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);
}

export async function hasAdminSession() {
  const cookieStore = await cookies();

  return verifyAdminSessionToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
}

export async function getCurrentAdminIdentity() {
  const cookieStore = await cookies();

  return getAdminIdentityFromToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
}

export function isCsrfSafe(request: NextRequest) {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method)) return true;

  const csrfCookie = request.cookies.get(ADMIN_CSRF_COOKIE)?.value || "";
  const csrfHeader = request.headers.get("x-admin-csrf") || "";

  return Boolean(csrfCookie) && safeEqual(csrfCookie, csrfHeader);
}

export function requireAdmin(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return unauthorized("admin session required");
  }

  if (!isCsrfSafe(request)) {
    return unauthorized("invalid csrf token");
  }

  return null;
}

export function requireSuperAdmin(request: NextRequest) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  const identity = getAdminIdentity(request);
  if (identity?.role !== "superAdmin") {
    return unauthorized("super admin required");
  }

  return null;
}
