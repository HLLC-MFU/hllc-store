import "server-only";

import type { NextRequest } from "next/server";

/**
 * In-memory fixed-window rate limiter, keyed per client + bucket name.
 *
 * NOTE: state lives in the process memory, so it resets on restart and is not
 * shared across multiple instances. For a single-instance deployment this is
 * enough to blunt brute-force / abuse. Swap the Map for Redis if you scale out.
 */
type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

// Trusted proxy hops to skip when reading X-Forwarded-For. When the app sits
// behind exactly one proxy/CDN, the real client IP is the LAST entry that the
// proxy appended, not the first (which the client can spoof freely).
const TRUSTED_PROXY_HOPS = Number(process.env.TRUSTED_PROXY_HOPS ?? "1");

export function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const parts = forwarded.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length > 0) {
      // Take the entry the trusted proxy appended (count from the right).
      const idx = Math.max(0, parts.length - 1 - Math.max(0, TRUSTED_PROXY_HOPS - 1));
      return parts[idx] ?? parts[parts.length - 1];
    }
  }

  return request.headers.get("x-real-ip")?.trim() || "local";
}

export type RateLimitOptions = {
  /** Logical name so different endpoints don't share a counter. */
  bucket: string;
  /** Window length in milliseconds. */
  windowMs: number;
  /** Max requests allowed per window. */
  max: number;
};

export type RateLimitResult = {
  limited: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

export function rateLimit(request: NextRequest, opts: RateLimitOptions): RateLimitResult {
  const key = `${opts.bucket}:${clientIp(request)}`;
  const nowMs = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= nowMs) {
    buckets.set(key, { count: 1, resetAt: nowMs + opts.windowMs });
    return { limited: false, remaining: opts.max - 1, retryAfterSeconds: 0 };
  }

  existing.count += 1;
  const limited = existing.count > opts.max;
  return {
    limited,
    remaining: Math.max(0, opts.max - existing.count),
    retryAfterSeconds: limited ? Math.ceil((existing.resetAt - nowMs) / 1000) : 0,
  };
}

// Opportunistic cleanup so the Map doesn't grow unbounded.
if (typeof setInterval === "function") {
  setInterval(() => {
    const nowMs = Date.now();
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= nowMs) buckets.delete(key);
    }
  }, 5 * 60_000).unref?.();
}
