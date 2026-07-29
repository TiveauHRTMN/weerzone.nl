import "server-only";

import { createHash } from "node:crypto";

type RateLimitEntry = {
  count: number;
  resetsAt: number;
};

type RateLimitGlobal = typeof globalThis & {
  calorRateLimits?: Map<string, RateLimitEntry>;
};

const rateLimitGlobal = globalThis as RateLimitGlobal;
const entries = rateLimitGlobal.calorRateLimits ?? new Map<string, RateLimitEntry>();
const MAXIMUM_TRACKED_KEYS = 10_000;

rateLimitGlobal.calorRateLimits = entries;

export type RateLimitResult =
  | { allowed: true; remaining: number }
  | { allowed: false; remaining: 0; retryAfterSeconds: number };

export function anonymizeRateLimitKey(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function clientAddress(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

export function checkRateLimit(input: {
  bucket: string;
  key: string;
  limit: number;
  windowMs: number;
  now?: number;
}): RateLimitResult {
  const now = input.now ?? Date.now();
  const storageKey = `${input.bucket}:${input.key}`;
  const current = entries.get(storageKey);

  if (!current || current.resetsAt <= now) {
    if (entries.size >= MAXIMUM_TRACKED_KEYS) {
      for (const [key, entry] of entries) {
        if (entry.resetsAt <= now) entries.delete(key);
      }
    }
    if (entries.size >= MAXIMUM_TRACKED_KEYS) {
      entries.delete(entries.keys().next().value as string);
    }
    entries.set(storageKey, { count: 1, resetsAt: now + input.windowMs });
    return { allowed: true, remaining: input.limit - 1 };
  }

  if (current.count >= input.limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetsAt - now) / 1_000)),
    };
  }

  current.count += 1;
  return { allowed: true, remaining: input.limit - current.count };
}
