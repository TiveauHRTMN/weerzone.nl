import { describe, expect, it } from "vitest";

import {
  anonymizeRateLimitKey,
  checkRateLimit,
  clientAddress,
} from "@/lib/security/rate-limit";

describe("rate limiting", () => {
  it("blocks requests after the configured fixed-window limit", () => {
    const key = `test-${crypto.randomUUID()}`;

    expect(
      checkRateLimit({ bucket: "test", key, limit: 2, windowMs: 60_000, now: 0 }),
    ).toMatchObject({ allowed: true, remaining: 1 });
    expect(
      checkRateLimit({ bucket: "test", key, limit: 2, windowMs: 60_000, now: 1 }),
    ).toMatchObject({ allowed: true, remaining: 0 });
    expect(
      checkRateLimit({ bucket: "test", key, limit: 2, windowMs: 60_000, now: 2 }),
    ).toMatchObject({ allowed: false, retryAfterSeconds: 60 });
  });

  it("starts a new window after expiry", () => {
    const key = `test-${crypto.randomUUID()}`;
    checkRateLimit({ bucket: "test", key, limit: 1, windowMs: 1_000, now: 0 });

    expect(
      checkRateLimit({ bucket: "test", key, limit: 1, windowMs: 1_000, now: 1_000 }),
    ).toMatchObject({ allowed: true, remaining: 0 });
  });

  it("uses the first forwarded client address and hashes sensitive keys", () => {
    expect(
      clientAddress(new Headers({ "x-forwarded-for": "203.0.113.4, 10.0.0.1" })),
    ).toBe("203.0.113.4");
    expect(anonymizeRateLimitKey("person@example.com")).not.toContain(
      "person@example.com",
    );
  });
});
