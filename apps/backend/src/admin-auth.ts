import { createHmac, scryptSync, timingSafeEqual } from "crypto";
import { unauthorized } from "./http.js";

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
  if (process.env.NODE_ENV === "production") return false;
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

function parseCookies(request: Request): Record<string, string> {
  const cookieHeader = request.headers.get("cookie") || "";
  const result: Record<string, string> = {};
  for (const part of cookieHeader.split(";")) {
    const idx = part.indexOf("=");
    if (idx < 0) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (key) result[key] = val;
  }
  return result;
}

export function sessionCookieHeaders(identity: AdminIdentity): string[] {
  const csrfToken = sign(`csrf.${Date.now()}.${Math.random()}`);
  const token = createAdminSessionToken(identity);
  const secure = COOKIE_SECURE ? "; Secure" : "";
  const base = `; Path=/; SameSite=Lax${secure}; Max-Age=${SESSION_TTL_SECONDS}`;
  return [
    `${ADMIN_SESSION_COOKIE}=${token}; HttpOnly${base}`,
    `${ADMIN_CSRF_COOKIE}=${csrfToken}${base}`,
  ];
}

export function clearCookieHeaders(): string[] {
  return [
    `${ADMIN_SESSION_COOKIE}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`,
    `${ADMIN_CSRF_COOKIE}=; Path=/; SameSite=Lax; Max-Age=0`,
  ];
}

export function getAdminIdentity(request: Request): AdminIdentity | null {
  const cookies = parseCookies(request);
  return getAdminIdentityFromToken(cookies[ADMIN_SESSION_COOKIE]);
}

export function isAdminRequest(request: Request) {
  return Boolean(getAdminIdentity(request));
}

export function isCsrfSafe(request: Request) {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method)) return true;
  const cookies = parseCookies(request);
  const csrfCookie = cookies[ADMIN_CSRF_COOKIE] || "";
  const csrfHeader = request.headers.get("x-admin-csrf") || "";
  return Boolean(csrfCookie) && safeEqual(csrfCookie, csrfHeader);
}

export function requireAdmin(request: Request): Response | null {
  if (!isAdminRequest(request)) return unauthorized("admin session required");
  if (!isCsrfSafe(request)) return unauthorized("invalid csrf token");
  return null;
}

export function requireSuperAdmin(request: Request): Response | null {
  const authError = requireAdmin(request);
  if (authError) return authError;
  const identity = getAdminIdentity(request);
  if (identity?.role !== "superAdmin") return unauthorized("super admin required");
  return null;
}
